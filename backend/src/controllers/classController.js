const Class = require("../models/classModel");

exports.addClass = (req, res) => {
  const { name, arm } = req.body;
  if (!name) return res.status(400).json({ message: "Class name is required" });

  Class.create({ name, arm }, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    res.status(201).json({
      message: result.existed
        ? "Class already existed; returning existing id"
        : "Class added successfully",
      class_id: result.id,
    });
  });
};

exports.getClasses = (req, res) => {
  Class.getAll((err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    res.json(rows);
  });
};

exports.seedDefaultClasses = (_req, res) => {
  const levels = ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"];
  const arms = ["A", "B"];
  const tasks = [];

  levels.forEach((lvl) => {
    arms.forEach((arm) => {
      tasks.push(
        new Promise((resolve) => {
          Class.create({ name: lvl, arm }, (err, result) => {
            if (err)
              return resolve({
                name: lvl,
                arm,
                status: "error",
                error: err.message,
              });
            resolve({
              name: lvl,
              arm,
              status: result.existed ? "existing" : "created",
              id: result.id,
            });
          });
        })
      );
    });
  });

  Promise.all(tasks).then((results) => res.json({ results }));
};

exports.getClassesWithStudents = (req, res) => {
  Class.getWithStudents((err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const grouped = {};
    rows.forEach((row) => {
      const classKey = `${row.class_name} ${row.arm || ""}`.trim();
      if (!grouped[classKey]) grouped[classKey] = [];
      if (row.student_id) {
        grouped[classKey].push({
          student_id: row.student_id,
          full_name: row.full_name,
          admission_no: row.admission_no,
        });
      }
    });

    res.json(grouped);
  });
};
