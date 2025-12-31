const ReportCard = require("../models/reportCardModel");
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

function getResultOne(studentId, term, session) {
  return new Promise((resolve, reject) => {
    Result.getOne(studentId, term, session, (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

function createGeneratedReportCard(input) {
  return new Promise((resolve, reject) => {
    ReportCard.createGenerated(input, (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

/**
 * Generate an immutable report card record from APPROVED results.
 * - Does NOT modify results.
 * - Creates a report_cards row with status='generated' (immutable).
 */
async function generateFromApprovedResult({
  actorUser,
  studentId,
  term,
  session,
}) {
  if (!actorUser?.id || actorUser.role !== "teacher") {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }

  const studentIdNum = Number(studentId);
  if (!studentIdNum || !term || !session) {
    const err = new Error("student_id, term and session are required");
    err.status = 400;
    throw err;
  }

  const assignedClassId = await getTeacherAssignedClassId(actorUser.id);
  if (!assignedClassId) {
    const err = new Error("Teacher is not assigned to any class");
    err.status = 403;
    throw err;
  }

  const student = await getStudentById(studentIdNum);
  if (!student) {
    const err = new Error("Student not found");
    err.status = 404;
    throw err;
  }

  if (Number(student.class_id) !== Number(assignedClassId)) {
    const err = new Error("Student not in your class");
    err.status = 403;
    throw err;
  }

  const termTrim = String(term).trim();
  const sessionTrim = String(session).trim();

  const result = await getResultOne(studentIdNum, termTrim, sessionTrim);
  if (!result) {
    const err = new Error("No result found for this term/session");
    err.status = 400;
    throw err;
  }

  if (String(result.status || "draft") !== "approved") {
    const err = new Error(
      "Only APPROVED results can be used to generate a report card"
    );
    err.status = 400;
    throw err;
  }

  const payload = {
    kind: "result_based",
    student: {
      id: studentIdNum,
      full_name: student.full_name,
      admission_no: student.admission_no,
      gender: student.gender || "",
    },
    class_id: Number(student.class_id),
    term: termTrim,
    session: sessionTrim,
    scores: {
      test: Number(result.test_score || 0),
      exam: Number(result.exam_score || 0),
      total: Number(result.total_score || 0),
    },
    generated_at: new Date().toISOString(),
  };

  const row = await createGeneratedReportCard({
    teacher_id: actorUser.id,
    student_id: studentIdNum,
    class_id: Number(student.class_id),
    term: termTrim,
    session: sessionTrim,
    source_result_id: Number(result.id || 0) || null,
    payload_json: JSON.stringify(payload),
  });

  if (!row?.id) {
    const err = new Error("Failed to generate report card");
    err.status = 500;
    throw err;
  }

  return { id: row.id, status: row.status || "generated" };
}

module.exports = {
  generateFromApprovedResult,
};
