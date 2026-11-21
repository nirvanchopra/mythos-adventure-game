@echo off
title Mythos Adventure Game Launcher
echo ========================================================
echo    Launching Mythos Adventure Game (Local Dev)
echo ========================================================
echo.

:: Launch Backend in a new window
echo Starting FastAPI Backend on http://localhost:8000 ...
start "Mythos Backend (FastAPI)" cmd /k "cd /d %~dp0 && set PYTHONPATH=. && .\backend\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8000"

:: Wait 2 seconds for backend initialization
timeout /t 2 /nobreak >nul

:: Launch Frontend in a new window
echo Starting Vite Frontend on http://localhost:5173 ...
start "Mythos Frontend (React/Vite)" cmd /k "cd /d %~dp0\frontend && npm run dev"

echo.
echo ========================================================
echo    Both servers have been started!
echo    Backend:  http://localhost:8000 (Swagger: /docs)
echo    Frontend: http://localhost:5173
echo ========================================================
echo.
pause
