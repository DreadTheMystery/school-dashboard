function applyRoleUI() {
  if (!role) return;
  if (role === "teacher") {
    classForm.style.display = "none";
    paymentForm.style.display = "none";
    document
      .querySelectorAll(".edit-student, .delete-student")
      .forEach((btn) => btn.remove());
  }

  if (role === "account") {
    classForm.style.display = "none";
    const resultsTabBtn = document.querySelector('[data-tab="resultsTab"]');
    const resultsTab = document.getElementById("resultsTab");
    if (resultsTabBtn) resultsTabBtn.style.display = "none";
    if (resultsTab) resultsTab.style.display = "none";

    document.querySelectorAll(".delete-student").forEach((btn) => btn.remove());

    const profileResultsCard = document.getElementById("profileResultsCard");
    if (profileResultsCard) profileResultsCard.style.display = "none";
  }

  if (role !== "admin") {
    const staffTabBtn = document.querySelector('[data-tab="staffTab"]');
    const staffTab = document.getElementById("staffTab");
    if (staffTabBtn) staffTabBtn.style.display = "none";
    if (staffTab) staffTab.style.display = "none";
  }
}
const tabs = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

const studentForm = document.getElementById("studentForm");
const studentsTableBody = document.querySelector("#studentsTable tbody");
const classSelect = document.getElementById("classSelect");
const studentSearch = document.getElementById("studentSearch");

const classForm = document.getElementById("classForm");
const classesTableBody = document.querySelector("#classesTable tbody");

const paymentForm = document.getElementById("paymentForm");
const studentSelect = document.getElementById("studentSelect");
const paymentTableBody = document.querySelector("#paymentTable tbody");
const paymentSearch = document.getElementById("paymentSearch");
const amountRemainingInput = document.getElementById("amountRemaining");
const paymentTypeInputs = document.querySelectorAll(
  'input[name="payment_type"]'
);

const resultForm = document.getElementById("resultForm");
const resultClassSelect = document.getElementById("resultClassSelect");
const resultStudentSelect = document.getElementById("resultStudentSelect");
const resultTermInput = document.getElementById("resultTerm");
const resultSessionInput = document.getElementById("resultSession");
const resultTestInput = document.getElementById("resultTest");
const resultExamInput = document.getElementById("resultExam");
const resultsTableBody = document.querySelector("#resultsTable tbody");

const staffForm = document.getElementById("staffForm");
const staffTableBody = document.querySelector("#staffTable tbody");

const profileStudentSelect = document.getElementById("profileStudentSelect");
const loadProfileBtn = document.getElementById("loadProfileBtn");
const profileDetailsBody = document.getElementById("profileDetails");
const profilePaymentsBody = document.querySelector(
  "#profilePaymentsTable tbody"
);
const profileResultsBody = document.querySelector("#profileResultsTable tbody");

const seedClassesBtn = document.getElementById("seedClassesBtn");

const roleBadge = document.getElementById("roleBadge");
const logoutBtn = document.getElementById("logoutBtn");

const API = "http://localhost:3000/api";
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
let assignedClassId = localStorage.getItem("assigned_class_id") || "";

if (!token) {
  window.location.href = "login.html";
}

if (roleBadge) {
  roleBadge.textContent = `Role: ${role || "Unknown"}`;
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "login.html";
  });
}

const authHeaders = token
  ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
  : { "Content-Type": "application/json" };

let classesCache = [];
let studentsCache = [];
let meCache = null;

async function loadMe() {
  try {
    const res = await authFetch(`${API}/users/me`);
    const me = await safeJson(res);
    meCache = me;
    assignedClassId = me?.assigned_class_id ? String(me.assigned_class_id) : "";
    localStorage.setItem("assigned_class_id", assignedClassId);
  } catch (err) {
    // ignore; user might be logged out or server unreachable
  }
}

function enforceTeacherClassLock() {
  if (role !== "teacher") return;
  if (!classSelect) return;

  classSelect.disabled = true;

  if (assignedClassId) {
    classSelect.value = assignedClassId;
  }
}

