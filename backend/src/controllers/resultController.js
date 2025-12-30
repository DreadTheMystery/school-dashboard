const Result = require("../models/resultModel");

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

  const payload = {
    student_id,
    term,
    session,
    test_score: test,
    exam_score: exam,
    total_score: total,
    created_by: req.user?.id,
    created_at: new Date().toISOString(),
  };

  Result.upsert(payload, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    res.status(201).json({
      message: "Result saved",
      result_id: result.id,
      total_score: total,
    });
  });
};

exports.getStudentResults = (req, res) => {
  const { student_id } = req.params;
  const { term, session } = req.query || {};

  Result.getByStudent(student_id, { term, session }, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.getClassResults = (req, res) => {
  const { class_id } = req.params;
  const { term, session } = req.query || {};

  Result.getByClass(class_id, { term, session }, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};
