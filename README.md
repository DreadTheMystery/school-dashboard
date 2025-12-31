# School Dashboard

Backend: Node.js + Express + SQLite. Frontend scaffold ready.

## Frontend setup

The frontend loads tab content from `frontend/partials/*.html` via `fetch()`, so you must serve it over HTTP (opening `index.html` via `file://` will not work).

```bash
cd frontend
python3 -m http.server 8080
```

Then open http://localhost:8080/

## Backend setup

```bash
cd backend
npm init -y
npm install express sqlite3 cors bcrypt jsonwebtoken multer
node server.js
```

Visit http://localhost:3000/ to verify.
