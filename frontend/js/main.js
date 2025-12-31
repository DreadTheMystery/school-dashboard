function applyRoleUI() {
  if (!role) return;
  if (role === "teacher") {
    const classesTabBtn = document.querySelector('[data-tab="classesTab"]');
    if (classesTabBtn) classesTabBtn.textContent = "Report Card";
    const classesTabTitle = document.querySelector(
      "#classesTab .section-header h2"
    );
    if (classesTabTitle) classesTabTitle.textContent = "Report Card";
    const classesTabNote = document.querySelector(
      "#classesTab .section-header .section-note"
    );
    if (classesTabNote)
      classesTabNote.textContent =
        "Generate and print student report cards before holiday.";

    if (classesAdminGrid) classesAdminGrid.style.display = "none";
    if (reportCardGrid) reportCardGrid.style.display = "grid";
    if (reportReviewGrid) reportReviewGrid.style.display = "none";

    classForm.style.display = "none";
    // Teachers can only view payment summary; hide record-payment UI entirely
    if (paymentForm) {
      const paymentCard = paymentForm.closest(".card");
      if (paymentCard) paymentCard.style.display = "none";
      paymentForm.style.display = "none";
    }
    if (profileQuickPayBtn) profileQuickPayBtn.style.display = "none";
    document
      .querySelectorAll(".edit-student, .delete-student")
      .forEach((btn) => btn.remove());
  }

  if (role === "admin") {
    if (classesAdminGrid) classesAdminGrid.style.display = "grid";
    if (reportCardGrid) reportCardGrid.style.display = "none";
    if (reportReviewGrid) reportReviewGrid.style.display = "grid";
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
const amountPaidInput = document.getElementById("amountPaid");
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

const profileClassSelect = document.getElementById("profileClassSelect");
const profileStudentSelect = document.getElementById("profileStudentSelect");
const loadProfileBtn = document.getElementById("loadProfileBtn");
const profileDetailsBody = document.getElementById("profileDetails");
const profilePaymentsBody = document.querySelector(
  "#profilePaymentsTable tbody"
);
const profileResultsBody = document.querySelector("#profileResultsTable tbody");

const profileQuickPayBtn = document.getElementById("profileQuickPay");
const profileQuickResultBtn = document.getElementById("profileQuickResult");
const profilePhotoInput = document.getElementById("profilePhotoInput");
const profilePhotoBtn = document.getElementById("profilePhotoBtn");
const profileAvatarImg = document.getElementById("profileAvatarImg");
const profileAvatarFallback = document.getElementById("profileAvatarFallback");

let currentProfileStudentId = null;
let currentProfileClassId = null;

const paymentClassSelect = document.getElementById("paymentClassSelect");

const seedClassesBtn = document.getElementById("seedClassesBtn");
const classesAdminGrid = document.getElementById("classesAdminGrid");
const reportCardGrid = document.getElementById("reportCardGrid");
const reportReviewGrid = document.getElementById("reportReviewGrid");
const reportForm = document.getElementById("reportForm");
const reportStudentSelect = document.getElementById("reportStudentSelect");
const reportTermInput = document.getElementById("reportTerm");
const reportSessionInput = document.getElementById("reportSession");
const reportGenerateBtn = document.getElementById("reportGenerateBtn");
const reportSaveBtn = document.getElementById("reportSaveBtn");
const reportSubmitBtn = document.getElementById("reportSubmitBtn");
const reportPrintBtn = document.getElementById("reportPrintBtn");
const reportPreview = document.getElementById("reportPreview");
const reportStatusPill = document.getElementById("reportStatusPill");

const adminReportStatus = document.getElementById("adminReportStatus");
const adminReportTableBody = document.querySelector("#adminReportTable tbody");
const adminReportPreview = document.getElementById("adminReportPreview");
const adminApproveBtn = document.getElementById("adminApproveBtn");
const adminPrintBtn = document.getElementById("adminPrintBtn");

const roleBadge = document.getElementById("roleBadge");
const logoutBtn = document.getElementById("logoutBtn");

const API = "http://localhost:3000/api";
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
let assignedClassId = localStorage.getItem("assigned_class_id") || "";

const toastHost = document.getElementById("toastHost");

function notify(message, type = "info", options = {}) {
  const opts = { title: null, timeout: 4200, ...options };
  const safeType = ["success", "error", "warning", "info"].includes(type)
    ? type
    : "info";

  if (!toastHost) {
    console.log(`[${safeType}]`, message);
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast toast--${safeType}`;

  const titleText =
    opts.title ||
    (safeType === "success"
      ? "Success"
      : safeType === "error"
      ? "Error"
      : safeType === "warning"
      ? "Notice"
      : "Info");

  toast.innerHTML = `
    <div>
      <p class="toast__title">${titleText}</p>
      <p class="toast__msg"></p>
    </div>
    <button type="button" class="toast__close">Close</button>
  `;

  const msgEl = toast.querySelector(".toast__msg");
  if (msgEl) msgEl.textContent = String(message || "");

  const closeBtn = toast.querySelector(".toast__close");
  const remove = () => toast.remove();
  if (closeBtn) closeBtn.addEventListener("click", remove);

  toastHost.appendChild(toast);

  if (opts.timeout && Number(opts.timeout) > 0) {
    window.setTimeout(remove, Number(opts.timeout));
  }
}

function setTableStatus(tbody, colSpan, text) {
  if (!tbody) return;
  const span = Number(colSpan) || 1;
  tbody.innerHTML = `<tr><td class="table-status" colspan="${span}">${text}</td></tr>`;
  applyMobileTableLabels(tbody);
}

function applyMobileTableLabels(tbody) {
  const table = tbody?.closest?.("table");
  if (!table) return;
  const headers = Array.from(table.querySelectorAll("thead th")).map((th) =>
    String(th.textContent || "").trim()
  );
  if (!headers.length) return;

  table.classList.add("table--stack");

  Array.from(tbody.querySelectorAll("tr")).forEach((tr) => {
    const tds = Array.from(tr.children).filter(
      (el) => el && el.tagName === "TD"
    );
    tds.forEach((td, idx) => {
      if (td.classList.contains("table-status")) return;
      const label = headers[idx] || "";
      if (label) td.setAttribute("data-label", label);
    });
  });
}

function setButtonBusy(btn, busy, busyText) {
  if (!btn) return;
  if (busy) {
    if (!btn.dataset.defaultText) btn.dataset.defaultText = btn.textContent;
    btn.disabled = true;
    if (busyText) btn.textContent = busyText;
  } else {
    btn.disabled = false;
    if (btn.dataset.defaultText) btn.textContent = btn.dataset.defaultText;
  }
}

async function runWithFormBusy(formEl, busyText, fn) {
  if (!formEl) return fn();
  if (formEl.dataset.busy === "1") return;
  formEl.dataset.busy = "1";

  const submitBtn = formEl.querySelector('button[type="submit"]');
  const fields = formEl.querySelectorAll("input, select, textarea, button");
  fields.forEach((el) => {
    if (el === submitBtn) return;
    el.disabled = true;
  });
  setButtonBusy(submitBtn, true, busyText);

  try {
    await fn();
  } finally {
    fields.forEach((el) => {
      if (el === submitBtn) return;
      el.disabled = false;
    });
    setButtonBusy(submitBtn, false);
    formEl.dataset.busy = "0";
  }
}

async function runWithButtonBusy(btn, busyText, fn) {
  if (!btn) return fn();
  if (btn.dataset.busy === "1") return;
  btn.dataset.busy = "1";
  setButtonBusy(btn, true, busyText);
  try {
    await fn();
  } finally {
    setButtonBusy(btn, false);
    btn.dataset.busy = "0";
  }
}

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
let reportUIInitialized = false;
let currentTeacherReportId = null;
let currentTeacherReportStatus = null;
let adminSelectedReportId = null;

function setSelectPlaceholder(selectEl, text) {
  if (!selectEl) return;
  selectEl.innerHTML = `<option value="" disabled selected>${text}</option>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function gradeFromPercent(percent) {
  const n = Number(percent);
  if (!Number.isFinite(n)) return "-";
  if (n >= 70) return "A";
  if (n >= 60) return "B";
  if (n >= 50) return "C";
  if (n >= 45) return "D";
  if (n >= 40) return "E";
  return "F";
}

function statusLabel(status) {
  const s = String(status || "").toLowerCase();
  if (s === "approved") return "Approved";
  if (s === "submitted") return "Submitted";
  return "Draft";
}

function setReportStatus(status) {
  currentTeacherReportStatus = status || null;
  if (!reportStatusPill) return;
  reportStatusPill.style.display = "inline-flex";
  reportStatusPill.textContent = `Status: ${statusLabel(status)}`;
}

function defaultSubjects() {
  // NOTE: Replace these to match your exact report-card picture.
  return [
    "English Language",
    "Mathematics",
    "Basic Science",
    "Basic Technology",
    "Social Studies",
    "Civic Education",
    "Computer Studies",
    "Agricultural Science",
    "C.R.S / I.R.S",
    "Home Economics",
    "Creative Arts",
    "Physical & Health Education",
  ];
}

function defaultAffectiveTraits() {
  return [
    "Punctuality",
    "Attendance",
    "Attentiveness",
    "Honesty",
    "Neatness",
    "Politeness",
    "Self Control",
    "Relationship with others",
  ];
}

function defaultPsychomotorTraits() {
  return [
    "Handwriting",
    "Sports",
    "Handling tools",
    "Drawing/painting",
    "Musical skills",
  ];
}

function ratingSelectHtml(value) {
  const v = String(value ?? "");
  const opts = [
    { k: "", t: "-" },
    { k: "5", t: "5" },
    { k: "4", t: "4" },
    { k: "3", t: "3" },
    { k: "2", t: "2" },
    { k: "1", t: "1" },
  ];
  return `<select class="report-input" data-role="rating">${opts
    .map(
      (o) =>
        `<option value="${o.k}" ${o.k === v ? "selected" : ""}>${o.t}</option>`
    )
    .join("")}</select>`;
}

function normalizeScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function computeGrade(total) {
  return gradeFromPercent(total);
}

function renderTeacherReportTemplate({ student, term, session, payload }) {
  const p = payload || {};
  const subjects =
    Array.isArray(p.subjects) && p.subjects.length
      ? p.subjects
      : defaultSubjects().map((name) => ({ name, ca: "", exam: "" }));

  const attendance = p.attendance || {};
  const affective = p.affective || {};
  const psychomotor = p.psychomotor || {};

  const teacherName = p.teacher_name || meCache?.username || "";
  const principalName = p.principal_name || "";
  const teacherRemark = p.teacher_remark || "";
  const principalRemark = p.principal_remark || "";

  const classLabel = student?.class_name
    ? `${student.class_name} ${student.arm || ""}`
    : "-";

  const photoHtml = student?.photo_data_url
    ? `<img src="${escapeHtml(student.photo_data_url)}" alt="Student photo" />`
    : `<span class="pill pill--active">No photo</span>`;

  const subjectRows = subjects
    .map((row, idx) => {
      const ca = row?.ca ?? "";
      const exam = row?.exam ?? "";
      const total = normalizeScore(ca) * 0.4 + normalizeScore(exam) * 0.6;
      const computedGrade = computeGrade(total);
      const manualGrade = String(row?.grade ?? "").trim();
      const grade = manualGrade || computedGrade;
      const isManual = String(row?.grade_manual ?? "") === "1";
      return `
        <tr data-subject-idx="${idx}">
          <td><input class="report-input" data-field="subject.name" value="${escapeHtml(
            row?.name || ""
          )}" /></td>
          <td style="width:90px"><input class="report-input" data-field="subject.ca" inputmode="decimal" value="${escapeHtml(
            ca
          )}" placeholder="0-100" /></td>
          <td style="width:90px"><input class="report-input" data-field="subject.exam" inputmode="decimal" value="${escapeHtml(
            exam
          )}" placeholder="0-100" /></td>
          <td style="width:90px"><input class="report-input" data-field="subject.total" value="${total.toFixed(
            0
          )}" readonly /></td>
          <td style="width:70px"><input class="report-input" data-field="subject.grade" value="${escapeHtml(
            grade
          )}" data-manual="${isManual ? "1" : "0"}" placeholder="A-F" /></td>
          <td><input class="report-input" data-field="subject.remark" value="${escapeHtml(
            row?.remark || ""
          )}" placeholder="Remark" /></td>
        </tr>
      `;
    })
    .join("");

  const affectiveRows = defaultAffectiveTraits()
    .map((t) => {
      const key = t;
      return `
        <tr>
          <td>${escapeHtml(t)}</td>
          <td style="width:120px">${ratingSelectHtml(affective[key])}</td>
        </tr>
      `;
    })
    .join("");

  const psychomotorRows = defaultPsychomotorTraits()
    .map((t) => {
      const key = t;
      return `
        <tr>
          <td>${escapeHtml(t)}</td>
          <td style="width:120px">${ratingSelectHtml(psychomotor[key])}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <div class="report-sheet" data-report="teacher">
      <div class="report-head">
        <div>
          <p class="eyebrow">Student's performance report</p>
          <h3 class="report-title">Report Card</h3>
          <p class="report-subtitle">Term: ${escapeHtml(
            term
          )} · Session: ${escapeHtml(session)}</p>
        </div>
        <div class="report-photo">${photoHtml}</div>
      </div>

      <div class="report-grid">
        <div class="report-kv"><p>Name</p><strong>${escapeHtml(
          student?.full_name
        )}</strong></div>
        <div class="report-kv"><p>Admission No</p><strong>${escapeHtml(
          student?.admission_no
        )}</strong></div>
        <div class="report-kv"><p>Class</p><strong>${escapeHtml(
          classLabel
        )}</strong></div>
        <div class="report-kv"><p>Gender</p><strong>${escapeHtml(
          student?.gender || "-"
        )}</strong></div>
      </div>

      <table class="report-table" aria-label="Cognitive domain">
        <thead>
          <tr>
            <th>COGNITIVE DOMAIN (40% CA / 60% Exam)</th>
            <th style="width:90px">CA</th>
            <th style="width:90px">EXAM</th>
            <th style="width:90px">TOTAL</th>
            <th style="width:70px">GRADE</th>
            <th>REMARKS</th>
          </tr>
        </thead>
        <tbody>
          ${subjectRows}
        </tbody>
      </table>

      <table class="report-table" aria-label="Attendance summary">
        <thead>
          <tr><th colspan="2">ATTENDANCE SUMMARY</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>No. of times school opened</td>
            <td><input class="report-input" data-field="attendance.opened" value="${escapeHtml(
              attendance.opened || ""
            )}" placeholder="e.g. 150" /></td>
          </tr>
          <tr>
            <td>No. of times present</td>
            <td><input class="report-input" data-field="attendance.present" value="${escapeHtml(
              attendance.present || ""
            )}" placeholder="e.g. 150" /></td>
          </tr>
          <tr>
            <td>No. of times absent</td>
            <td><input class="report-input" data-field="attendance.absent" value="${escapeHtml(
              attendance.absent || ""
            )}" placeholder="e.g. 0" /></td>
          </tr>
        </tbody>
      </table>

      <table class="report-table" aria-label="Affective domain">
        <thead>
          <tr><th>AFFECTIVE DOMAIN</th><th style="width:120px">RATING (1-5)</th></tr>
        </thead>
        <tbody>${affectiveRows}</tbody>
      </table>

      <table class="report-table" aria-label="Psychomotor domain">
        <thead>
          <tr><th>PSYCHOMOTOR DOMAIN</th><th style="width:120px">RATING (1-5)</th></tr>
        </thead>
        <tbody>${psychomotorRows}</tbody>
      </table>

      <table class="report-table" aria-label="Remarks">
        <thead>
          <tr><th>REMARKS</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <p class="section-note" style="margin:0 0 8px">Teacher's remark</p>
              <textarea class="report-textarea" data-field="teacher_remark" placeholder="Write teacher remark...">${escapeHtml(
                teacherRemark
              )}</textarea>
              <div style="height:10px"></div>
              <p class="section-note" style="margin:0 0 8px">Principal's remark</p>
              <textarea class="report-textarea" data-field="principal_remark" placeholder="Write principal remark...">${escapeHtml(
                principalRemark
              )}</textarea>
            </td>
          </tr>
        </tbody>
      </table>

      <table class="report-table" aria-label="Signatures">
        <tbody>
          <tr>
            <td style="width: 50%">Teacher's name: <input class="report-input" data-field="teacher_name" value="${escapeHtml(
              teacherName
            )}" placeholder="Name" /></td>
            <td>Sign: <input class="report-input" data-field="teacher_sign" value="${escapeHtml(
              p.teacher_sign || ""
            )}" placeholder="Signature" /></td>
          </tr>
          <tr>
            <td>Principal's name: <input class="report-input" data-field="principal_name" value="${escapeHtml(
              principalName
            )}" placeholder="Name" /></td>
            <td>Sign: <input class="report-input" data-field="principal_sign" value="${escapeHtml(
              p.principal_sign || ""
            )}" placeholder="Signature" /></td>
          </tr>
        </tbody>
      </table>

      <p class="report-subtitle">Grade scale: 70–100 A, 60–69 B, 50–59 C, 45–49 D, 40–44 E, 0–39 F</p>
    </div>
  `;
}

function collectTeacherReportPayload() {
  if (!reportPreview) return null;
  const root = reportPreview.querySelector('[data-report="teacher"]');
  if (!root) return null;

  const payload = {
    subjects: [],
    attendance: {},
    affective: {},
    psychomotor: {},
  };

  // Subjects
  root.querySelectorAll("tr[data-subject-idx]").forEach((tr) => {
    const name = tr.querySelector('[data-field="subject.name"]')?.value ?? "";
    const ca = tr.querySelector('[data-field="subject.ca"]')?.value ?? "";
    const exam = tr.querySelector('[data-field="subject.exam"]')?.value ?? "";
    const grade = tr.querySelector('[data-field="subject.grade"]')?.value ?? "";
    const gradeManual =
      tr.querySelector('[data-field="subject.grade"]')?.dataset?.manual === "1"
        ? "1"
        : "0";
    const remark =
      tr.querySelector('[data-field="subject.remark"]')?.value ?? "";
    payload.subjects.push({
      name: String(name).trim(),
      ca: String(ca).trim(),
      exam: String(exam).trim(),
      grade: String(grade).trim(),
      grade_manual: gradeManual,
      remark: String(remark).trim(),
    });
  });

  // Attendance
  payload.attendance.opened =
    root.querySelector('[data-field="attendance.opened"]')?.value ?? "";
  payload.attendance.present =
    root.querySelector('[data-field="attendance.present"]')?.value ?? "";
  payload.attendance.absent =
    root.querySelector('[data-field="attendance.absent"]')?.value ?? "";

  // Remarks + signatures
  payload.teacher_remark =
    root.querySelector('[data-field="teacher_remark"]')?.value ?? "";
  payload.principal_remark =
    root.querySelector('[data-field="principal_remark"]')?.value ?? "";
  payload.teacher_name =
    root.querySelector('[data-field="teacher_name"]')?.value ?? "";
  payload.teacher_sign =
    root.querySelector('[data-field="teacher_sign"]')?.value ?? "";
  payload.principal_name =
    root.querySelector('[data-field="principal_name"]')?.value ?? "";
  payload.principal_sign =
    root.querySelector('[data-field="principal_sign"]')?.value ?? "";

  // Ratings tables
  const affectiveRows = root.querySelectorAll(
    'table[aria-label="Affective domain"] tbody tr'
  );
  affectiveRows.forEach((tr) => {
    const trait = tr.querySelector("td")?.textContent?.trim();
    const val = tr.querySelector('select[data-role="rating"]')?.value ?? "";
    if (!trait) return;
    payload.affective[trait] = val;
  });

  const psychoRows = root.querySelectorAll(
    'table[aria-label="Psychomotor domain"] tbody tr'
  );
  psychoRows.forEach((tr) => {
    const trait = tr.querySelector("td")?.textContent?.trim();
    const val = tr.querySelector('select[data-role="rating"]')?.value ?? "";
    if (!trait) return;
    payload.psychomotor[trait] = val;
  });

  return payload;
}

function recalcSubjectRow(tr) {
  const caVal = tr.querySelector('[data-field="subject.ca"]')?.value;
  const examVal = tr.querySelector('[data-field="subject.exam"]')?.value;
  const total = normalizeScore(caVal) * 0.4 + normalizeScore(examVal) * 0.6;
  const grade = computeGrade(total);
  const totalEl = tr.querySelector('[data-field="subject.total"]');
  const gradeEl = tr.querySelector('[data-field="subject.grade"]');
  if (totalEl) totalEl.value = total.toFixed(0);
  if (gradeEl) {
    const isManual = gradeEl.dataset.manual === "1";
    const hasManualValue = String(gradeEl.value || "").trim().length > 0;
    if (!isManual || !hasManualValue) {
      gradeEl.value = grade;
      gradeEl.dataset.manual = "0";
    }
  }
}

function bindReportAutoCalc() {
  if (!reportPreview) return;
  reportPreview.addEventListener("input", (e) => {
    const target = e.target;
    if (!target) return;
    const tr = target.closest?.("tr[data-subject-idx]");
    if (!tr) return;
    const field = target.getAttribute?.("data-field") || "";
    if (field === "subject.ca" || field === "subject.exam") {
      recalcSubjectRow(tr);
    }
    if (field === "subject.grade") {
      target.dataset.manual = "1";
      // normalize grade to single uppercase letter if possible
      const v = String(target.value || "").trim();
      if (v) target.value = v[0].toUpperCase();
    }
  });
}

function renderAdminReadonlyTemplate({ report }) {
  const payload = report?.payload || {};
  const student = {
    full_name: report?.full_name,
    admission_no: report?.admission_no,
    gender: report?.gender,
    photo_data_url: report?.photo_data_url,
    class_name: report?.class_name,
    arm: report?.class_arm,
  };

  // Reuse teacher template but replace inputs with plain text by rendering it and then disabling.
  const html = renderTeacherReportTemplate({
    student,
    term: report?.term,
    session: report?.session,
    payload,
  });
  return html;
}

function populateReportStudents() {
  if (!reportStudentSelect) return;
  if (role !== "teacher") return;

  const list = studentsCache || [];
  if (!list.length) {
    setSelectPlaceholder(reportStudentSelect, "No students found");
    return;
  }

  reportStudentSelect.innerHTML =
    '<option value="" disabled selected>Select student</option>' +
    list
      .map(
        (s) =>
          `<option value="${s.id}">${escapeHtml(s.full_name)} (${escapeHtml(
            s.admission_no
          )})</option>`
      )
      .join("");
}

async function buildReportPreview() {
  if (!reportPreview) return;

  const studentId = reportStudentSelect?.value;
  const term = reportTermInput?.value?.trim();
  const session = reportSessionInput?.value?.trim();

  if (!studentId || !term || !session) {
    reportPreview.innerHTML =
      '<div class="report-sheet"><p class="section-note">Select student, term, and session, then load the template.</p></div>';
    if (reportPrintBtn) reportPrintBtn.disabled = true;
    if (reportSaveBtn) reportSaveBtn.disabled = true;
    if (reportSubmitBtn) reportSubmitBtn.disabled = true;
    if (reportStatusPill) reportStatusPill.style.display = "none";
    currentTeacherReportId = null;
    currentTeacherReportStatus = null;
    return;
  }

  const student = (studentsCache || []).find(
    (s) => String(s.id) === String(studentId)
  );

  if (!student) {
    reportPreview.innerHTML =
      '<div class="report-sheet"><p class="section-note">Student not found.</p></div>';
    if (reportPrintBtn) reportPrintBtn.disabled = true;
    return;
  }

  // Try to load existing draft/submission for this student+term+session
  currentTeacherReportId = null;
  currentTeacherReportStatus = null;
  let payload = null;
  try {
    const list = await authFetch(`${API}/report-cards/mine`).then(safeJson);
    const match = (list || []).find(
      (r) =>
        String(r.student_id) === String(studentId) &&
        String(r.term) === String(term) &&
        String(r.session) === String(session)
    );
    if (match?.id) {
      const full = await authFetch(`${API}/report-cards/${match.id}`).then(
        safeJson
      );
      currentTeacherReportId = full?.id || match.id;
      currentTeacherReportStatus = full?.status || match.status;
      payload = full?.payload || null;
    }
  } catch (_e) {
    // ignore
  }

  reportPreview.innerHTML = renderTeacherReportTemplate({
    student,
    term,
    session,
    payload,
  });

  setReportStatus(currentTeacherReportStatus || "draft");

  const locked =
    String(currentTeacherReportStatus || "").toLowerCase() === "submitted" ||
    String(currentTeacherReportStatus || "").toLowerCase() === "approved";
  reportPreview.querySelectorAll("input, textarea, select").forEach((el) => {
    if (el.hasAttribute("readonly")) return;
    el.disabled = locked;
  });

  if (reportSaveBtn) reportSaveBtn.disabled = locked;
  if (reportSubmitBtn) reportSubmitBtn.disabled = locked;
  if (reportPrintBtn)
    reportPrintBtn.disabled = String(currentTeacherReportStatus) !== "approved";
}

function initReportCardUI() {
  if (reportUIInitialized) return;
  if (role !== "teacher") return;
  if (!reportForm || !reportGenerateBtn || !reportPrintBtn) return;

  reportUIInitialized = true;

  reportForm.addEventListener("submit", (e) => e.preventDefault());

  reportGenerateBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    reportGenerateBtn.disabled = true;
    try {
      await buildReportPreview();
    } finally {
      reportGenerateBtn.disabled = false;
    }
  });

  if (reportSaveBtn) {
    reportSaveBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const studentId = reportStudentSelect?.value;
      const term = reportTermInput?.value?.trim();
      const session = reportSessionInput?.value?.trim();
      if (!studentId || !term || !session) {
        notify("Select student, term, and session first.", "warning");
        return;
      }

      const payload = collectTeacherReportPayload();
      if (!payload) {
        notify("Load the template first.", "warning");
        return;
      }

      reportSaveBtn.disabled = true;
      try {
        const out = await authFetch(`${API}/report-cards/draft`, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            student_id: Number(studentId),
            term,
            session,
            payload,
          }),
        }).then(safeJson);
        currentTeacherReportId = out?.id || currentTeacherReportId;
        setReportStatus(out?.status || "draft");
        notify("Report card draft saved.", "success");
      } catch (err) {
        notify(`Could not save draft: ${err.message}`, "error");
      } finally {
        reportSaveBtn.disabled = false;
      }
    });
  }

  if (reportSubmitBtn) {
    reportSubmitBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      if (!currentTeacherReportId) {
        notify("Save draft first before sending.", "warning");
        return;
      }
      reportSubmitBtn.disabled = true;
      try {
        await authFetch(
          `${API}/report-cards/${currentTeacherReportId}/submit`,
          {
            method: "POST",
            headers: authHeaders,
          }
        ).then(safeJson);
        setReportStatus("submitted");
        notify("Sent to owner for review.", "success");
        await buildReportPreview();
      } catch (err) {
        notify(`Could not submit: ${err.message}`, "error");
      } finally {
        reportSubmitBtn.disabled = false;
      }
    });
  }

  reportPrintBtn.addEventListener("click", (e) => {
    e.preventDefault();
    window.print();
  });

  // Initial state
  reportPrintBtn.disabled = true;
  populateReportStudents();
  buildReportPreview();

  bindReportAutoCalc();
}

