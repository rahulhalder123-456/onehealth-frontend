# OneHealth Doctor Portal

React doctor portal connected to a FastAPI and PostgreSQL backend.

## Project structure

- `frontend` - React and Vite doctor portal
- `onehealth-backend` - FastAPI and PostgreSQL API

## Start the backend

From `onehealth-backend`, use the virtual environment's Python directly:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8001
```

This command works even when the virtual environment is not activated.

Alternatively, activate it first:

```powershell
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --port 8001
```

Backend URLs:

- API documentation: `http://localhost:8001/docs`
- Health check: `http://localhost:8001/health`

## Start the frontend

From `frontend` in a second terminal:

```powershell
cd frontend
npm run dev
```

Open `http://localhost:5173`.

Development login uses a registered doctor email. Request an OTP from the login
screen, then use the latest code delivered by email or printed in the backend
console when SMTP is not configured.

## Integration

The frontend now uses the backend for OTP authentication, JWT sessions, doctor
profile, photo uploads, appointments, availability schedules, conversation history,
REST chat fallback, and WebSocket chat.

The default API URL is `http://localhost:8001`. Override it with `VITE_API_URL`.
