const express = require("express");
const cors = require("cors");

const studentRoutes = require("./routes/studentRoutes");
const classRoutes = require("./routes/classRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const authRoutes = require("./routes/authRoutes");
const resultRoutes = require("./routes/resultRoutes");
const userRoutes = require("./routes/userRoutes");
const classController = require("./controllers/classController");
const auth = require("./middlewares/authMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api", studentRoutes);
app.use("/api", classRoutes);
app.use("/api", paymentRoutes);
app.use("/api", resultRoutes);
app.use("/api", userRoutes);

// Fallback registration to ensure seed route is always reachable
app.post(
  "/api/classes/seed-default",
  auth(["admin"]),
  classController.seedDefaultClasses
);

app.get("/", (req, res) => {
  res.json({ message: "School Management System API running" });
});

module.exports = app;
