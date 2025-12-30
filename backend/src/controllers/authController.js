const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const SECRET = "your_secret_key_here"; // TODO: move to env var

exports.register = (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  User.create({ username, password, role }, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: "User registered", user_id: result.id });
  });
};

exports.login = (req, res) => {
  const { username, password, role: requestedRole } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Missing credentials" });
  }

  User.findByUsername(username, (err, user) => {
    if (err || !user)
      return res.status(400).json({ message: "Invalid credentials" });

    bcrypt.compare(password, user.password, (compareErr, valid) => {
      if (compareErr || !valid)
        return res.status(400).json({ message: "Invalid credentials" });

      if (user.is_active === 0) {
        return res.status(403).json({ message: "Account disabled" });
      }

      if (requestedRole && requestedRole !== user.role) {
        return res
          .status(403)
          .json({ message: "Role mismatch. Pick your assigned role." });
      }

      const token = jwt.sign(
        {
          id: user.id,
          role: user.role,
          assigned_class_id: user.assigned_class_id ?? null,
        },
        SECRET,
        {
          expiresIn: "8h",
        }
      );
      res.json({
        token,
        role: user.role,
        username: user.username,
        assigned_class_id: user.assigned_class_id ?? null,
      });
    });
  });
};
