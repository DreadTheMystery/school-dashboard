const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const auth = require("../middlewares/authMiddleware");

router.post(
  "/payments",
  auth(["admin", "account"]),
  paymentController.addPayment
);
router.get(
  "/payments/student/:student_id",
  auth(["admin", "account", "teacher"]),
  paymentController.getStudentPayments
);
router.get(
  "/payments/summary",
  auth(["admin", "account", "teacher"]),
  paymentController.getPaymentSummary
);

module.exports = router;
