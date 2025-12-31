const db = require("./db");

const ensurePaymentSchema = () => {
  db.serialize(() => {
    db.run(
      `CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        amount_paid REAL NOT NULL,
        amount_remaining REAL DEFAULT 0,
        payment_type TEXT DEFAULT 'full',
        term TEXT NOT NULL,
        session TEXT NOT NULL,
        payment_date TEXT
      )`
    );

    db.all("PRAGMA table_info(payments)", (err, rows) => {
      if (err) return;

      const columns = rows.map((r) => r.name);
      const migrations = [];

      if (!columns.includes("payment_type")) {
        migrations.push(
          "ALTER TABLE payments ADD COLUMN payment_type TEXT DEFAULT 'full'"
        );
      }

      if (!columns.includes("amount_remaining")) {
        migrations.push(
          "ALTER TABLE payments ADD COLUMN amount_remaining REAL DEFAULT 0"
        );
      }

      migrations.forEach((sql) => {
        db.run(sql, (alterErr) => {
          if (alterErr) console.error("Schema migration failed", alterErr);
        });
      });

      // Dedupe any existing duplicates so we can safely enforce uniqueness.
      // Rule: keep the most "settled" row (smallest remaining); tiebreak by latest date.
      db.all(
        `SELECT student_id, term, session, COUNT(*) AS c
       FROM payments
       GROUP BY student_id, term, session
       HAVING c > 1`,
        (dupErr, groups) => {
          if (dupErr) {
            console.error("Payments dedupe scan failed", dupErr);
            return;
          }

          const tasks = (groups || []).map(
            (g) =>
              new Promise((resolve) => {
                db.all(
                  `SELECT id, amount_remaining, payment_date
                 FROM payments
                 WHERE student_id = ? AND term = ? AND session = ?`,
                  [g.student_id, g.term, g.session],
                  (rowsErr, payRows) => {
                    if (rowsErr || !payRows || payRows.length < 2)
                      return resolve();

                    const best = [...payRows].sort((a, b) => {
                      const ar = Number(a.amount_remaining ?? 0);
                      const br = Number(b.amount_remaining ?? 0);
                      if (ar !== br) return ar - br;
                      const ad = Date.parse(a.payment_date || "") || 0;
                      const bd = Date.parse(b.payment_date || "") || 0;
                      if (ad !== bd) return bd - ad;
                      return b.id - a.id;
                    })[0];

                    const deleteIds = payRows
                      .filter((r) => r.id !== best.id)
                      .map((r) => r.id);
                    if (deleteIds.length === 0) return resolve();

                    db.run(
                      `DELETE FROM payments WHERE id IN (${deleteIds
                        .map(() => "?")
                        .join(",")})`,
                      deleteIds,
                      () => resolve()
                    );
                  }
                );
              })
          );

          Promise.all(tasks).finally(() => {
            db.run(
              `CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_student_term_session
             ON payments(student_id, term, session)`,
              (idxErr) => {
                if (idxErr)
                  console.error(
                    "Failed to create unique payment index",
                    idxErr
                  );
              }
            );
          });
        }
      );
    });
  });
};

ensurePaymentSchema();

const Payment = {
  create: (payment, callback) => {
    const sql = `
      INSERT INTO payments (
        student_id,
        amount_paid,
        amount_remaining,
        payment_type,
        term,
        session,
        payment_date
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(student_id, term, session)
      DO UPDATE SET
        amount_paid = excluded.amount_paid,
        amount_remaining = excluded.amount_remaining,
        payment_type = excluded.payment_type,
        payment_date = excluded.payment_date
    `;
    const values = [
      payment.student_id,
      payment.amount_paid,
      payment.amount_remaining ?? 0,
      payment.payment_type || "full",
      payment.term,
      payment.session,
      payment.payment_date || new Date().toISOString(),
    ];

    db.run(sql, values, function (err) {
      if (err) return callback(err);

      db.get(
        `SELECT id FROM payments WHERE student_id = ? AND term = ? AND session = ?`,
        [payment.student_id, payment.term, payment.session],
        (getErr, row) => {
          if (getErr) return callback(getErr);
          callback(null, { id: row?.id });
        }
      );
    });
  },

  getAllByStudent: (student_id, callback) => {
    const sql = `
      SELECT * FROM payments WHERE student_id = ?
      ORDER BY datetime(payment_date) DESC, id DESC
    `;
    db.all(sql, [student_id], callback);
  },

  getSummary: (callback) => {
    const sql = `
      SELECT students.id AS student_id, students.full_name, students.admission_no,
             IFNULL(SUM(payments.amount_paid), 0) AS total_paid,
             IFNULL(SUM(payments.amount_remaining), 0) AS total_remaining
      FROM students
      LEFT JOIN payments ON payments.student_id = students.id
      GROUP BY students.id
    `;
    db.all(sql, [], callback);
  },

  getSummaryForClass: (class_id, callback) => {
    const sql = `
      SELECT students.id AS student_id, students.full_name, students.admission_no,
             IFNULL(SUM(payments.amount_paid), 0) AS total_paid,
             IFNULL(SUM(payments.amount_remaining), 0) AS total_remaining
      FROM students
      LEFT JOIN payments ON payments.student_id = students.id
      WHERE students.class_id = ?
      GROUP BY students.id
    `;
    db.all(sql, [class_id], callback);
  },
};

module.exports = Payment;
