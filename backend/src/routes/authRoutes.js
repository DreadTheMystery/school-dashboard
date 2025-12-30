const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const auth = require("../middlewares/authMiddleware");

router.post("/bootstrap", userController.bootstrapAdmin);
router.post("/register", auth(["admin"]), authController.register);
router.post("/login", authController.login);

module.exports = router;
