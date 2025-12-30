const db = require("./db");

const Class = {
  create: (classData, callback) => {
    const checkSql =
      "SELECT id FROM classes WHERE name = ? AND arm = ? LIMIT 1";
    db.get(checkSql, [classData.name, classData.arm], (checkErr, row) => {
      if (checkErr) return callback(checkErr);
      if (row) return callback(null, { id: row.id, existed: true });

      const sql = "INSERT INTO classes (name, arm) VALUES (?, ?)";
      const values = [classData.name, classData.arm];

      db.run(sql, values, function (err) {
        callback(err, { id: this.lastID, existed: false });
      });
    });
  },

  getAll: (callback) => {
    const sql = "SELECT * FROM classes ORDER BY name, arm";
    db.all(sql, [], callback);
  },

  getWithStudents: (callback) => {
    const sql = `
      SELECT classes.id AS class_id, classes.name AS class_name, classes.arm,
             students.id AS student_id, students.full_name, students.admission_no
      FROM classes
      LEFT JOIN students ON students.class_id = classes.id
      ORDER BY classes.name, classes.arm, students.full_name
    `;
    db.all(sql, [], callback);
  },
};

module.exports = Class;
