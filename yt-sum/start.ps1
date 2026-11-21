$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $RootDir "backend"
$FrontendDir = Join-Path $RootDir "frontend"

Write-Host "=== YT-Sum 知識導航儀啟動檢查 ===" -ForegroundColor Cyan

# 檢查 ffmpeg
if (Get-Command ffmpeg -ErrorAction SilentlyContinue) {
    Write-Host "[OK] 已偵測到 ffmpeg，完整支援 MP4/MP3 下載與無字幕音訊分析。" -ForegroundColor Green
} else {
    Write-Host "[提示] 尚未安裝 ffmpeg。核心分析功能可正常使用，若需 MP3/高畫質 MP4 下載請執行：winget install Gyan.FFmpeg" -ForegroundColor Yellow
}

# 檢查 backend .env
$EnvFile = Join-Path $BackendDir ".env"
if (-not (Test-Path $EnvFile)) {
    Copy-Item (Join-Path $BackendDir ".env.example") $EnvFile
    Write-Host "[提示] 已建立 backend\.env，請記得填入 GEMINI_API_KEY（或稍後於網頁右上角 Key 輸入）。" -ForegroundColor Yellow
}

# 啟動 FastAPI 後端
Write-Host "正在啟動 FastAPI 後端 (http://localhost:8000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$BackendDir'; .\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

# 啟動 Next.js 前端
Write-Host "正在啟動 Next.js 前端 (http://localhost:3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$FrontendDir'; npm run dev"

Write-Host "`n全部服務已啟動！請開啟瀏覽器前往：http://localhost:3000" -ForegroundColor Green
