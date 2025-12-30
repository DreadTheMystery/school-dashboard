const Student = require("../models/studentModel");

exports.addStudent = (req, res) => {
  const student = req.body;

  if (req.user?.role === "teacher") {
    const assignedClassId = req.user?.assigned_class_id;
    if (!assignedClassId) {
      return res
        .status(403)
        .json({ message: "Teacher is not assigned to any class" });
    }

    if (
      student.class_id &&
      Number(student.class_id) !== Number(assignedClassId)
    ) {
      return res
        .status(403)
        .json({
          message: "Teachers can only add students to their assigned class",
        });
    }

    student.class_id = Number(assignedClassId);
  }

  if (!student.full_name || !student.admission_no) {
    return res
      .status(400)
      .json({ message: "Full name and admission number are required" });
  }

  Student.create(student, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.status(201).json({
      message: "Student added successfully",
      student_id: result.id,
    });
  });
};

exports.getStudents = (req, res) => {
  Student.getAll((err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows);
  });
};

exports.assignClass = (req, res) => {
  const { student_id, class_id } = req.body;

  if (!student_id || !class_id) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const sql = "UPDATE students SET class_id = ? WHERE id = ?";
  const db = require("../models/db");

  db.run(sql, [class_id, student_id], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    res.json({ message: "Student assigned to class successfully" });
  });
};

exports.updateStudent = (req, res) => {
  const { id } = req.params;
  const fields = req.body || {};

  const keys = Object.keys(fields);
  if (!keys.length) {
    return res.status(400).json({ message: "No fields provided" });
  }

  const updates = keys.map((key) => `${key} = ?`).join(", ");
  const values = Object.values(fields);

  const sql = `UPDATE students SET ${updates} WHERE id = ?`;
  const db = require("../models/db");

  db.run(sql, [...values, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    res.json({ message: "Student updated successfully" });
  });
};

exports.deleteStudent = (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: "Missing student id" });

  const sql = "DELETE FROM students WHERE id = ?";
  const db = require("../models/db");

  db.run(sql, [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    res.json({ message: "Student deleted" });
  });
};
