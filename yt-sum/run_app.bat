@echo off
chcp 65001 >nul
cd /d "%~dp0backend"

echo === YT-Sum 知識導航儀（家人免開發一鍵版）===

if not exist ".venv\Scripts\python.exe" (
    echo [1/3] 首次啟動，正在建立 Python 環境與安裝套件...
    python -m venv .venv
    if errorlevel 1 (
        echo [錯誤] 找不到 Python，請先安裝 Python 3.10 以上版本：https://www.python.org/downloads/
        pause
        exit /b 1
    )
    .venv\Scripts\python.exe -m pip install -r requirements.txt
) else (
    echo [1/3] Python 環境已就緒。
)

if not exist ".env" (
    copy ".env.example" ".env" >nul
)

echo [2/3] 正在開啟瀏覽器 http://localhost:8000 ...
start "" http://localhost:8000

echo [3/3] 啟動服務中（使用期間請勿關閉此視窗）...
.venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000
pause
