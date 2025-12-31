const Result = require("../models/resultModel");
const User = require("../models/userModel");
const Student = require("../models/studentModel");

function getTeacherAssignedClassId(userId) {
  return new Promise((resolve, reject) => {
    User.findById(userId, (err, row) => {
      if (err) return reject(err);
      resolve(Number(row?.assigned_class_id || 0));
    });
  });
}

function getStudentById(studentId) {
  return new Promise((resolve, reject) => {
    Student.getById(studentId, (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};

exports.upsertResult = (req, res) => {
  const { student_id, term, session, test_score, exam_score } = req.body || {};

  if (!student_id || !term || !session) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const test = toNumber(test_score ?? 0);
  const exam = toNumber(exam_score ?? 0);

  if (Number.isNaN(test) || Number.isNaN(exam) || test < 0 || exam < 0) {
    return res.status(400).json({ message: "Invalid scores" });
  }

  const total = test + exam;

  (async () => {
    try {
      const studentIdNum = Number(student_id);
      if (!studentIdNum) {
        return res.status(400).json({ message: "Invalid student_id" });
      }

      // Teacher scoping: only allow assigned-class students
      if (req.user.role === "teacher") {
        const assignedClassId = await getTeacherAssignedClassId(req.user.id);
        if (!assignedClassId) {
          return res
            .status(403)
            .json({ message: "Teacher is not assigned to any class" });
        }

        const student = await getStudentById(studentIdNum);
        if (!student)
          return res.status(404).json({ message: "Student not found" });
        if (Number(student.class_id) !== Number(assignedClassId)) {
          return res.status(403).json({ message: "Student not in your class" });
        }
      }

      // Lock edits after submission/approval
      Result.getOne(
        studentIdNum,
        String(term).trim(),
        String(session).trim(),
        (findErr, existing) => {
          if (findErr) return res.status(500).json({ error: findErr.message });
          const status = String(existing?.status || "draft");

          if (existing) {
            if (req.user.role === "teacher" && status !== "draft") {
              return res
                .status(403)
                .json({
                  message: "Result is submitted/approved and cannot be edited",
                });
            }
            if (req.user.role === "admin" && status === "approved") {
              return res
                .status(403)
                .json({ message: "Approved result cannot be edited" });
            }
          }

          const payload = {
            student_id: studentIdNum,
            term: String(term).trim(),
            session: String(session).trim(),
            test_score: test,
            exam_score: exam,
            total_score: total,
            status: status || "draft",
            created_by: req.user?.id,
            created_at: new Date().toISOString(),
          };

          Result.upsert(payload, (err, result) => {
            if (err) return res.status(500).json({ error: err.message });

            res.status(201).json({
              message: "Result saved",
              result_id: result.id,
              total_score: total,
              status: payload.status,
            });
          });
        }
      );
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  })();
};

exports.getStudentResults = (req, res) => {
  const { student_id } = req.params;
  const { term, session } = req.query || {};

  (async () => {
    try {
      const studentIdNum = Number(student_id);
      if (!studentIdNum)
        return res.status(400).json({ message: "Invalid student" });

      if (req.user.role === "teacher") {
        const assignedClassId = await getTeacherAssignedClassId(req.user.id);
        if (!assignedClassId) {
          return res
            .status(403)
            .json({ message: "Teacher is not assigned to any class" });
        }

        const student = await getStudentById(studentIdNum);
        if (!student)
          return res.status(404).json({ message: "Student not found" });
        if (Number(student.class_id) !== Number(assignedClassId)) {
          return res.status(403).json({ message: "Student not in your class" });
        }
      }

      Result.getByStudent(studentIdNum, { term, session }, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  })();
};

exports.getClassResults = (req, res) => {
  const { class_id } = req.params;
  const { term, session } = req.query || {};

  (async () => {
    try {
      const classIdNum = Number(class_id);
      if (!classIdNum)
        return res.status(400).json({ message: "Invalid class" });

      if (req.user.role === "teacher") {
        const assignedClassId = await getTeacherAssignedClassId(req.user.id);
        if (!assignedClassId) {
          return res
            .status(403)
            .json({ message: "Teacher is not assigned to any class" });
        }
        if (Number(assignedClassId) !== Number(classIdNum)) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }

      Result.getByClass(classIdNum, { term, session }, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  })();
};

exports.submitClassResults = (req, res) => {
  const classIdNum = Number(req.params.class_id);
  const { term, session } = req.body || {};
  if (!classIdNum || !term || !session) {
    return res
      .status(400)
      .json({ message: "class_id, term and session are required" });
  }

  (async () => {
    try {
      // Teacher scoping: only their assigned class
      if (req.user.role === "teacher") {
        const assignedClassId = await getTeacherAssignedClassId(req.user.id);
        if (!assignedClassId) {
          return res
            .status(403)
            .json({ message: "Teacher is not assigned to any class" });
        }
        if (Number(assignedClassId) !== Number(classIdNum)) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }

      Result.listMissingForClass(
        classIdNum,
        String(term).trim(),
        String(session).trim(),
        (missErr, missing) => {
          if (missErr) return res.status(500).json({ error: missErr.message });
          if ((missing || []).length) {
            return res.status(400).json({
              message: "Cannot submit: some students are missing results",
              missing,
            });
          }

          Result.submitClass(
            classIdNum,
            String(term).trim(),
            String(session).trim(),
            req.user.id,
            (subErr, info) => {
              if (subErr)
                return res.status(500).json({ error: subErr.message });
              return res.json({ ok: true, changes: info?.changes || 0 });
            }
          );
        }
      );
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  })();
};

exports.approveClassResults = (req, res) => {
  const classIdNum = Number(req.params.class_id);
  const { term, session } = req.body || {};
  if (!classIdNum || !term || !session) {
    return res
      .status(400)
      .json({ message: "class_id, term and session are required" });
  }

  Result.listMissingForClass(
    classIdNum,
    String(term).trim(),
    String(session).trim(),
    (missErr, missing) => {
      if (missErr) return res.status(500).json({ error: missErr.message });
      if ((missing || []).length) {
        return res.status(400).json({
          message: "Cannot approve: some students are missing results",
          missing,
        });
      }

      Result.approveClass(
        classIdNum,
        String(term).trim(),
        String(session).trim(),
        req.user.id,
        (appErr, info) => {
          if (appErr) return res.status(500).json({ error: appErr.message });
          return res.json({ ok: true, changes: info?.changes || 0 });
        }
      );
    }
  );
};
