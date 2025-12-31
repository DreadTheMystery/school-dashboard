const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const reportCardController = require("../controllers/reportCardController");

// Teacher: save draft (upsert)
router.post(
  "/report-cards/draft",
  auth(["teacher"]),
  reportCardController.upsertDraft
);

// Teacher: generate immutable report card from APPROVED results
router.post(
  "/report-cards/generate",
  auth(["teacher"]),
  reportCardController.generateFromResults
);

// Teacher: list own
router.get(
  "/report-cards/mine",
  auth(["teacher"]),
  reportCardController.myReports
);

// Teacher + Admin: fetch one
router.get(
  "/report-cards/:id",
  auth(["teacher", "admin"]),
  reportCardController.getById
);

// Teacher + Admin: list a student's generated/approved report cards (archive)
router.get(
  "/report-cards/student/:student_id",
  auth(["teacher", "admin"]),
  reportCardController.studentArchive
);

// Teacher: submit
router.post(
  "/report-cards/:id/submit",
  auth(["teacher"]),
  reportCardController.submit
);

// Admin: list
router.get("/report-cards", auth(["admin"]), reportCardController.listAdmin);

// Admin: approve
router.post(
  "/report-cards/:id/approve",
  auth(["admin"]),
  reportCardController.approve
);

module.exports = router;
