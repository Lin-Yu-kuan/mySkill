# 🎯 frontend-ui-annotator (前端介面生成與視覺標註專家)

專為 **Google Antigravity IDE** 與 **外部真實瀏覽器（Chrome / Edge）** 設計的前端視覺標註與迭代工具。

當您需要請 AI 生成網頁介面、或審視已有的前端頁面時，此工具能在網頁上提供**零外部依賴、純原生 JS 的視覺標註覆蓋層**。您只需用滑鼠點擊想修改的元件、留下意見，點擊一鍵複製，就能將結構化 Markdown 需求回傳給 AI 進行秒級精準更新。

---

## ✨ 核心特色

1. **雙模式無縫切換**：
   * **Antigravity IDE 內建預覽**：AI 生成的 HTML Artifact 自動掛載標註器，在 IDE 右側視窗直接點擊標註。
   * **真實外部瀏覽器 (Bookmarklet)**：提供一鍵拖曳到書籤列的小工具，跨任何本地網站（`localhost:3000`、`file:///`）或線上網站，點一下書籤立即標註。
2. **DOM 階層麵包屑選取器 (Hierarchy Breadcrumb)**：
   * 點選按鈕中的文字或圖示時，彈窗上方會自動列出 4 層父級容器（例如 `div.card` ➔ `button.btn` ➔ `span`），可直接點擊切換選取外層容器，徹底解決「想選卡片卻選到文字」的困擾。
3. **視窗滾動精準錨定**：
   * 標註圖釘直接錨定在頁面文檔串流中，長頁面無論如何滾動、縮放，高亮框與圖釘絕不跑位。
4. **一鍵徹底關閉 (✕)**：
   * 工具列內建關閉按鈕，標註完畢後一鍵卸載所有 DOM 覆蓋層，完全還原網頁原始互動。
5. **相容性與安全性**：
   * 零外部 npm/CDN 依賴，符合嚴格的 CSP 安全策略，支援一般 HTML 與 SVG 圖示元素。

---

## 🚀 使用指南

### 1. 在 Antigravity IDE 內建預覽中使用
直接在 Antigravity 對話框向 AI 提出介面需求：
> *「幫我設計一個現代科技風的會員中心首頁」*

* AI 會自動在右側產生帶有標註工具列的 HTML 原型。
* 點擊右下角 **「🎯 開啟標註模式」**。
* 點選元件留下修改意見（可透過麵包屑切換目標容器）。
* 點擊 **「📋 複製需求」**，貼回對話框發送，AI 即可直接更新程式碼。

### 2. 在外部真實瀏覽器（Chrome / Edge）中使用
打開專案內的安裝指引頁面：
* 瀏覽器開啟 `resources/bookmarklet-installer.html`。
* 將頁面中央的 **「🎯 Antigravity 網頁標註器」** 按鈕拖曳到瀏覽器的書籤列。
* 以後在外部瀏覽器打開任一本機網頁（如 `http://localhost:3000`）或線上網站時，**點一下書籤**，右下角即刻彈出標註工具列！

---

## 📂 目錄結構

```text
frontend-ui-annotator/
├── SKILL.md                          # 核心技能規範說明文件
├── README.md                         # 說明文件（當前檔案）
├── plugin.json                       # Antigravity 外掛資訊清單
└── resources/
    ├── annotator-overlay.js          # 純原生 JavaScript 標註器核心腳本 (v2.1)
    └── bookmarklet-installer.html    # 書籤小工具一鍵安裝與即時體驗頁面
```

---

## 📄 License
MIT License
