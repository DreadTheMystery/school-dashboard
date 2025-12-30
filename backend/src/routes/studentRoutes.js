const express = require("express");
const router = express.Router();
const studentController = require("../controllers/studentController");
const auth = require("../middlewares/authMiddleware");

router.post(
  "/students",
  auth(["admin", "account", "teacher"]),
  studentController.addStudent
);
router.get(
  "/students",
  auth(["admin", "account", "teacher"]),
  studentController.getStudents
);
router.put(
  "/students/assign-class",
  auth(["admin", "account"]),
  studentController.assignClass
);
router.patch(
  "/students/:id",
  auth(["admin", "account"]),
  studentController.updateStudent
);
router.delete(
  "/students/:id",
  auth(["admin"]),
  studentController.deleteStudent
);

module.exports = router;