let adminReportUIInitialized = false;

async function loadAdminReportCards() {
  if (role !== "admin") return;
  if (!adminReportTableBody) return;

  const status = adminReportStatus?.value;
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  setTableStatus(adminReportTableBody, 8, "Loading report cards...");
  try {
    const rows = await authFetch(`${API}/report-cards${qs}`).then(safeJson);
    const list = rows || [];
    if (!list.length) {
      setTableStatus(adminReportTableBody, 8, "No report cards found.");
      return;
    }

    adminReportTableBody.innerHTML = list
      .map((r) => {
        const classLabel = r.class_name
          ? `${r.class_name} ${r.class_arm || ""}`
          : "-";
        const s = String(r.status || "draft");
        const statusBadge =
          s === "approved"
            ? '<span class="badge badge--active">Approved</span>'
            : s === "submitted"
            ? '<span class="badge badge--pending">Submitted</span>'
            : '<span class="badge badge--disabled">Draft</span>';

        return `
          <tr data-id="${r.id}">
            <td>${escapeHtml(r.full_name || "-")}</td>
            <td>${escapeHtml(classLabel)}</td>
            <td>${escapeHtml(r.term || "-")}</td>
            <td>${escapeHtml(r.session || "-")}</td>
            <td>${escapeHtml(r.teacher_username || "-")}</td>
            <td>${statusBadge}</td>
            <td>${escapeHtml(r.updated_at || "-")}</td>
            <td class="actions">
              <button class="ghost-btn admin-view-report" data-id="${
                r.id
              }">View</button>
            </td>
          </tr>
        `;
      })
      .join("");
    applyMobileTableLabels(adminReportTableBody);
  } catch (err) {
    notify(`Failed to load report cards: ${err.message}`, "error");
    setTableStatus(adminReportTableBody, 8, "Failed to load report cards.");
  }
}

