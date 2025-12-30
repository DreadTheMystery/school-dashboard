const Payment = require("../models/paymentModel");

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
  Payment.getAllByStudent(student_id, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.getPaymentSummary = (req, res) => {
  Payment.getSummary((err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};
