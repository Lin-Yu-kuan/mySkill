# YT-Sum 知識導航儀

一套跑在本地端的 **YouTube 知識導航 Web App**（Next.js + FastAPI + Google Gemini API）。
不同於傳統只做「時間軸＋章節摘要」的工具，本專案專注於拆解理解影片所需的知識結構：

1. **第一層：前置必備觀念（掃雷區）**：點出沒先搞懂就容易卡住的觀念、原因與 1 分鐘白話科普，支援「我已掌握」過濾。
2. **第二層：影片核心觀念（知識骨幹）**：拆解重點與影片實例，點擊 `[mm:ss]` 時間戳記即可控制左側內嵌播放器跳轉。
3. **第三層：延伸與深入研究（探索樹）**：提供縱向深究與橫向延伸方向，支援**APP 內建追問**與**一鍵複製 Prompt 帶去 Gemini 網頁版**。
4. **附加實用工具**：支援 `yt-dlp + ffmpeg` 下載 MP4 / MP3（無字幕影片亦會自動透過音訊交由 Gemini 分析）、以及一鍵匯出 `.md` 筆記。

---

## 專案結構

```text
yt-sum/
├── backend/                  # Python FastAPI 後端 (localhost:8000)
│   ├── main.py               # API 入口 (/api/analyze, /api/chat, /api/download, /api/health)
│   ├── schemas.py            # Gemini Structured Output Pydantic 模型
│   └── services/
│       ├── youtube_service.py # 字幕抓取、yt-dlp + ffmpeg 下載與音訊擷取
│       └── gemini_service.py  # Google Gemini API 串接
├── frontend/                 # Next.js (App Router + Tailwind) 前端 (localhost:3000)
└── start.ps1                 # Windows 一鍵啟動腳本
```

---

## 快速啟動

1. **設定 Gemini API Key**：
   複製 `backend/.env.example` 為 `backend/.env`，填入你的 `GEMINI_API_KEY`（也可以啟動後直接在網頁右上角 **Key** 按鈕輸入）。
2. **一鍵啟動前後端**：
   ```powershell
   .\start.ps1
   ```
3. 開啟瀏覽器前往 `http://localhost:3000`。
