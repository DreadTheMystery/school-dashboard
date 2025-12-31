const db = require("./db");

const ensureReportCardSchema = () => {
  db.all("PRAGMA table_info(report_cards)", (err, rows) => {
    if (err) return;

    const columns = (rows || []).map((r) => r.name);

    if (!columns.length) {
      db.run(
        `CREATE TABLE IF NOT EXISTS report_cards (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          teacher_id INTEGER NOT NULL,
          student_id INTEGER NOT NULL,
          class_id INTEGER,
          term TEXT NOT NULL,
          session TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'draft',
          source_result_id INTEGER,
          payload_json TEXT NOT NULL,
          submitted_at TEXT,
          reviewed_by INTEGER,
          reviewed_at TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now')),
          UNIQUE(teacher_id, student_id, term, session)
        )`
      );
      return;
    }

    const migrations = [];
    if (!columns.includes("status")) {
      migrations.push(
        "ALTER TABLE report_cards ADD COLUMN status TEXT NOT NULL DEFAULT 'draft'"
      );
    }
    if (!columns.includes("class_id")) {
      migrations.push("ALTER TABLE report_cards ADD COLUMN class_id INTEGER");
    }
    if (!columns.includes("source_result_id")) {
      migrations.push(
        "ALTER TABLE report_cards ADD COLUMN source_result_id INTEGER"
      );
    }
    if (!columns.includes("payload_json")) {
      migrations.push("ALTER TABLE report_cards ADD COLUMN payload_json TEXT");
    }
    if (!columns.includes("submitted_at")) {
      migrations.push("ALTER TABLE report_cards ADD COLUMN submitted_at TEXT");
    }
    if (!columns.includes("reviewed_by")) {
      migrations.push(
        "ALTER TABLE report_cards ADD COLUMN reviewed_by INTEGER"
      );
    }
    if (!columns.includes("reviewed_at")) {
      migrations.push("ALTER TABLE report_cards ADD COLUMN reviewed_at TEXT");
    }
    if (!columns.includes("created_at")) {
      migrations.push("ALTER TABLE report_cards ADD COLUMN created_at TEXT");
    }
    if (!columns.includes("updated_at")) {
      migrations.push("ALTER TABLE report_cards ADD COLUMN updated_at TEXT");
    }

    migrations.forEach((sql) => {
      db.run(sql, (alterErr) => {
        if (alterErr)
          console.error("Report card schema migration failed", alterErr);
      });
    });

    // Best-effort unique index for older DBs (ignore errors)
    db.run(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_report_cards_unique ON report_cards(teacher_id, student_id, term, session)",
      () => {}
    );

    // One immutable/generated copy per student+term+session (ignore errors if duplicates exist)
    db.run(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_report_cards_student_term_session_final ON report_cards(student_id, term, session) WHERE status IN ('submitted','approved','generated')",
      () => {}
    );
  });
};

ensureReportCardSchema();

