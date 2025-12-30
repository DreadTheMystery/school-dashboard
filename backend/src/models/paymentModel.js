const db = require("./db");

const ensurePaymentSchema = () => {
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
      callback(err, { id: this.lastID });
    });
  },

  getAllByStudent: (student_id, callback) => {
    const sql = `
      SELECT * FROM payments WHERE student_id = ?
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
};

module.exports = Payment;