async function safeJson(res) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with ${res.status}`);
  }
  try {
    return await res.json();
  } catch (err) {
    const text = await res.text();
    throw new Error(text || "Non-JSON response");
  }
}

function authFetch(url, options = {}) {
  const headers = { ...(options.headers || {}), ...authHeaders };
  return fetch(url, { ...options, headers });
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    tabContents.forEach((tc) => tc.classList.remove("active"));
    document.getElementById(tab.dataset.tab).classList.add("active");
  });
});

if (tabs.length) {
  tabs[0].click();
}

function exportTableToCSV(tableId, filename = "export.csv") {
  const rows = document.querySelectorAll(`#${tableId} tr`);
  const csv = [];
  rows.forEach((row) => {
    const cols = row.querySelectorAll("td, th");
    csv.push(
      Array.from(cols)
        .map((c) => `"${c.innerText}"`)
        .join(",")
    );
  });
  const blob = new Blob([csv.join("\n")], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

const exportStudentsBtn = document.createElement("button");
exportStudentsBtn.className = "ghost-btn";
exportStudentsBtn.innerText = "Export CSV";
exportStudentsBtn.onclick = () =>
  exportTableToCSV("studentsTable", "students.csv");
const studentsExportAnchor = document.getElementById("exportStudentsAnchor");
if (studentsExportAnchor) studentsExportAnchor.replaceWith(exportStudentsBtn);

const exportPaymentsBtn = document.createElement("button");
exportPaymentsBtn.className = "ghost-btn";
exportPaymentsBtn.innerText = "Export CSV";
exportPaymentsBtn.onclick = () =>
  exportTableToCSV("paymentTable", "payments.csv");
const paymentsExportAnchor = document.getElementById("exportPaymentsAnchor");
if (paymentsExportAnchor) paymentsExportAnchor.replaceWith(exportPaymentsBtn);

function syncHalfFields() {
  if (!amountRemainingInput) return;
  const selected = document.querySelector(
    'input[name="payment_type"]:checked'
  )?.value;
  const halfOnly = document.querySelectorAll(".half-only");
  const showHalf = selected === "half";
  halfOnly.forEach((el) => {
    el.style.display = showHalf ? "block" : "none";
  });
  if (!showHalf) {
    amountRemainingInput.value = "0";
    amountRemainingInput.required = false;
  } else {
    amountRemainingInput.required = true;
  }
}

paymentTypeInputs.forEach((input) =>
  input.addEventListener("change", syncHalfFields)
);
syncHalfFields();

async function loadClasses() {
  const res = await authFetch(`${API}/classes`);
  const classes = await safeJson(res).catch((err) => {
    alert(`Failed to load classes: ${err.message}`);
    return [];
  });
  if (!classes) return [];
  if (classes.length < 12 && seedClassesBtn) {
    await seedDefaults();
    return [];
  }
  classesCache = classes;
  const classOptionsHtml =
    '<option value="" disabled selected>Select class</option>' +
    classes
      .map((c) => `<option value="${c.id}">${c.name} ${c.arm || ""}</option>`)
      .join("");
  if (classSelect) classSelect.innerHTML = classOptionsHtml;
  if (resultClassSelect) resultClassSelect.innerHTML = classOptionsHtml;
  classesTableBody.innerHTML = classes
    .map(
      (c) => `
    <tr>
      <td>${c.name}</td>
      <td>${c.arm || "-"}</td>
    </tr>`
    )
    .join("");
  return classes;
}

async function loadClassResults() {
  if (!resultClassSelect || !resultsTableBody) return;

  const classId = resultClassSelect.value;
  const term = resultTermInput?.value?.trim();
  const session = resultSessionInput?.value?.trim();

  if (!classId) return;

  if (!term || !session) {
    resultsTableBody.innerHTML =
      '<tr><td colspan="7">Enter term and session to load results.</td></tr>';
    if (resultStudentSelect) resultStudentSelect.innerHTML = "";
    return;
  }

  let rows = [];
  try {
    const res = await authFetch(
      `${API}/results/class/${classId}?term=${encodeURIComponent(
        term
      )}&session=${encodeURIComponent(session)}`
    );
    rows = await safeJson(res);
  } catch (err) {
    resultsTableBody.innerHTML = `<tr><td colspan="7">Failed to load results: ${err.message}</td></tr>`;
    if (resultStudentSelect) resultStudentSelect.innerHTML = "";
    return;
  }

  if (resultStudentSelect) {
    resultStudentSelect.innerHTML = rows
      .map(
        (r) =>
          `<option value="${r.student_id}">${r.full_name} (${r.admission_no})</option>`
      )
      .join("");
  }

  resultsTableBody.innerHTML = (rows || [])
    .map((r) => {
      const testScore = Number(r.test_score || 0);
      const examScore = Number(r.exam_score || 0);
      const totalScore = Number(r.total_score || 0);

      return `
      <tr data-student-id="${r.student_id}">
        <td>${r.admission_no}</td>
        <td>${r.full_name}</td>
        <td class="result-test">${testScore}</td>
        <td class="result-exam">${examScore}</td>
        <td class="result-total">${totalScore}</td>
        <td class="result-updated">${r.created_at || "-"}</td>
        <td class="actions">
          <button class="ghost-btn result-edit" data-student-id="${
            r.student_id
          }">Edit</button>
        </td>
      </tr>`;
    })
    .join("");
}

if (resultsTableBody) {
  resultsTableBody.addEventListener("click", async (e) => {
    const editBtn = e.target.closest?.(".result-edit");
    const saveBtn = e.target.closest?.(".result-save");
    const cancelBtn = e.target.closest?.(".result-cancel");

    const row = e.target.closest?.("tr");
    if (!row) return;

    const studentId = Number(row.dataset.studentId);
    if (!studentId) return;

    const term = resultTermInput?.value?.trim();
    const session = resultSessionInput?.value?.trim();
    if (!term || !session) {
      alert("Enter term and session first.");
      return;
    }

    if (editBtn) {
      if (row.dataset.editing === "1") return;
      row.dataset.editing = "1";

      const testCell = row.querySelector(".result-test");
      const examCell = row.querySelector(".result-exam");
      const totalCell = row.querySelector(".result-total");
      const actionsCell = row.querySelector(".actions");

      const currentTest = Number(testCell?.textContent || 0);
      const currentExam = Number(examCell?.textContent || 0);

      if (testCell) {
        testCell.innerHTML = `<input class="result-edit-test" type="number" min="0" value="${currentTest}">`;
      }
      if (examCell) {
        examCell.innerHTML = `<input class="result-edit-exam" type="number" min="0" value="${currentExam}">`;
      }
      if (totalCell) {
        totalCell.textContent = String(currentTest + currentExam);
      }
      if (actionsCell) {
        actionsCell.innerHTML =
          '<button class="primary-btn result-save">Save</button> ' +
          '<button class="ghost-btn result-cancel">Cancel</button>';
      }

      const testInput = row.querySelector(".result-edit-test");
      const examInput = row.querySelector(".result-edit-exam");
      const updateTotal = () => {
        const t = Number(testInput?.value ?? 0);
        const x = Number(examInput?.value ?? 0);
        if (Number.isFinite(t) && Number.isFinite(x) && totalCell) {
          totalCell.textContent = String(t + x);
        }
      };
      if (testInput) testInput.addEventListener("input", updateTotal);
      if (examInput) examInput.addEventListener("input", updateTotal);
      return;
    }

    if (cancelBtn) {
      await loadClassResults();
      return;
    }

    if (saveBtn) {
      const testInput = row.querySelector(".result-edit-test");
      const examInput = row.querySelector(".result-edit-exam");
      const testScore = Number(testInput?.value ?? 0);
      const examScore = Number(examInput?.value ?? 0);

      if (
        !Number.isFinite(testScore) ||
        !Number.isFinite(examScore) ||
        testScore < 0 ||
        examScore < 0
      ) {
        alert("Please enter valid non-negative scores.");
        return;
      }

      try {
        await authFetch(`${API}/results`, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            student_id: studentId,
            term,
            session,
            test_score: testScore,
            exam_score: examScore,
          }),
        }).then(safeJson);
      } catch (err) {
        alert(`Could not save result: ${err.message}`);
        return;
      }

      await loadClassResults();
    }
  });
}

