const express = require("express");
const router = express.Router();
const resultController = require("../controllers/resultController");
const auth = require("../middlewares/authMiddleware");

router.post(
  "/results",
  auth(["admin", "teacher"]),
  resultController.upsertResult
);
router.get(
  "/results/student/:student_id",
  auth(["admin", "teacher"]),
  resultController.getStudentResults
);
router.get(
  "/results/class/:class_id",
  auth(["admin", "teacher"]),
  resultController.getClassResults
);

module.exports = router;
