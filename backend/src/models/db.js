const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const db = new sqlite3.Database(
  path.join(__dirname, "../../database/school.db"),
  (err) => {
    if (err) console.error(err);
    else console.log("Connected to SQLite database");
  }
);

db.serialize(() => {
  // Ensure base students table exists
  db.run(
    `
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admission_no TEXT,
      full_name TEXT,
      gender TEXT,
      date_of_birth TEXT,
      religion TEXT,
      class_id INTEGER,
      guardian_name TEXT,
      guardian_phone TEXT,
      photo_data_url TEXT
    )
  `
  );

  // Add photo column for older databases
  db.all("PRAGMA table_info(students)", [], (err, rows) => {
    if (err) return;
    const hasPhoto = (rows || []).some((r) => r?.name === "photo_data_url");
    if (hasPhoto) return;
    db.run("ALTER TABLE students ADD COLUMN photo_data_url TEXT");
  });
});

module.exports = db;
