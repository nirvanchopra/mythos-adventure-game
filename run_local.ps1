# Mythos Adventure Game Launcher for PowerShell
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   Launching Mythos Adventure Game Platform (Local Dev) " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Start Backend in new window
Write-Host "`nStarting FastAPI Backend on http://localhost:8000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir'; `$env:PYTHONPATH='.'; .\backend\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8000"

Start-Sleep -Seconds 2

# 2. Start Frontend in new window
Write-Host "Starting Vite Frontend on http://localhost:5173 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir\frontend'; npm run dev"

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "   Both servers launched successfully!" -ForegroundColor Green
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "   Docs:     http://localhost:8000/docs" -ForegroundColor White
Write-Host "========================================================`n" -ForegroundColor Green
