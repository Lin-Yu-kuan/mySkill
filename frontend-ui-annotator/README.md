# 📌 frontend-ui-annotator (前端介面生成、自由便條紙標註與全站風格萃取專家)

專為 **Google Antigravity IDE** 與 **外部真實瀏覽器（Chrome / Edge）** 設計的全能前端視覺回饋與借鏡迭代系統。

不論是**修改自己開發的網頁**，還是**在別人的網站上隨手貼便條紙借鏡靈感**，本工具提供**零外部依賴、純原生 JS** 的覆蓋層：
- 📌 **全域任意位置貼便條紙**：點擊按鈕、卡片或兩大區塊間的空白縫隙隨處貼紙，自由敘述任何想法（修改、插入新元件、質感借鏡、刪除略過）。
- 🌐 **一鍵萃取全頁設計風格**：1 秒掃描整頁 DOM，自動統計萃取全站調色盤（底色、主色、Accent）、字體階層、圓角陰影規格與頁面佈局骨架。
- 🧠 **智慧環境雙軌切換**：修改本機專案（IDE 預覽 / localhost）自動直指目標檔案與路由，免冗長網址；參考外站時自動帶入網站標題與品牌語境，AI 意圖 100% 精準落地！

---

## ✨ 核心亮點

1. **隨處貼便條紙（零選項束縛）**：
   * 擺脫死板表單，就像在真實網頁上貼 Post-it 便條紙一樣自由！點擊任意處立即留下想法，畫面上常駐帶陰影的精美圖釘 `📌 #1`，懸停即可展開卡片、隨時編輯或刪除。
2. **DOM 階層麵包屑選取 (Hierarchy Breadcrumb)**：
   * 點選按鈕中的文字或圖示時，彈窗上方自動列出父級容器（例如 `div.card` ➔ `button.btn` ➔ `span`），可一鍵切換目標層級。
3. **全頁風格與 Design Tokens 萃取**：
   * 看到 Linear、Stripe、Apple 等頂級介面，點擊「🌐 萃取整頁風格」，腳本自動計算生成標準 Markdown Design Tokens，交給 AI 直接為您復刻高質感全新頁面。
4. **智慧環境雙軌格式化**：
   * **自己開發時**：輸出直指目標檔案（如 `dashboard.html`）或本地路由，AI 直接更新專案代碼。
   - **參考外站時**：輸出自動帶入來源網址與標題，AI 自動轉化為新組件設計與臨摹創作。
5. **完全退出與 CSP 安全相容**：
   * 零外部 npm/CDN 依賴，符合嚴格安全策略，一鍵點擊 `✕` 徹底清除覆蓋層還原原始網頁。

---

## 🚀 Antigravity 一鍵安裝方式

使用者**完全不需要事先手動下載或解壓縮整個 GitHub 專案**！請根據您的情境選擇最方便的安裝方式：

### 🌐 方式一：免下載！Windows (PowerShell) 雲端一行直裝（推薦）
開啟 PowerShell，複製貼上以下單行指令並按 Enter，即可直接從 GitHub 雲端安裝本技能及其標註器腳本資源至 Antigravity 全域目錄：

```powershell
$u="https://github.com/Lin-Yu-kuan/mySkill/archive/refs/heads/main.zip"; $t="$env:TEMP\myskill.zip"; $d="$HOME\.gemini\config\skills\frontend-ui-annotator"; if (!(Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force }; Invoke-WebRequest $u -OutFile $t; Expand-Archive $t "$env:TEMP\myskill-temp" -Force; Copy-Item "$env:TEMP\myskill-temp\mySkill-main\frontend-ui-annotator\*" $d -Recurse -Force; Remove-Item $t,"$env:TEMP\myskill-temp" -Recurse -Force; Write-Host "✅ frontend-ui-annotator 技能套件已成功安裝至 Antigravity！" -ForegroundColor Green
```

---

### 🍎 方式二：免下載！macOS / Linux 雲端一行直裝
開啟終端機（Terminal），貼上以下指令直接提取安裝：