async function loadAdminReportPreview(id) {
  if (!adminReportPreview) return;
  adminSelectedReportId = id;
  adminReportPreview.innerHTML =
    '<div class="report-sheet"><p class="section-note">Loading report preview...</p></div>';
  if (adminApproveBtn) adminApproveBtn.disabled = true;
  if (adminPrintBtn) adminPrintBtn.disabled = true;

  try {
    const report = await authFetch(`${API}/report-cards/${id}`).then(safeJson);
    adminReportPreview.innerHTML = renderAdminReadonlyTemplate({ report });
    // disable inputs
    adminReportPreview
      .querySelectorAll("input, textarea, select")
      .forEach((el) => {
        el.disabled = true;
      });

    const status = String(report?.status || "draft");
    if (adminApproveBtn) adminApproveBtn.disabled = status !== "submitted";
    if (adminPrintBtn) adminPrintBtn.disabled = status !== "approved";
  } catch (err) {
    adminReportPreview.innerHTML =
      '<div class="report-sheet"><p class="section-note">Could not load preview.</p></div>';
    notify(`Could not load report: ${err.message}`, "error");
  }
}

function initAdminReportReviewUI() {
  if (adminReportUIInitialized) return;
  if (role !== "admin") return;
  if (!adminReportTableBody || !adminReportPreview) return;
  adminReportUIInitialized = true;

  if (adminReportStatus) {
    adminReportStatus.addEventListener("change", loadAdminReportCards);
  }

  if (adminReportTableBody) {
    adminReportTableBody.addEventListener("click", async (e) => {
      const btn = e.target?.closest?.(".admin-view-report");
      if (!btn) return;
      const id = Number(btn.dataset.id);
      if (!id) return;
      await loadAdminReportPreview(id);
    });
  }

  if (adminApproveBtn) {
    adminApproveBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      if (!adminSelectedReportId) return;
      adminApproveBtn.disabled = true;
      try {
        await authFetch(
          `${API}/report-cards/${adminSelectedReportId}/approve`,
          { method: "POST", headers: authHeaders }
        ).then(safeJson);
        notify("Report approved.", "success");
        await loadAdminReportPreview(adminSelectedReportId);
        await loadAdminReportCards();
      } catch (err) {
        notify(`Approve failed: ${err.message}`, "error");
      } finally {
        // loadAdminReportPreview sets correct state
      }
    });
  }

  if (adminPrintBtn) {
    adminPrintBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.print();
    });
  }
}

