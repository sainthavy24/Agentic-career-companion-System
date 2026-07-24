@echo off
echo ===================================================
echo   Starting PathCompanion AI Application
echo ===================================================
echo.

echo [1/2] Starting FastAPI Backend in a new window...
start "PathCompanion AI Backend" cmd /k "cd backend && .venv\Scripts\activate && python -m pip install -r requirements.txt && python -m uvicorn main:app --reload --port 8080"

echo [2/2] Starting React + Vite Frontend in a new window...
start "PathCompanion AI Frontend" cmd /k "cd frontend && npm install && npm run dev"

echo.
echo All services have been launched in separate windows!
echo - Backend: http://127.0.0.1:8080 (API & Docs)
echo - Frontend: http://localhost:5173 (React UI)
echo.
pause
