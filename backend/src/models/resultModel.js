const db = require("./db");

const ensureResultsSchema = () => {
  db.all("PRAGMA table_info(results)", (err, rows) => {
    if (err) return;

    const columns = (rows || []).map((r) => r.name);

    if (!columns.length) {
      db.run(
        `CREATE TABLE IF NOT EXISTS results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id INTEGER NOT NULL,
          term TEXT NOT NULL,
          session TEXT NOT NULL,
          test_score REAL NOT NULL DEFAULT 0,
          exam_score REAL NOT NULL DEFAULT 0,
          total_score REAL NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'draft',
          submitted_by INTEGER,
          submitted_at TEXT,
          approved_by INTEGER,
          approved_at TEXT,
          created_by INTEGER,
          created_at TEXT NOT NULL,
          UNIQUE(student_id, term, session)
        )`
      );
      return;
    }

    const migrations = [];
    if (!columns.includes("status")) {
      migrations.push(
        "ALTER TABLE results ADD COLUMN status TEXT DEFAULT 'draft'"
      );
    }
    if (!columns.includes("submitted_by")) {
      migrations.push("ALTER TABLE results ADD COLUMN submitted_by INTEGER");
    }
    if (!columns.includes("submitted_at")) {
      migrations.push("ALTER TABLE results ADD COLUMN submitted_at TEXT");
    }
    if (!columns.includes("approved_by")) {
      migrations.push("ALTER TABLE results ADD COLUMN approved_by INTEGER");
    }
    if (!columns.includes("approved_at")) {
      migrations.push("ALTER TABLE results ADD COLUMN approved_at TEXT");
    }

    migrations.forEach((sql) => {
      db.run(sql, (alterErr) => {
        if (alterErr)
          console.error("Results schema migration failed", alterErr);
      });
    });
  });
};

ensureResultsSchema();

const Result = {
  getOne: (student_id, term, session, callback) => {
    const sql = `
      SELECT r.*
      FROM results r
      WHERE r.student_id = ? AND r.term = ? AND r.session = ?
      LIMIT 1
    `;
    db.get(sql, [student_id, term, session], callback);
  },

  upsert: (result, callback) => {
    const sql = `
      INSERT INTO results (
        student_id,
        term,
        session,
        test_score,
        exam_score,
        total_score,
        status,
        created_by,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(student_id, term, session) DO UPDATE SET
        test_score = excluded.test_score,
        exam_score = excluded.exam_score,
        total_score = excluded.total_score,
        status = excluded.status,
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
      result.status || "draft",
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
      SELECT
        r.*, 
        s.full_name,
        s.admission_no,
        s.class_id,
        c.name AS class_name,
        c.arm
      FROM results r
      JOIN students s ON s.id = r.student_id
      JOIN classes c ON c.id = s.class_id
      WHERE ${where.join(" AND ")}
      ORDER BY r.session DESC, r.term DESC
    `;

    db.all(sql, params, callback);
  },

  getByClass: (class_id, filters, callback) => {
    const where = ["s.class_id = ?"];
    const params = [class_id];

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
        IFNULL(r.status, 'draft') AS status,
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

  listMissingForClass: (class_id, term, session, callback) => {
    const sql = `
      SELECT
        s.id AS student_id,
        s.full_name,
        s.admission_no
      FROM students s
      LEFT JOIN results r
        ON r.student_id = s.id AND r.term = ? AND r.session = ?
      WHERE s.class_id = ? AND r.id IS NULL
      ORDER BY s.full_name
    `;
    db.all(sql, [term, session, class_id], callback);
  },

  submitClass: (class_id, term, session, submittedBy, callback) => {
    const sql = `
      UPDATE results
      SET
        status = 'submitted',
        submitted_by = ?,
        submitted_at = ?,
        approved_by = NULL,
        approved_at = NULL
      WHERE id IN (
        SELECT r.id
        FROM results r
        JOIN students s ON s.id = r.student_id
        WHERE s.class_id = ? AND r.term = ? AND r.session = ?
          AND IFNULL(r.status, 'draft') = 'draft'
      )
    `;
    const now = new Date().toISOString();
    db.run(sql, [submittedBy, now, class_id, term, session], function (err) {
      callback(err, { changes: this.changes });
    });
  },

  approveClass: (class_id, term, session, approvedBy, callback) => {
    const sql = `
      UPDATE results
      SET
        status = 'approved',
        approved_by = ?,
        approved_at = ?
      WHERE id IN (
        SELECT r.id
        FROM results r
        JOIN students s ON s.id = r.student_id
        WHERE s.class_id = ? AND r.term = ? AND r.session = ?
          AND IFNULL(r.status, 'draft') = 'submitted'
      )
    `;
    const now = new Date().toISOString();
    db.run(sql, [approvedBy, now, class_id, term, session], function (err) {
      callback(err, { changes: this.changes });
    });
  },
};

module.exports = Result;