function populateStudentsForClass(selectEl, classId) {
  if (!selectEl) return;
  const cid = Number(classId);
  if (!cid) {
    setSelectPlaceholder(selectEl, "Select class first");
    return;
  }

  const filtered = (studentsCache || []).filter(
    (s) => Number(s.class_id) === cid
  );

  if (!filtered.length) {
    selectEl.innerHTML =
      '<option value="" disabled selected>No students in this class</option>';
    return;
  }

  const options = filtered
    .map(
      (s) =>
        `<option value="${s.id}">${s.full_name} (${s.admission_no})</option>`
    )
    .join("");

  selectEl.innerHTML =
    '<option value="" disabled selected>Select student</option>' + options;
}

function initialsFromName(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "S";
  const a = parts[0]?.[0] || "";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] || "" : "";
  return (a + b).toUpperCase() || "S";
}

function setProfileAvatar(student) {
  const dataUrl = student?.photo_data_url;
  if (profileAvatarFallback) {
    profileAvatarFallback.textContent = initialsFromName(student?.full_name);
  }
  if (!profileAvatarImg) return;
  if (dataUrl) {
    profileAvatarImg.src = dataUrl;
    profileAvatarImg.style.display = "block";
    if (profileAvatarFallback) profileAvatarFallback.style.display = "none";
  } else {
    profileAvatarImg.removeAttribute("src");
    profileAvatarImg.style.display = "none";
    if (profileAvatarFallback) profileAvatarFallback.style.display = "grid";
  }
}

