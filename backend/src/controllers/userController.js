const User = require("../models/userModel");

const ALLOWED_ROLES = new Set(["admin", "teacher", "account"]);

exports.listUsers = (req, res) => {
  User.listAll((err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.createUser = (req, res) => {
  const { username, password, role } = req.body || {};

  const cleanUsername = typeof username === "string" ? username.trim() : "";
  const cleanRole = typeof role === "string" ? role.trim() : "";

  if (!cleanUsername || !password || !cleanRole) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  if (!ALLOWED_ROLES.has(cleanRole)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  User.create(
    { username: cleanUsername, password, role: cleanRole },
    (err, result) => {
      if (err) {
        const msg = String(err.message || "");
        if (msg.includes("SQLITE_CONSTRAINT")) {
          return res.status(409).json({ message: "Username already exists" });
        }
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({ message: "User created", user_id: result.id });
    }
  );
};

exports.bootstrapAdmin = (req, res) => {
  const { username, password } = req.body || {};
  const cleanUsername = typeof username === "string" ? username.trim() : "";

  if (!cleanUsername || !password) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  User.countAll((err, count) => {
    if (err) return res.status(500).json({ error: err.message });
    if (count > 0) {
      return res.status(403).json({ message: "Bootstrap already completed" });
    }

    User.create(
      { username: cleanUsername, password, role: "admin" },
      (createErr, result) => {
        if (createErr)
          return res.status(500).json({ error: createErr.message });
        res.status(201).json({ message: "Admin created", user_id: result.id });
      }
    );
  });
};

exports.getMe = (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Missing token" });

  User.findById(userId, (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      is_active: user.is_active ?? 1,
      assigned_class_id: user.assigned_class_id ?? null,
    });
  });
};

exports.setActive = (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body || {};

  if (typeof is_active !== "boolean") {
    return res.status(400).json({ message: "is_active must be boolean" });
  }

  if (Number(id) === Number(req.user?.id) && is_active === false) {
    return res
      .status(400)
      .json({ message: "You cannot disable your own account" });
  }

  User.setActive(id, is_active, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result?.changes)
      return res.status(404).json({ message: "User not found" });
    res.json({ message: "Status updated" });
  });
};

exports.resetPassword = (req, res) => {
  const { id } = req.params;
  const { password } = req.body || {};

  if (!password || String(password).length < 4) {
    return res.status(400).json({ message: "Password is too short" });
  }

  User.updatePassword(id, password, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result?.changes)
      return res.status(404).json({ message: "User not found" });
    res.json({ message: "Password reset" });
  });
};

exports.assignClass = (req, res) => {
  const { id } = req.params;
  const { class_id } = req.body || {};

  if (class_id === undefined) {
    return res.status(400).json({ message: "class_id is required" });
  }

  const classIdNumber = Number(class_id);
  if (!Number.isFinite(classIdNumber) || classIdNumber <= 0) {
    return res.status(400).json({ message: "Invalid class_id" });
  }

  User.findById(id, (findErr, user) => {
    if (findErr) return res.status(500).json({ error: findErr.message });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role !== "teacher") {
      return res
        .status(400)
        .json({ message: "Only teachers can be assigned a class" });
    }

    User.assignClass(id, classIdNumber, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!result?.changes)
        return res.status(404).json({ message: "User not found" });
      res.json({ message: "Class assigned" });
    });
  });
};
