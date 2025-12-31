const Payment = require("../models/paymentModel");
const Student = require("../models/studentModel");
const User = require("../models/userModel");

exports.addPayment = (req, res) => {
  const payment = req.body;

  const normalizedType = payment.payment_type === "half" ? "half" : "full";
  const amountPaid = Number(payment.amount_paid);
  const amountRemaining =
    normalizedType === "half" ? Number(payment.amount_remaining) : 0;

  if (
    !payment.student_id ||
    !payment.amount_paid ||
    !payment.term ||
    !payment.session
  ) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  if (
    Number.isNaN(amountPaid) ||
    (normalizedType === "half" && Number.isNaN(amountRemaining))
  ) {
    return res.status(400).json({ message: "Invalid payment amounts" });
  }

  payment.payment_type = normalizedType;
  payment.amount_paid = amountPaid;
  payment.amount_remaining = amountRemaining;

  Payment.create(payment, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    res
      .status(201)
      .json({ message: "Payment recorded", payment_id: result.id });
  });
};

exports.getStudentPayments = (req, res) => {
  const student_id = req.params.student_id;
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

      Student.getById(student_id, (stErr, student) => {
        if (stErr) return res.status(500).json({ error: stErr.message });
        if (!student)
          return res.status(404).json({ message: "Student not found" });

        if (Number(student.class_id) !== Number(assignedClassId)) {
          return res
            .status(403)
            .json({ message: "Access denied for this student" });
        }

        Payment.getAllByStudent(student_id, (err, rows) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json(rows);
        });
      });
    });
    return;
  }

  Payment.getAllByStudent(student_id, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.getPaymentSummary = (req, res) => {
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

      Payment.getSummaryForClass(assignedClassId, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
      });
    });
    return;
  }

  Payment.getSummary((err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};