async function imageFileToDataUrl(file) {
  const maxSide = 280;
  const quality = 0.82;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, w, h);

  // Prefer jpeg for smaller payload
  return canvas.toDataURL("image/jpeg", quality);
}

function setProfileQuickActionsEnabled(enabled) {
  const ok = Boolean(enabled);
  if (profileQuickPayBtn) profileQuickPayBtn.disabled = !ok;
  if (profileQuickResultBtn) profileQuickResultBtn.disabled = !ok;
  if (profilePhotoBtn) {
    // Allow teachers to upload photos for students in their assigned class
    const allowPhoto =
      role === "admin" || role === "account" || role === "teacher";
    profilePhotoBtn.style.display = allowPhoto ? "inline-flex" : "none";
  }
}

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
    try {
      sessionStorage.setItem("activeTabId", String(tab.dataset.tab || ""));
    } catch (_err) {
      // ignore
    }

    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    tabContents.forEach((tc) => tc.classList.remove("active"));
    document.getElementById(tab.dataset.tab).classList.add("active");
  });
});

function getActiveTabId() {
  return (
    document.querySelector(".tab-btn.active")?.dataset?.tab ||
    document.querySelector(".tab-content.active")?.id ||
    null
  );
}

function restoreActiveTab(tabId) {
  if (!tabId) return;
  const btn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
  if (!btn) return;
  // Don't switch to tabs hidden by role UI
  if (btn.offsetParent === null) return;
  try {
    sessionStorage.setItem("activeTabId", String(tabId));
  } catch (_err) {
    // ignore
  }
  btn.click();
}

