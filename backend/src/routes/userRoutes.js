const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const auth = require("../middlewares/authMiddleware");

router.get(
  "/users/me",
  auth(["admin", "teacher", "account"]),
  userController.getMe
);
router.get("/users", auth(["admin"]), userController.listUsers);
router.post("/users", auth(["admin"]), userController.createUser);
router.patch("/users/:id/active", auth(["admin"]), userController.setActive);
router.patch(
  "/users/:id/password",
  auth(["admin"]),
  userController.resetPassword
);
router.patch(
  "/users/:id/assign-class",
  auth(["admin"]),
  userController.assignClass
);

module.exports = router;
