const db = require("./db");
const bcrypt = require("bcrypt");

const ensureUserSchema = () => {
  db.all("PRAGMA table_info(users)", (err, rows) => {
    if (err) return;

    const columns = (rows || []).map((r) => r.name);

    if (!columns.length) {
      db.run(
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL,
          is_active INTEGER NOT NULL DEFAULT 1,
          assigned_class_id INTEGER,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`
      );
      return;
    }

    const migrations = [];
    if (!columns.includes("is_active")) {
      migrations.push(
        "ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1"
      );
    }
    if (!columns.includes("assigned_class_id")) {
      migrations.push("ALTER TABLE users ADD COLUMN assigned_class_id INTEGER");
    }
    if (!columns.includes("created_at")) {
      migrations.push("ALTER TABLE users ADD COLUMN created_at TEXT");
    }

    migrations.forEach((sql) => {
      db.run(sql, (alterErr) => {
        if (alterErr) console.error("User schema migration failed", alterErr);
      });
    });
  });
};

ensureUserSchema();

const User = {
  create: (user, callback) => {
    bcrypt.hash(user.password, 10, (err, hash) => {
      if (err) return callback(err);
      const sql =
        "INSERT INTO users (username, password, role) VALUES (?, ?, ?)";
      db.run(sql, [user.username, hash, user.role], function (err) {
        callback(err, { id: this.lastID });
      });
    });
  },

  findByUsername: (username, callback) => {
    const sql = "SELECT * FROM users WHERE username = ?";
    db.get(sql, [username], callback);
  },

  findById: (id, callback) => {
    const sql = "SELECT * FROM users WHERE id = ?";
    db.get(sql, [id], callback);
  },

  listAll: (callback) => {
    const sql = `
      SELECT
        u.id,
        u.username,
        u.role,
        IFNULL(u.is_active, 1) AS is_active,
        u.assigned_class_id,
        c.name AS assigned_class_name,
        c.arm AS assigned_class_arm
      FROM users u
      LEFT JOIN classes c ON c.id = u.assigned_class_id
      ORDER BY u.id DESC
    `;
    db.all(sql, [], callback);
  },

  countAll: (callback) => {
    const sql = "SELECT COUNT(*) AS count FROM users";
    db.get(sql, [], (err, row) => {
      if (err) return callback(err);
      callback(null, Number(row?.count || 0));
    });
  },

  setActive: (id, isActive, callback) => {
    const sql = "UPDATE users SET is_active = ? WHERE id = ?";
    db.run(sql, [isActive ? 1 : 0, id], function (err) {
      callback(err, { changes: this.changes });
    });
  },

  assignClass: (id, classId, callback) => {
    const sql = "UPDATE users SET assigned_class_id = ? WHERE id = ?";
    db.run(sql, [classId ?? null, id], function (err) {
      callback(err, { changes: this.changes });
    });
  },

  updatePassword: (id, newPassword, callback) => {
    bcrypt.hash(newPassword, 10, (err, hash) => {
      if (err) return callback(err);
      const sql = "UPDATE users SET password = ? WHERE id = ?";
      db.run(sql, [hash, id], function (updateErr) {
        callback(updateErr, { changes: this.changes });
      });
    });
  },
};

module.exports = User;