if (tabs.length) {
  let desired = null;
  try {
    desired = sessionStorage.getItem("activeTabId");
  } catch (_err) {
    desired = null;
  }

  const desiredBtn = desired
    ? document.querySelector(`.tab-btn[data-tab="${desired}"]`)
    : null;
  if (desiredBtn && desiredBtn.offsetParent !== null) {
    desiredBtn.click();
  } else {
    tabs[0].click();
  }
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
  setTableStatus(classesTableBody, 3, "Loading classes...");
  setSelectPlaceholder(classSelect, "Loading classes...");
  setSelectPlaceholder(resultClassSelect, "Loading classes...");
  setSelectPlaceholder(profileClassSelect, "Loading classes...");
  setSelectPlaceholder(paymentClassSelect, "Loading classes...");

  const res = await authFetch(`${API}/classes`);
  const classes = await safeJson(res).catch((err) => {
    notify(`Failed to load classes: ${err.message}`, "error");
    setTableStatus(classesTableBody, 3, "Failed to load classes.");
    return [];
  });
  if (!classes.length) {
    setTableStatus(
      classesTableBody,
      3,
      "No classes yet. Add a class or use Seed."
    );
    setSelectPlaceholder(classSelect, "No classes yet");
    setSelectPlaceholder(resultClassSelect, "No classes yet");
    setSelectPlaceholder(profileClassSelect, "No classes yet");
    setSelectPlaceholder(paymentClassSelect, "No classes yet");
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
  if (profileClassSelect) profileClassSelect.innerHTML = classOptionsHtml;
  if (paymentClassSelect) paymentClassSelect.innerHTML = classOptionsHtml;
  classesTableBody.innerHTML = classes
    .map(
      (c) => `
    <tr>
      <td>${c.name}</td>
      <td>${c.arm || "-"}</td>
      <td class="actions">
        ${
          role === "admin"
            ? `<button type="button" class="ghost-btn class-remove" data-id="${c.id}">Remove</button>`
            : "-"
        }
      </td>
    </tr>`
    )
    .join("");
  applyMobileTableLabels(classesTableBody);
  return classes;
}

if (classesTableBody) {
  classesTableBody.addEventListener("click", async (e) => {
    const btn = e.target.closest?.(".class-remove");
    if (!btn) return;
    e.preventDefault();
    if (role !== "admin") {
      notify("Only admin can remove classes.", "warning");
      return;
    }

    const id = btn.dataset.id;
    if (!id) return;
    if (!confirm("Remove this class?")) return;

    await runWithButtonBusy(btn, "Removing...", async () => {
      try {
        await authFetch(`${API}/classes/${id}`, {
          method: "DELETE",
          headers: authHeaders,
        }).then(safeJson);
        notify("Class removed", "success");
        const activeTab = getActiveTabId();
        await loadClasses();
        await loadUsers();
        restoreActiveTab(activeTab);
      } catch (err) {
        notify(`Remove failed: ${err.message}`, "error");
      }
    });
  });
}

async function loadClassResults() {
  if (!resultClassSelect || !resultsTableBody) return;

  const classId = resultClassSelect.value;
  const term = resultTermInput?.value?.trim();
  const session = resultSessionInput?.value?.trim();

  if (!classId) return;

  setTableStatus(resultsTableBody, 7, "Loading results...");

  if (!term || !session) {
    setTableStatus(
      resultsTableBody,
      7,
      "Enter term and session to load results."
    );
    // Allow saving new results even before any results exist
    populateStudentsForClass(resultStudentSelect, classId);
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
    setTableStatus(
      resultsTableBody,
      7,
      `Failed to load results: ${err.message}`
    );
    if (resultStudentSelect) resultStudentSelect.innerHTML = "";
    return;
  }

  if (!rows || rows.length === 0) {
    setTableStatus(
      resultsTableBody,
      7,
      "No results yet for this class/term/session. Use the form to save results."
    );
    populateStudentsForClass(resultStudentSelect, classId);
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
  applyMobileTableLabels(resultsTableBody);
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
      notify("Enter term and session first.", "warning");
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
        notify("Please enter valid non-negative scores.", "warning");
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
        notify(`Could not save result: ${err.message}`, "error");
        return;
      }

      await loadClassResults();
    }
  });
}

async function loadStudents() {
  setTableStatus(studentsTableBody, 4, "Loading students...");
  const res = await authFetch(`${API}/students`);
  const students = await safeJson(res).catch((err) => {
    notify(`Failed to load students: ${err.message}`, "error");
    setTableStatus(studentsTableBody, 4, "Failed to load students.");
    return [];
  });
  if (!students) return [];

  const assignedCid = Number(assignedClassId || 0);
  const visibleStudents =
    role === "teacher" && assignedCid
      ? (students || []).filter((s) => Number(s.class_id) === assignedCid)
      : students;

  if (!visibleStudents.length) {
    setTableStatus(
      studentsTableBody,
      4,
      role === "teacher"
        ? "No students found in your assigned class."
        : "No students yet. Use the 'Add student' form to create one."
    );
  }

  studentsCache = visibleStudents;

  // Teacher Report Card uses the same student cache
  if (role === "teacher") {
    populateReportStudents();
  }

  studentsTableBody.innerHTML = visibleStudents
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
  applyMobileTableLabels(studentsTableBody);
  return students;
}

async function loadStudentSelect() {
  await loadStudents();

  // Class-first UX for selects
  setSelectPlaceholder(studentSelect, "Select class first");
  setSelectPlaceholder(profileStudentSelect, "Select class first");
  setSelectPlaceholder(resultStudentSelect, "Select class first");

  // If teacher is assigned to a class, preselect and lock
  if (role === "teacher" && assignedClassId) {
    if (profileClassSelect) {
      profileClassSelect.value = String(assignedClassId);
      profileClassSelect.disabled = true;
      populateStudentsForClass(profileStudentSelect, assignedClassId);
    }
  }
}

if (resultClassSelect) {
  resultClassSelect.addEventListener("change", () => {
    populateStudentsForClass(resultStudentSelect, resultClassSelect.value);
  });
}

if (profileClassSelect) {
  profileClassSelect.addEventListener("change", () => {
    populateStudentsForClass(profileStudentSelect, profileClassSelect.value);
  });
}

if (paymentClassSelect) {
  paymentClassSelect.addEventListener("change", () => {
    populateStudentsForClass(studentSelect, paymentClassSelect.value);
  });
}

