const db = require("./db");

const ensureResultsSchema = () => {
  db.serialize(() => {
    db.run("PRAGMA foreign_keys = ON");

    db.run(
      `CREATE TABLE IF NOT EXISTS results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        term TEXT NOT NULL,
        session TEXT NOT NULL,
        test_score REAL NOT NULL DEFAULT 0,
        exam_score REAL NOT NULL DEFAULT 0,
        total_score REAL NOT NULL DEFAULT 0,
        created_by INTEGER,
        created_at TEXT NOT NULL,
        UNIQUE(student_id, term, session)
      )`
    );
  });
};

ensureResultsSchema();

const Result = {
  upsert: (result, callback) => {
    const sql = `
      INSERT INTO results (
        student_id,
        term,
        session,
        test_score,
        exam_score,
        total_score,
        created_by,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(student_id, term, session) DO UPDATE SET
        test_score = excluded.test_score,
        exam_score = excluded.exam_score,
        total_score = excluded.total_score,
        created_by = excluded.created_by,
        created_at = excluded.created_at
    `;

    const values = [
      result.student_id,
      result.term,
      result.session,
      result.test_score,
      result.exam_score,
      result.total_score,
      result.created_by,
      result.created_at || new Date().toISOString(),
    ];

    db.run(sql, values, function (err) {
      callback(err, { id: this.lastID });
    });
  },

  getByStudent: (student_id, filters, callback) => {
    const where = ["r.student_id = ?"];
    const params = [student_id];

    if (filters?.term) {
      where.push("r.term = ?");
      params.push(filters.term);
    }

    if (filters?.session) {
      where.push("r.session = ?");
      params.push(filters.session);
    }

    const sql = `
      SELECT r.*
      FROM results r
      WHERE ${where.join(" AND ")}
      ORDER BY r.session DESC, r.term DESC
    `;

    db.all(sql, params, callback);
  },

  getByClass: (class_id, filters, callback) => {
    const where = ["s.class_id = ?"];
    const params = [class_id];

    if (filters?.term) {
      where.push("r.term = ?");
      params.push(filters.term);
    }

    if (filters?.session) {
      where.push("r.session = ?");
      params.push(filters.session);
    }

    const sql = `
      SELECT
        s.id AS student_id,
        s.full_name,
        s.admission_no,
        c.name AS class_name,
        c.arm,
        r.term,
        r.session,
        IFNULL(r.test_score, 0) AS test_score,
        IFNULL(r.exam_score, 0) AS exam_score,
        IFNULL(r.total_score, 0) AS total_score,
        r.created_at
      FROM students s
      JOIN classes c ON c.id = s.class_id
      LEFT JOIN results r
        ON r.student_id = s.id
        ${filters?.term ? "AND r.term = ?" : ""}
        ${filters?.session ? "AND r.session = ?" : ""}
      WHERE ${where.join(" AND ")}
      ORDER BY s.full_name
    `;

    const joinParams = [];
    if (filters?.term) joinParams.push(filters.term);
    if (filters?.session) joinParams.push(filters.session);

    db.all(sql, [...joinParams, ...params], callback);
  },
};

module.exports = Result;
