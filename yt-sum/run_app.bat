@echo off
chcp 65001 >nul
cd /d "%~dp0backend"

echo === YT-Sum Knowledge Navigator ===

if not exist ".venv\Scripts\python.exe" (
    echo [1/3] First run: setting up Python environment...
    python -m venv .venv
    if errorlevel 1 (
        echo [Error] Python not found. Please install Python 3.10+ first.
        pause
        exit /b 1
    )
    .venv\Scripts\python.exe -m pip install -r requirements.txt
) else (
    echo [1/3] Python environment ready.
)

if not exist ".env" (
    copy ".env.example" ".env" >nul
)

echo [2/3] Starting server on http://localhost:8000 ...
start /b "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:8000"

echo [3/3] Server running. Keep this window open while using the app.
.venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000
pause