async function loadStudents() {
  const res = await authFetch(`${API}/students`);
  const students = await safeJson(res).catch((err) => {
    alert(`Failed to load students: ${err.message}`);
    return [];
  });
  if (!students) return [];

  studentsCache = students;

  studentsTableBody.innerHTML = students
    .map(
      (s) => `
    <tr data-id="${s.id}">
      <td>${s.admission_no}</td>
      <td>${s.full_name}</td>
      <td>${s.class_name ? `${s.class_name} ${s.arm || ""}` : "-"}</td>
      <td class="actions">
        <button class="view-student" data-id="${s.id}">View</button>
        <button class="edit-student" data-id="${s.id}">Edit</button>
        <button class="delete-student" data-id="${s.id}">Delete</button>
      </td>
    </tr>`
    )
    .join("");
  return students;
}

async function loadStudentSelect() {
  const students = await loadStudents();
  studentSelect.innerHTML = students
    .map(
      (s) =>
        `<option value="${s.id}">${s.full_name} (${s.admission_no})</option>`
    )
    .join("");

  if (profileStudentSelect) {
    profileStudentSelect.innerHTML = students
      .map(
        (s) =>
          `<option value="${s.id}">${s.full_name} (${s.admission_no})</option>`
      )
      .join("");
  }
}

