const express = require("express");
const router = express.Router();
const classController = require("../controllers/classController");
const auth = require("../middlewares/authMiddleware");

router.post("/classes", auth(["admin"]), classController.addClass);
router.post(
  "/classes/seed-default",
  auth(["admin"]),
  classController.seedDefaultClasses
);
router.get(
  "/classes",
  auth(["admin", "account", "teacher"]),
  classController.getClasses
);
router.get(
  "/classes-with-students",
  auth(["admin", "account", "teacher"]),
  classController.getClassesWithStudents
);

router.delete("/classes/:id", auth(["admin"]), classController.deleteClass);

module.exports = router;