const ReportCard = {
  createGenerated: (
    {
      teacher_id,
      student_id,
      class_id,
      term,
      session,
      payload_json,
      source_result_id,
    },
    cb
  ) => {
    const insertSql = `
      INSERT OR IGNORE INTO report_cards (
        teacher_id,
        student_id,
        class_id,
        term,
        session,
        status,
        source_result_id,
        payload_json,
        submitted_at,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, 'generated', ?, ?, datetime('now'), datetime('now'), datetime('now'))
    `;

    db.run(
      insertSql,
      [
        teacher_id,
        student_id,
        class_id ?? null,
        term,
        session,
        source_result_id ?? null,
        payload_json,
      ],
      function (err) {
        if (err) return cb(err);

        // Return existing or inserted row
        db.get(
          `SELECT id, status
           FROM report_cards
           WHERE student_id = ? AND term = ? AND session = ?
             AND status IN ('submitted','approved','generated')
           ORDER BY CASE status WHEN 'generated' THEN 0 WHEN 'submitted' THEN 1 ELSE 2 END, updated_at DESC
           LIMIT 1`,
          [student_id, term, session],
          (getErr, row) => {
            if (getErr) return cb(getErr);
            cb(null, row);
          }
        );
      }
    );
  },

  upsertDraft: (
    { teacher_id, student_id, term, session, payload_json },
    cb
  ) => {
    const sql = `
      INSERT INTO report_cards (teacher_id, student_id, term, session, status, payload_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'draft', ?, datetime('now'), datetime('now'))
      ON CONFLICT(teacher_id, student_id, term, session)
      DO UPDATE SET
        status = CASE
          WHEN report_cards.status IN ('submitted','approved') THEN report_cards.status
          ELSE 'draft'
        END,
        payload_json = CASE
          WHEN report_cards.status = 'draft' THEN excluded.payload_json
          ELSE report_cards.payload_json
        END,
        updated_at = datetime('now')
    `;

    db.run(
      sql,
      [teacher_id, student_id, term, session, payload_json],
      function (err) {
        if (err) return cb(err);

        // If conflict update happened, lastID might not be reliable; fetch id
        db.get(
          "SELECT id, status FROM report_cards WHERE teacher_id = ? AND student_id = ? AND term = ? AND session = ?",
          [teacher_id, student_id, term, session],
          (getErr, row) => {
            if (getErr) return cb(getErr);
            cb(null, row);
          }
        );
      }
    );
  },

  getById: (id, cb) => {
    db.get(
      `SELECT rc.*, s.full_name, s.admission_no, s.gender, s.photo_data_url, c.name AS class_name, c.arm AS class_arm,
              s.class_id AS student_class_id,
              u.username AS teacher_username
       FROM report_cards rc
       LEFT JOIN students s ON s.id = rc.student_id
       LEFT JOIN classes c ON c.id = s.class_id
       LEFT JOIN users u ON u.id = rc.teacher_id
       WHERE rc.id = ?`,
      [id],
      cb
    );
  },

  listFinalForStudent: (studentId, session, cb) => {
    const whereSession = session ? "AND rc.session = ?" : "";
    const params = session ? [studentId, session] : [studentId];

    db.all(
      `SELECT rc.id, rc.teacher_id, rc.student_id, rc.class_id, rc.term, rc.session, rc.status, rc.submitted_at, rc.reviewed_at, rc.updated_at,
              s.full_name, s.admission_no, c.name AS class_name, c.arm AS class_arm,
              u.username AS teacher_username
       FROM report_cards rc
       LEFT JOIN students s ON s.id = rc.student_id
       LEFT JOIN classes c ON c.id = s.class_id
       LEFT JOIN users u ON u.id = rc.teacher_id
       WHERE rc.student_id = ? AND rc.status IN ('submitted','approved','generated')
         ${whereSession}
       ORDER BY rc.session DESC, rc.term DESC, rc.updated_at DESC`,
      params,
      cb
    );
  },

  listForTeacher: (teacherId, status, cb) => {
    const whereStatus = status ? "AND rc.status = ?" : "";
    const params = status ? [teacherId, status] : [teacherId];
    db.all(
      `SELECT rc.id, rc.student_id, rc.term, rc.session, rc.status, rc.submitted_at, rc.reviewed_at, rc.updated_at,
              s.full_name, s.admission_no, c.name AS class_name, c.arm AS class_arm
       FROM report_cards rc
       LEFT JOIN students s ON s.id = rc.student_id
       LEFT JOIN classes c ON c.id = s.class_id
       WHERE rc.teacher_id = ? ${whereStatus}
       ORDER BY rc.updated_at DESC`,
      params,
      cb
    );
  },

  listForAdmin: (status, cb) => {
    const whereStatus = status ? "WHERE rc.status = ?" : "";
    const params = status ? [status] : [];
    db.all(
      `SELECT rc.id, rc.student_id, rc.teacher_id, rc.term, rc.session, rc.status, rc.submitted_at, rc.reviewed_at, rc.updated_at,
              s.full_name, s.admission_no, c.name AS class_name, c.arm AS class_arm,
              u.username AS teacher_username
       FROM report_cards rc
       LEFT JOIN students s ON s.id = rc.student_id
       LEFT JOIN classes c ON c.id = s.class_id
       LEFT JOIN users u ON u.id = rc.teacher_id
       ${whereStatus}
       ORDER BY CASE rc.status WHEN 'generated' THEN 0 WHEN 'submitted' THEN 1 WHEN 'approved' THEN 2 ELSE 3 END, rc.updated_at DESC`,
      params,
      cb
    );
  },

  submit: ({ id, teacher_id }, cb) => {
    db.run(
      `UPDATE report_cards
       SET status = 'submitted', submitted_at = datetime('now'), updated_at = datetime('now')
       WHERE id = ? AND teacher_id = ? AND status != 'approved'`,
      [id, teacher_id],
      function (err) {
        cb(err, { changes: this.changes });
      }
    );
  },

  approve: ({ id, reviewed_by }, cb) => {
    db.run(
      `UPDATE report_cards
       SET status = 'approved', reviewed_by = ?, reviewed_at = datetime('now'), updated_at = datetime('now')
       WHERE id = ?`,
      [reviewed_by, id],
      function (err) {
        cb(err, { changes: this.changes });
      }
    );
  },
};

module.exports = ReportCard;
