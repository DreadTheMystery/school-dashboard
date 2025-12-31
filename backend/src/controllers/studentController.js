const Student = require("../models/studentModel");
const User = require("../models/userModel");

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
      return res.status(403).json({
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
  if (req.user?.role === "teacher") {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Missing token" });

    User.findById(userId, (uErr, user) => {
      if (uErr) return res.status(500).json({ error: uErr.message });
      if (!user) return res.status(404).json({ message: "User not found" });

      const assignedClassId = user.assigned_class_id;
      if (!assignedClassId) {
        return res
          .status(403)
          .json({ message: "Teacher is not assigned to any class" });
      }

      Student.getAllByClass(assignedClassId, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
      });
    });
    return;
  }

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

  const studentIdNum = Number(id);
  if (!studentIdNum) {
    return res.status(400).json({ message: "Invalid student id" });
  }

  const allowedFields = new Set([
    "admission_no",
    "full_name",
    "gender",
    "date_of_birth",
    "religion",
    "class_id",
    "guardian_name",
    "guardian_phone",
    "photo_data_url",
  ]);

  const isTeacher = req.user?.role === "teacher";
  const requestedKeys = Object.keys(fields);

  if (!requestedKeys.length) {
    return res.status(400).json({ message: "No fields provided" });
  }

  // Teachers can only upload/update a student's photo.
  const permittedKeys = requestedKeys.filter((key) => {
    if (!allowedFields.has(key)) return false;
    if (isTeacher) return key === "photo_data_url";
    return true;
  });

  if (!permittedKeys.length) {
    return res.status(400).json({
      message: isTeacher
        ? "Teachers can only update student photo"
        : "No updatable fields provided",
    });
  }

  const db = require("../models/db");
  const Student = require("../models/studentModel");
  const User = require("../models/userModel");

  const runUpdate = () => {
    const updates = permittedKeys.map((key) => `${key} = ?`).join(", ");
    const values = permittedKeys.map((key) => fields[key]);
    const sql = `UPDATE students SET ${updates} WHERE id = ?`;

    db.run(sql, [...values, studentIdNum], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (!this.changes)
        return res.status(404).json({ message: "Student not found" });
      res.json({ message: "Student updated successfully" });
    });
  };

  if (!isTeacher) {
    return runUpdate();
  }

  // Teacher scoping: only allow updates for students in teacher's assigned class.
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Missing token" });

  User.findById(userId, (uErr, user) => {
    if (uErr) return res.status(500).json({ error: uErr.message });
    if (!user) return res.status(404).json({ message: "User not found" });

    const assignedClassId = Number(user.assigned_class_id || 0);
    if (!assignedClassId) {
      return res
        .status(403)
        .json({ message: "Teacher is not assigned to any class" });
    }

    Student.getById(studentIdNum, (stErr, student) => {
      if (stErr) return res.status(500).json({ error: stErr.message });
      if (!student)
        return res.status(404).json({ message: "Student not found" });

      if (Number(student.class_id) !== assignedClassId) {
        return res
          .status(403)
          .json({ message: "Access denied for this student" });
      }

      return runUpdate();
    });
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
