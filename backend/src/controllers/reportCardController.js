const ReportCard = require("../models/reportCardModel");
const User = require("../models/userModel");
const Student = require("../models/studentModel");
const {
  generateFromApprovedResult,
} = require("../services/reportCardGenerationService");

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

const reportCardController = {
  upsertDraft: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const { student_id, term, session, payload } = req.body || {};

      const studentIdNum = Number(student_id);
      if (!studentIdNum || !term || !session || !payload) {
        return res.status(400).json({
          error: "student_id, term, session and payload are required",
        });
      }

      // Teacher scoping: only allow assigned-class students
      if (req.user.role === "teacher") {
        const assignedClassId = await getTeacherAssignedClassId(teacherId);
        if (!assignedClassId) {
          return res
            .status(403)
            .json({ error: "Teacher has no assigned class" });
        }

        const student = await getStudentById(studentIdNum);
        if (!student)
          return res.status(404).json({ error: "Student not found" });

        if (Number(student.class_id) !== Number(assignedClassId)) {
          return res.status(403).json({ error: "Student not in your class" });
        }
      }

      const payloadJson = JSON.stringify(payload);

      ReportCard.upsertDraft(
        {
          teacher_id: teacherId,
          student_id: studentIdNum,
          term: String(term).trim(),
          session: String(session).trim(),
          payload_json: payloadJson,
        },
        (err, row) => {
          if (err) return res.status(500).json({ error: err.message });
          return res.json({ ok: true, id: row?.id, status: row?.status });
        }
      );
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  myReports: (req, res) => {
    const status = req.query.status ? String(req.query.status) : null;
    ReportCard.listForTeacher(req.user.id, status, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows || []);
    });
  },

  listAdmin: (req, res) => {
    const status = req.query.status ? String(req.query.status) : null;
    ReportCard.listForAdmin(status, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows || []);
    });
  },

  getById: (req, res) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });

    ReportCard.getById(id, (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Not found" });

      // Teacher can only view own
      if (
        req.user.role === "teacher" &&
        Number(row.teacher_id) !== req.user.id
      ) {
        // Allow teachers to view final/generated report cards for students in their assigned class
        const status = String(row.status || "draft");
        if (!["submitted", "approved", "generated"].includes(status)) {
          return res.status(403).json({ error: "Forbidden" });
        }

        getTeacherAssignedClassId(req.user.id)
          .then((assignedClassId) => {
            if (!assignedClassId) {
              return res
                .status(403)
                .json({ error: "Teacher has no assigned class" });
            }

            const studentClassId = Number(row.student_class_id || 0);
            if (
              !studentClassId ||
              Number(studentClassId) !== Number(assignedClassId)
            ) {
              return res.status(403).json({ error: "Forbidden" });
            }

            let payload = null;
            try {
              payload = row.payload_json ? JSON.parse(row.payload_json) : null;
            } catch (_e) {
              payload = null;
            }

            return res.json({
              ...row,
              payload,
            });
          })
          .catch((e) => res.status(500).json({ error: e.message }));
        return;
      }

      let payload = null;
      try {
        payload = row.payload_json ? JSON.parse(row.payload_json) : null;
      } catch (_e) {
        payload = null;
      }

      res.json({
        ...row,
        payload,
      });
    });
  },

  generateFromResults: async (req, res) => {
    try {
      const { student_id, term, session } = req.body || {};
      const out = await generateFromApprovedResult({
        actorUser: req.user,
        studentId: student_id,
        term,
        session,
      });
      return res.json({ ok: true, ...out });
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  },

  studentArchive: async (req, res) => {
    try {
      const studentIdNum = Number(req.params.student_id);
      if (!studentIdNum) {
        return res.status(400).json({ error: "Invalid student" });
      }

      const session = req.query.session
        ? String(req.query.session).trim()
        : null;

      if (req.user.role === "teacher") {
        const assignedClassId = await getTeacherAssignedClassId(req.user.id);
        if (!assignedClassId) {
          return res
            .status(403)
            .json({ error: "Teacher has no assigned class" });
        }

        const student = await getStudentById(studentIdNum);
        if (!student)
          return res.status(404).json({ error: "Student not found" });
        if (Number(student.class_id) !== Number(assignedClassId)) {
          return res.status(403).json({ error: "Student not in your class" });
        }
      }

      ReportCard.listFinalForStudent(studentIdNum, session, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        return res.json(rows || []);
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  submit: (req, res) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });

    ReportCard.submit({ id, teacher_id: req.user.id }, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!result?.changes)
        return res.status(400).json({ error: "Cannot submit this report" });
      res.json({ ok: true });
    });
  },

  approve: (req, res) => {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });

    ReportCard.approve({ id, reviewed_by: req.user.id }, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!result?.changes) return res.status(404).json({ error: "Not found" });
      res.json({ ok: true });
    });
  },
};

module.exports = reportCardController;