async function loadUsers() {
  if (role !== "admin" || !staffTableBody) return;
  try {
    const res = await authFetch(`${API}/users`);
    const users = await safeJson(res);
    const classOptions =
      '<option value="">Unassigned</option>' +
      (classesCache || [])
        .map((c) => `<option value="${c.id}">${c.name} ${c.arm || ""}</option>`)
        .join("");

    staffTableBody.innerHTML = (users || [])
      .map((u) => {
        const isActive = Number(u.is_active ?? 1) === 1;
        const assignedLabel = u.assigned_class_name
          ? `${u.assigned_class_name} ${u.assigned_class_arm || ""}`
          : "-";

        const assignControls =
          u.role === "teacher"
            ? `
              <select class="staff-assign-select" data-user-id="${u.id}">
                ${classOptions}
              </select>
              <button class="ghost-btn staff-assign" data-user-id="${u.id}">Assign</button>
            `
            : "-";

        return `
        <tr>
          <td>${u.id}</td>
          <td>${u.username}</td>
          <td>${u.role}</td>
          <td>${assignedLabel}</td>
          <td>${isActive ? "Active" : "Disabled"}</td>
          <td class="actions">
            ${assignControls}
            <button class="ghost-btn staff-reset" data-user-id="${
              u.id
            }">Reset password</button>
            <button class="ghost-btn staff-toggle" data-user-id="${
              u.id
            }" data-active="${isActive ? "1" : "0"}">
              ${isActive ? "Disable" : "Enable"}
            </button>
          </td>
        </tr>`;
      })
      .join("");

    // set selected option for each teacher
    (users || []).forEach((u) => {
      if (u.role !== "teacher") return;
      const sel = staffTableBody.querySelector(
        `.staff-assign-select[data-user-id="${u.id}"]`
      );
      if (sel && u.assigned_class_id) sel.value = String(u.assigned_class_id);
    });
  } catch (err) {
    staffTableBody.innerHTML = `<tr><td colspan="6">Failed to load staff: ${err.message}</td></tr>`;
  }
}

if (staffTableBody) {
  staffTableBody.addEventListener("click", async (e) => {
    const assignBtn = e.target.closest?.(".staff-assign");
    const resetBtn = e.target.closest?.(".staff-reset");
    const toggleBtn = e.target.closest?.(".staff-toggle");

    if (assignBtn) {
      const userId = assignBtn.dataset.userId;
      const select = staffTableBody.querySelector(
        `.staff-assign-select[data-user-id="${userId}"]`
      );
      const classId = select?.value;
      if (!classId) {
        alert("Select a class to assign.");
        return;
      }
      try {
        await authFetch(`${API}/users/${userId}/assign-class`, {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({ class_id: Number(classId) }),
        }).then(safeJson);
        await loadUsers();
      } catch (err) {
        alert(`Assign failed: ${err.message}`);
      }
      return;
    }

    if (resetBtn) {
      const userId = resetBtn.dataset.userId;
      const newPassword = prompt("Enter new password for this staff");
      if (!newPassword) return;
      try {
        await authFetch(`${API}/users/${userId}/password`, {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({ password: newPassword }),
        }).then(safeJson);
        alert("Password reset");
      } catch (err) {
        alert(`Reset failed: ${err.message}`);
      }
      return;
    }

    if (toggleBtn) {
      const userId = toggleBtn.dataset.userId;
      const isActive = toggleBtn.dataset.active === "1";
      const nextActive = !isActive;
      if (!confirm(`${nextActive ? "Enable" : "Disable"} this account?`))
        return;
      try {
        await authFetch(`${API}/users/${userId}/active`, {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({ is_active: nextActive }),
        }).then(safeJson);
        await loadUsers();
      } catch (err) {
        alert(`Update failed: ${err.message}`);
      }
    }
  });
}