```bash
mkdir -p "$HOME/.gemini/config/skills/frontend-ui-annotator" && curl -sSL "https://github.com/Lin-Yu-kuan/mySkill/archive/refs/heads/main.tar.gz" | tar -xz -C "$HOME/.gemini/config/skills/frontend-ui-annotator" --strip-components=2 "mySkill-main/frontend-ui-annotator/" && echo "✅ frontend-ui-annotator 技能套件已成功安裝！"
```

---

### 💬 方式三：免開終端機！Antigravity 聊天框「自然語言安裝」
在 Antigravity 聊天對話框中，直接將以下提示詞複製貼上交給 Agent：

> 「請幫我從 GitHub 倉庫 (`https://github.com/Lin-Yu-kuan/mySkill`) 將 `frontend-ui-annotator` 技能資料夾（含 SKILL.md 及 resources 目錄）下載並安裝到我的 Antigravity 全域技能目錄 (`~/.gemini/config/skills/frontend-ui-annotator`)。」

---

### 💻 方式四：本機開發者軟連結（Symlink，修改即時生效）
如果您已將 `mySkill` 倉庫 Clone 至本機並進行開發維護，推薦建立符號連結。日後在原目錄修改標註器腳本或提示詞，Antigravity 會**即刻同步生效**：

```powershell
# 請在 mySkill/frontend-ui-annotator 目錄下執行（需管理員權限或開啟 Windows 開發人員模式）
New-Item -ItemType SymbolicLink -Path "$HOME\.gemini\config\skills\frontend-ui-annotator" -Target (Get-Location).Path -Force
```

---

### 📁 方式五：已 Clone 完整倉庫者的本地安裝
如果您已經將整個 `mySkill` 倉庫 Clone 到本機，亦可直接以本地檔案複製安裝：

- **Windows (PowerShell)**：
  ```powershell
  Copy-Item -Path ".\frontend-ui-annotator" -Destination "$HOME\.gemini\config\skills\frontend-ui-annotator" -Recurse -Force
  ```
- **macOS / Linux**：
  ```bash
  cp -r ./frontend-ui-annotator "$HOME/.gemini/config/skills/frontend-ui-annotator"
  ```

---

## 🎯 使用指南

### 1. 修改自己的網頁（IDE 預覽視窗或 localhost）
- 在 Antigravity 生成原型或開啟本機開發伺服器（如 `http://localhost:3000` 或本地 HTML）。
- 點擊右下角懸浮列 **「📌 貼便條紙模式」**。
- 點擊想修改的按鈕、文字或空白處貼上便條紙：「按鈕改成深藍色漸層」、「卡片間距縮小」。
- 點擊 **「📋 複製便條紙」**，自動附帶本機絕對路徑與中立語意，無論您是在 `/plan` 規劃階段還是直接修改，AI 都能完美契合！

### 2. 借鏡別人的網站介面（外站靈感參考）
- 打開 `resources/bookmarklet-installer.html`，將黃色按鈕拖曳到瀏覽器書籤列。
- 造訪任何線上優秀網站（如 Linear.app、Stripe），點一下書籤列喚醒工具列。
- 在感興趣的區塊隨手貼紙：「這裡我想插入一排 5 位用戶的評價頭像」、「參考這個導覽列的毛玻璃效果」。
- 點擊 **「🌐 萃取整頁風格」** 可一秒抓取對方的全套色彩與版面規範。
- 複製需求貼回 Antigravity，AI 便會融合該設計為您的專案打造全新頁面！

---

## 📂 目錄結構

```text
frontend-ui-annotator/
├── SKILL.md                          # 技能核心規範與 AI 應答邏輯
├── README.md                         # 繁體中文說明文件與安裝指南
├── plugin.json                       # 插件清單定義檔
└── resources/
    ├── annotator-overlay.js          # 全能自由便條紙與風格萃取核心腳本
    ├── bookmarklet.txt               # 壓縮版 Bookmarklet 一行代碼
    └── bookmarklet-installer.html    # 瀏覽器書籤列一鍵拖曳安裝中心
```