async function loadUsers() {
  if (role !== "admin" || !staffTableBody) return;
  setTableStatus(staffTableBody, 6, "Loading staff...");
  try {
    const res = await authFetch(`${API}/users`);
    const users = await safeJson(res);
    const classOptions =
      '<option value="">Unassigned</option>' +
      (classesCache || [])
        .map((c) => `<option value="${c.id}">${c.name} ${c.arm || ""}</option>`)
        .join("");

    const usersList = users || [];

    if (!usersList.length) {
      setTableStatus(
        staffTableBody,
        6,
        "No staff yet. Create staff accounts using the form."
      );
      return;
    }

    staffTableBody.innerHTML = usersList
      .map((u) => {
        const isActive = Number(u.is_active ?? 1) === 1;
        const assignedLabel = u.assigned_class_name
          ? `${u.assigned_class_name} ${u.assigned_class_arm || ""}`
          : "-";

        const statusBadge = isActive
          ? '<span class="badge badge--active">Active</span>'
          : '<span class="badge badge--disabled">Disabled</span>';

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
          <td>${statusBadge}</td>
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
    applyMobileTableLabels(staffTableBody);

    // set selected option for each teacher
    (usersList || []).forEach((u) => {
      if (u.role !== "teacher") return;
      const sel = staffTableBody.querySelector(
        `.staff-assign-select[data-user-id="${u.id}"]`
      );
      if (sel && u.assigned_class_id) sel.value = String(u.assigned_class_id);
    });
  } catch (err) {
    setTableStatus(staffTableBody, 6, `Failed to load staff: ${err.message}`);
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
        notify("Select a class to assign.", "warning");
        return;
      }
      await runWithButtonBusy(assignBtn, "Assigning...", async () => {
        try {
          await authFetch(`${API}/users/${userId}/assign-class`, {
            method: "PATCH",
            headers: authHeaders,
            body: JSON.stringify({ class_id: Number(classId) }),
          }).then(safeJson);
          notify("Teacher assigned", "success");
          await loadUsers();
        } catch (err) {
          notify(`Assign failed: ${err.message}`, "error");
        }
      });
      return;
    }

    if (resetBtn) {
      const userId = resetBtn.dataset.userId;
      const newPassword = prompt("Enter new password for this staff");
      if (!newPassword) return;
      await runWithButtonBusy(resetBtn, "Resetting...", async () => {
        try {
          await authFetch(`${API}/users/${userId}/password`, {
            method: "PATCH",
            headers: authHeaders,
            body: JSON.stringify({ password: newPassword }),
          }).then(safeJson);
          notify("Password reset", "success");
        } catch (err) {
          notify(`Reset failed: ${err.message}`, "error");
        }
      });
      return;
    }

    if (toggleBtn) {
      const userId = toggleBtn.dataset.userId;
      const isActive = toggleBtn.dataset.active === "1";
      const nextActive = !isActive;
      if (!confirm(`${nextActive ? "Enable" : "Disable"} this account?`))
        return;
      await runWithButtonBusy(
        toggleBtn,
        nextActive ? "Enabling..." : "Disabling...",
        async () => {
          try {
            await authFetch(`${API}/users/${userId}/active`, {
              method: "PATCH",
              headers: authHeaders,
              body: JSON.stringify({ is_active: nextActive }),
            }).then(safeJson);
            notify(
              nextActive ? "Account enabled" : "Account disabled",
              "success"
            );
            await loadUsers();
          } catch (err) {
            notify(`Update failed: ${err.message}`, "error");
          }
        }
      );
    }
  });
}

async function loadStudentProfile(studentId) {
  if (!studentId) return;

  if (profileDetailsBody) {
    profileDetailsBody.innerHTML = `<tr><td class="table-status" colspan="2">Loading profile...</td></tr>`;
  }
  if (profilePaymentsBody)
    setTableStatus(profilePaymentsBody, 6, "Loading payments...");
  if (profileResultsBody)
    setTableStatus(profileResultsBody, 6, "Loading results...");

  const student = studentsCache.find((s) => String(s.id) === String(studentId));
  if (!student) {
    if (profileDetailsBody) profileDetailsBody.innerHTML = "";
    currentProfileStudentId = null;
    currentProfileClassId = null;
    setProfileQuickActionsEnabled(false);
    setProfileAvatar(null);
    return;
  }

  currentProfileStudentId = Number(student.id);
  currentProfileClassId = Number(student.class_id || 0);
  setProfileAvatar(student);
  setProfileQuickActionsEnabled(true);

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
    applyMobileTableLabels(profileDetailsBody);
  }

  if (profilePaymentsBody) {
    try {
      const res = await authFetch(`${API}/payments/student/${studentId}`);
      const payments = await safeJson(res);

      const list = payments || [];
      if (!list.length) {
        setTableStatus(profilePaymentsBody, 6, "No payments recorded yet.");
      } else {
        profilePaymentsBody.innerHTML = list
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
        applyMobileTableLabels(profilePaymentsBody);
      }
    } catch (err) {
      setTableStatus(
        profilePaymentsBody,
        6,
        `Failed to load payments: ${err.message}`
      );
    }
  }

  if (role !== "account" && profileResultsBody) {
    try {
      const res = await authFetch(`${API}/results/student/${studentId}`);
      const results = await safeJson(res);

      const list = results || [];
      if (!list.length) {
        setTableStatus(profileResultsBody, 6, "No results recorded yet.");
      } else {
        profileResultsBody.innerHTML = list
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
        applyMobileTableLabels(profileResultsBody);
      }
    } catch (err) {
      setTableStatus(
        profileResultsBody,
        6,
        `Failed to load results: ${err.message}`
      );
    }
  }
}

if (profileQuickPayBtn) {
  profileQuickPayBtn.addEventListener("click", () => {
    if (!currentProfileStudentId || !currentProfileClassId) {
      notify("Load a student profile first.", "warning");
      return;
    }
    const tabBtn = document.querySelector('[data-tab="paymentsTab"]');
    if (!tabBtn || tabBtn.offsetParent === null) {
      notify("Payments is not available for your role.", "warning");
      return;
    }
    tabBtn.click();
    if (paymentClassSelect) {
      paymentClassSelect.value = String(currentProfileClassId);
      paymentClassSelect.dispatchEvent(new Event("change"));
    }
    if (studentSelect) studentSelect.value = String(currentProfileStudentId);
    amountPaidInput?.focus?.();
  });
}

if (profileQuickResultBtn) {
  profileQuickResultBtn.addEventListener("click", () => {
    if (!currentProfileStudentId || !currentProfileClassId) {
      notify("Load a student profile first.", "warning");
      return;
    }
    const tabBtn = document.querySelector('[data-tab="resultsTab"]');
    if (!tabBtn || tabBtn.offsetParent === null) {
      notify("Results is not available for your role.", "warning");
      return;
    }
    tabBtn.click();

    if (resultClassSelect) {
      resultClassSelect.value = String(currentProfileClassId);
      // populate student list for this class and trigger table refresh
      populateStudentsForClass(resultStudentSelect, currentProfileClassId);
      resultClassSelect.dispatchEvent(new Event("change"));
    }
    if (resultStudentSelect)
      resultStudentSelect.value = String(currentProfileStudentId);
    resultTermInput?.focus?.();
  });
}

