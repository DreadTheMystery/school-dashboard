const db = require("./db");

const Student = {
  create: (student, callback) => {
    const sql = `
      INSERT INTO students (
        admission_no,
        full_name,
        gender,
        date_of_birth,
        religion,
        class_id,
        guardian_name,
        guardian_phone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      student.admission_no,
      student.full_name,
      student.gender,
      student.date_of_birth,
      student.religion,
      student.class_id,
      student.guardian_name,
      student.guardian_phone,
    ];

    db.run(sql, values, function (err) {
      callback(err, { id: this.lastID });
    });
  },

  getAll: (callback) => {
    const sql = `
      SELECT students.*, classes.name AS class_name, classes.arm
      FROM students
      LEFT JOIN classes ON students.class_id = classes.id
    `;

    db.all(sql, [], callback);
  },
};

module.exports = Student;
