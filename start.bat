@echo off
echo =======================================================
echo          StudyGenius AI - Starting Servers
echo =======================================================

echo Starting FastAPI Backend (http://127.0.0.1:8000)...
start "StudyGenius Backend" cmd /k "cd backend && call venv\Scripts\activate.bat && uvicorn main:app --reload --port 8000"

echo Starting Next.js Frontend (http://localhost:3000)...
start "StudyGenius Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are launching!
echo Backend:  http://127.0.0.1:8000 (Docs at /docs)
echo Frontend: http://localhost:3000
echo.