if (profilePhotoInput) {
  profilePhotoInput.addEventListener("change", async () => {
    const file = profilePhotoInput.files?.[0];
    if (!file) return;
    if (!currentProfileStudentId) {
      notify("Load a student profile first.", "warning");
      profilePhotoInput.value = "";
      return;
    }

    try {
      const dataUrl = await imageFileToDataUrl(file);
      if (String(dataUrl).length > 350000) {
        notify("Image is too large. Use a smaller photo.", "warning");
        profilePhotoInput.value = "";
        return;
      }

      await authFetch(`${API}/students/${currentProfileStudentId}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ photo_data_url: dataUrl }),
      }).then(safeJson);

      // Update cache and UI
      const idx = (studentsCache || []).findIndex(
        (s) => String(s.id) === String(currentProfileStudentId)
      );
      if (idx >= 0) studentsCache[idx].photo_data_url = dataUrl;
      setProfileAvatar({ ...studentsCache[idx] });
      notify("Photo updated", "success");
    } catch (err) {
      notify(`Photo update failed: ${err.message}`, "error");
    } finally {
      profilePhotoInput.value = "";
    }
  });
}

async function loadPayments() {
  setTableStatus(paymentTableBody, 5, "Loading payment summary...");
  const res = await authFetch(`${API}/payments/summary`);
  const payments = await safeJson(res).catch((err) => {
    notify(`Failed to load payments: ${err.message}`, "error");
    setTableStatus(paymentTableBody, 5, "Failed to load payment summary.");
    return [];
  });
  if (!payments) return;
  if (!payments.length) {
    setTableStatus(
      paymentTableBody,
      5,
      "No payment records yet. Record a payment to see summaries here."
    );
    return;
  }
  paymentTableBody.innerHTML = payments
    .map((p) => {
      const totalPaid = Number(p.total_paid || 0);
      const totalRemaining = Number(p.total_remaining || 0);
      let status = "unpaid";
      let statusLabel = "UNPAID";

      if (totalPaid > 0 && totalRemaining > 0) {
        status = "partial";
        statusLabel = "PARTIAL";
      }

      if (totalPaid > 0 && totalRemaining === 0) {
        status = "paid";
        statusLabel = "PAID";
      }

      return `
    <tr>
      <td>${p.admission_no}</td>
      <td>${p.full_name}</td>
      <td>${totalPaid}</td>
      <td>${totalRemaining}</td>
      <td><span class="badge badge--${status}">${statusLabel}</span></td>
    </tr>`;
    })
    .join("");
  applyMobileTableLabels(paymentTableBody);
}

if (studentForm) {
  studentForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(studentForm).entries());

    await runWithFormBusy(studentForm, "Saving...", async () => {
      try {
        await authFetch(`${API}/students`, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify(formData),
        }).then(safeJson);
      } catch (err) {
        notify(`Could not add student: ${err.message}`, "error");
        return;
      }
      studentForm.reset();
      notify("Student added", "success");
      await loadAllData();
    });
  });
}

if (paymentForm) {
  paymentForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(paymentForm).entries());
    if (data.payment_type !== "half") {
      data.payment_type = "full";
      data.amount_remaining = 0;
    }

    await runWithFormBusy(paymentForm, "Saving...", async () => {
      try {
        await authFetch(`${API}/payments`, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify(data),
        }).then(safeJson);
      } catch (err) {
        notify(`Could not save payment: ${err.message}`, "error");
        return;
      }
      paymentForm.reset();
      syncHalfFields();
      notify("Payment saved", "success");
      await loadPayments();
    });
  });
}

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
      notify("Please select class, student, term, and session.", "warning");
      return;
    }

    if (!Number.isFinite(testScore) || !Number.isFinite(examScore)) {
      notify("Please enter valid numeric scores.", "warning");
      return;
    }

    await runWithFormBusy(resultForm, "Saving...", async () => {
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
        notify(`Could not save result: ${err.message}`, "error");
        return;
      }

      resultTestInput.value = "";
      resultExamInput.value = "";
      notify("Result saved", "success");
      await loadClassResults();
    });
  });
}

if (classForm) {
  classForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(classForm).entries());

    await runWithFormBusy(classForm, "Saving...", async () => {
      try {
        await authFetch(`${API}/classes`, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify(data),
        }).then(safeJson);
      } catch (err) {
        notify(`Could not add class: ${err.message}`, "error");
        return;
      }
      classForm.reset();
      notify("Class added", "success");
      const activeTab = getActiveTabId();
      await loadClasses();
      await loadUsers();
      restoreActiveTab(activeTab);
    });
  });
}

if (studentSearch) {
  studentSearch.addEventListener("input", (e) => {
    const filter = e.target.value.toLowerCase();
    document.querySelectorAll("#studentsTable tbody tr").forEach((row) => {
      row.style.display = row.innerText.toLowerCase().includes(filter)
        ? ""
        : "none";
    });
  });
}

if (paymentSearch) {
  paymentSearch.addEventListener("input", (e) => {
    const filter = e.target.value.toLowerCase();
    document.querySelectorAll("#paymentTable tbody tr").forEach((row) => {
      row.style.display = row.innerText.toLowerCase().includes(filter)
        ? ""
        : "none";
    });
  });
}

studentsTableBody.addEventListener("click", async (e) => {
  const id = e.target.dataset.id;

  if (e.target.classList.contains("view-student")) {
    const student = (studentsCache || []).find(
      (s) => String(s.id) === String(id)
    );
    if (student && profileClassSelect) {
      profileClassSelect.value = String(student.class_id || "");
      populateStudentsForClass(profileStudentSelect, student.class_id);
    }
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
      notify(`Update failed: ${err.message}`, "error");
      return;
    }

    notify("Student updated", "success");
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
      notify(`Delete failed: ${err.message}`, "error");
      return;
    }
    notify("Student deleted", "success");
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
      notify("Only admin can create staff.", "warning");
      return;
    }
    const data = Object.fromEntries(new FormData(staffForm).entries());
    await runWithFormBusy(staffForm, "Creating...", async () => {
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
        notify(`Could not create staff: ${err.message}`, "error");
        return;
      }
      staffForm.reset();
      notify("Staff created", "success");
      await loadUsers();
    });
  });
}

async function seedDefaults() {
  try {
    await authFetch(`${API}/classes/seed-default`, { method: "POST" }).then(
      safeJson
    );
    const activeTab = getActiveTabId();
    await loadClasses();
    await loadUsers();
    restoreActiveTab(activeTab);
    notify("Default classes ensured (JSS1-SS3 A/B)", "success");
  } catch (err) {
    notify(`Seeding failed: ${err.message}`, "error");
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
  const activeTab = getActiveTabId();
  await loadMe();
  await loadClasses();
  enforceTeacherClassLock();
  await loadStudentSelect();
  await loadPayments();
  await loadClassResults();
  await loadUsers();
  applyRoleUI();
  initReportCardUI();
  initAdminReportReviewUI();
  if (role === "admin") {
    await loadAdminReportCards();
  }
  restoreActiveTab(activeTab);
}

loadAllData();
