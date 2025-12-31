# Copilot instructions (school-dashboard)

## Big picture

- **Two-process app**: `backend/` is a Node/Express + SQLite JSON API on `http://localhost:3000/`; `frontend/` is a static site served separately.
- **Frontend boot**: `frontend/js/bootstrap.js` fetches HTML partials (`frontend/partials/*.html`) into `<section data-include=...>` and then injects `frontend/js/main.js`.
- **Auth + roles**: users authenticate via JWT and are role-scoped (`admin`, `teacher`, `account`). Frontend stores `token`, `role`, `assigned_class_id` in `localStorage`.

## Run / debug workflows

- Backend:
  - `cd backend && npm install`
  - `npm run dev` (nodemon) or `npm start` (node)
  - Entry points: `backend/server.js` → `backend/src/app.js`
- Frontend (must be served over HTTP; `file://` breaks `fetch()` includes):
  - `cd frontend && python3 -m http.server 8080`
  - Open `http://localhost:8080/`

## Backend architecture & conventions

- **Routing**: all API routes are mounted under `/api` in `backend/src/app.js`.
  - Auth routes are under `/api/auth/*` (see `backend/src/routes/authRoutes.js`).
- **Auth header**: backend expects `Authorization: Bearer <token>` (see `backend/src/middlewares/authMiddleware.js`).
- **Role gating**: protect routes with `auth(["admin", ...])` in `backend/src/routes/*.js`.
  - Teachers are additionally scoped by `assigned_class_id` (see patterns in `studentController`, `paymentController`, `resultController`, `reportCardController`).
- **Controllers vs models**:
  - Controllers (`backend/src/controllers/*`) do validation + role/scoping and call models.
  - Models (`backend/src/models/*`) are sqlite3 callback-based and often include **runtime schema ensure/migrations**.

## Database (SQLite)

- DB file is committed at `backend/database/school.db`.
- Schema ownership:
  - `students` table is ensured in `backend/src/models/db.js` (also adds `photo_data_url` if missing).
  - `users`, `payments`, `results`, `report_cards` ensure/migrate their own tables in their model files.
  - `classes` is referenced widely but is **not auto-created in code**; it exists in the bundled DB (table: `classes(id, name, arm)`).
- When adding/changing tables: follow the existing migration pattern:
  - `PRAGMA table_info(<table>)` → add missing columns via `ALTER TABLE ...`.
  - Prefer `UNIQUE(...)` + `ON CONFLICT ... DO UPDATE` upserts where the code already uses them (e.g., payments/results).

## Critical domain flows (don’t break)

- **Initial admin bootstrap**: `POST /api/auth/bootstrap` creates the first admin only when `users` is empty (see `userController.bootstrapAdmin`).
- **Login role check**: `POST /api/auth/login` optionally takes `role` and rejects mismatches (see `authController.login`).
- **Results lifecycle** (`backend/src/models/resultModel.js` + `resultController`):
  - Teacher/admin can upsert results while status is `draft`.
  - Teacher submits a whole class via `POST /api/results/class/:class_id/submit` (requires all students have results).
  - Admin approves a whole class via `POST /api/results/class/:class_id/approve`.
- **Report cards**:
  - Teachers can save a draft payload (`POST /api/report-cards/draft`).
  - Teachers can generate an immutable record from **approved** results (`POST /api/report-cards/generate`), implemented in `backend/src/services/reportCardGenerationService.js`.
  - Admin reviews/approves via `POST /api/report-cards/:id/approve`.

## Frontend conventions

- Base API URL is hard-coded in `frontend/js/main.js` as `http://localhost:3000/api`.
- All authenticated requests go through `authFetch()` (adds `Authorization` + JSON headers).
- Role-aware UI is centralized in `applyRoleUI()`; if you add/remove tabs or actions, update this logic.

## When making changes

- Prefer minimal, consistent patterns:
  - New API endpoint: add route in `backend/src/routes/*Routes.js`, implement controller in `backend/src/controllers/*Controller.js`, and reuse model callback style.
  - If a change affects role behavior, update both backend scoping checks and the frontend UI hiding rules.