async function loadStudentProfile(studentId) {
  if (!studentId) return;

  const student = studentsCache.find((s) => String(s.id) === String(studentId));
  if (!student) {
    if (profileDetailsBody) profileDetailsBody.innerHTML = "";
    return;
  }

  if (profileDetailsBody) {
    profileDetailsBody.innerHTML = `
      <tr><th>Admission No</th><td>${student.admission_no || "-"}</td></tr>
      <tr><th>Name</th><td>${student.full_name || "-"}</td></tr>
      <tr><th>Class</th><td>${
        student.class_name ? `${student.class_name} ${student.arm || ""}` : "-"
      }</td></tr>
      <tr><th>Gender</th><td>${student.gender || "-"}</td></tr>
      <tr><th>Date of birth</th><td>${student.date_of_birth || "-"}</td></tr>
      <tr><th>Religion</th><td>${student.religion || "-"}</td></tr>
      <tr><th>Guardian</th><td>${student.guardian_name || "-"}</td></tr>
      <tr><th>Guardian phone</th><td>${student.guardian_phone || "-"}</td></tr>
    `;
  }

  if (profilePaymentsBody) {
    try {
      const res = await authFetch(`${API}/payments/student/${studentId}`);
      const payments = await safeJson(res);
      profilePaymentsBody.innerHTML = (payments || [])
        .map(
          (p) => `
          <tr>
            <td>${p.term || "-"}</td>
            <td>${p.session || "-"}</td>
            <td>${p.payment_type || "-"}</td>
            <td>${Number(p.amount_paid || 0)}</td>
            <td>${Number(p.amount_remaining || 0)}</td>
            <td>${p.payment_date || "-"}</td>
          </tr>`
        )
        .join("");
    } catch (err) {
      profilePaymentsBody.innerHTML = `<tr><td colspan="6">Failed to load payments: ${err.message}</td></tr>`;
    }
  }

  if (role !== "account" && profileResultsBody) {
    try {
      const res = await authFetch(`${API}/results/student/${studentId}`);
      const results = await safeJson(res);
      profileResultsBody.innerHTML = (results || [])
        .map(
          (r) => `
          <tr>
            <td>${r.term || "-"}</td>
            <td>${r.session || "-"}</td>
            <td>${Number(r.test_score || 0)}</td>
            <td>${Number(r.exam_score || 0)}</td>
            <td>${Number(r.total_score || 0)}</td>
            <td>${r.created_at || "-"}</td>
          </tr>`
        )
        .join("");
    } catch (err) {
      profileResultsBody.innerHTML = `<tr><td colspan="6">Failed to load results: ${err.message}</td></tr>`;
    }
  }
}

async function loadPayments() {
  const res = await authFetch(`${API}/payments/summary`);
  const payments = await safeJson(res).catch((err) => {
    alert(`Failed to load payments: ${err.message}`);
    return [];
  });
  if (!payments) return;
  paymentTableBody.innerHTML = payments
    .map((p) => {
      const totalPaid = Number(p.total_paid || 0);
      const totalRemaining = Number(p.total_remaining || 0);
      let status = "status-unpaid";
      let statusLabel = "UNPAID";

      if (totalPaid > 0 && totalRemaining > 0) {
        status = "status-partial";
        statusLabel = "PARTIAL";
      }

      if (totalPaid > 0 && totalRemaining === 0) {
        status = "status-paid";
        statusLabel = "PAID";
      }

      return `
    <tr>
      <td>${p.admission_no}</td>
      <td>${p.full_name}</td>
      <td>${totalPaid}</td>
      <td>${totalRemaining}</td>
      <td class="${status}">${statusLabel}</td>
    </tr>`;
    })
    .join("");
}

studentForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = Object.fromEntries(new FormData(studentForm).entries());
  try {
    await authFetch(`${API}/students`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(formData),
    }).then(safeJson);
  } catch (err) {
    alert(`Could not add student: ${err.message}`);
    return;
  }
  studentForm.reset();
  await loadAllData();
});

paymentForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(paymentForm).entries());
  if (data.payment_type !== "half") {
    data.payment_type = "full";
    data.amount_remaining = 0;
  }
  await authFetch(`${API}/payments`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(data),
  });
  paymentForm.reset();
  syncHalfFields();
  await loadPayments();
});

if (resultForm) {
  resultForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const classId = resultClassSelect?.value;
    const studentId = resultStudentSelect?.value;
    const term = resultTermInput?.value?.trim();
    const session = resultSessionInput?.value?.trim();
    const testScore = Number(resultTestInput?.value ?? 0);
    const examScore = Number(resultExamInput?.value ?? 0);

    if (!classId || !studentId || !term || !session) {
      alert("Please select class, student, term, and session.");
      return;
    }

    if (!Number.isFinite(testScore) || !Number.isFinite(examScore)) {
      alert("Please enter valid numeric scores.");
      return;
    }

    try {
      await authFetch(`${API}/results`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          student_id: Number(studentId),
          term,
          session,
          test_score: testScore,
          exam_score: examScore,
        }),
      }).then(safeJson);
    } catch (err) {
      alert(`Could not save result: ${err.message}`);
      return;
    }

    resultTestInput.value = "";
    resultExamInput.value = "";
    await loadClassResults();
  });
}

classForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(classForm).entries());
  try {
    await authFetch(`${API}/classes`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(data),
    }).then(safeJson);
  } catch (err) {
    alert(`Could not add class: ${err.message}`);
    return;
  }
  classForm.reset();
  await loadAllData();
});

studentSearch.addEventListener("input", (e) => {
  const filter = e.target.value.toLowerCase();
  document.querySelectorAll("#studentsTable tbody tr").forEach((row) => {
    row.style.display = row.innerText.toLowerCase().includes(filter)
      ? ""
      : "none";
  });
});

paymentSearch.addEventListener("input", (e) => {
  const filter = e.target.value.toLowerCase();
  document.querySelectorAll("#paymentTable tbody tr").forEach((row) => {
    row.style.display = row.innerText.toLowerCase().includes(filter)
      ? ""
      : "none";
  });
});

studentsTableBody.addEventListener("click", async (e) => {
  const id = e.target.dataset.id;

  if (e.target.classList.contains("view-student")) {
    if (profileStudentSelect) profileStudentSelect.value = String(id);
    await loadStudentProfile(id);
    const tabBtn = document.querySelector('[data-tab="studentProfileTab"]');
    if (tabBtn) tabBtn.click();
  }

  if (e.target.classList.contains("edit-student")) {
    const newName = prompt("Update full name (leave blank to keep)");
    const newAdm = prompt("Update admission number (leave blank to keep)");

    const classOptions = classesCache
      .map((c) => `${c.id}: ${c.name} ${c.arm || ""}`)
      .join("\n");
    const newClassIdInput = prompt(
      `Update class (enter id, leave blank to keep)\n${classOptions}`
    );

    const payload = {};
    if (newName) payload.full_name = newName;
    if (newAdm) payload.admission_no = newAdm;
    if (newClassIdInput) payload.class_id = Number(newClassIdInput);

    if (!Object.keys(payload).length) return;

    try {
      await fetch(`${API}/students/${id}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify(payload),
      }).then(safeJson);
    } catch (err) {
      alert(`Update failed: ${err.message}`);
      return;
    }

    await loadAllData();
  }

  if (e.target.classList.contains("delete-student")) {
    if (!confirm("Delete this student?")) return;
    try {
      await fetch(`${API}/students/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      }).then(safeJson);
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
      return;
    }
    await loadAllData();
  }
});

if (loadProfileBtn) {
  loadProfileBtn.addEventListener("click", async () => {
    const studentId = profileStudentSelect?.value;
    await loadStudentProfile(studentId);
  });
}

if (staffForm) {
  staffForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (role !== "admin") {
      alert("Only admin can create staff.");
      return;
    }
    const data = Object.fromEntries(new FormData(staffForm).entries());
    try {
      await authFetch(`${API}/users`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          username: String(data.username || "").trim(),
          password: data.password,
          role: data.role,
        }),
      }).then(safeJson);
    } catch (err) {
      alert(`Could not create staff: ${err.message}`);
      return;
    }
    staffForm.reset();
    await loadUsers();
  });
}

async function seedDefaults() {
  try {
    await authFetch(`${API}/classes/seed-default`, { method: "POST" }).then(
      safeJson
    );
    await loadAllData();
    alert("Default classes ensured (JSS1-SS3 A/B)");
  } catch (err) {
    alert(`Seeding failed: ${err.message}`);
  }
}

if (seedClassesBtn) {
  seedClassesBtn.addEventListener("click", seedDefaults);
}

if (resultClassSelect) {
  resultClassSelect.addEventListener("change", loadClassResults);
}

if (resultTermInput) {
  resultTermInput.addEventListener("change", loadClassResults);
}

if (resultSessionInput) {
  resultSessionInput.addEventListener("change", loadClassResults);
}

async function loadAllData() {
  await loadMe();
  await loadClasses();
  enforceTeacherClassLock();
  await loadStudents();
  await loadStudentSelect();
  await loadPayments();
  await loadClassResults();
  await loadUsers();
  applyRoleUI();
}

loadAllData();
