# 📌 frontend-ui-annotator v3.2.0（便條紙、草稿恢復與 AI 回饋包）


## Chrome 跨分頁使用（v3.2.0 推薦方式）

1. 在 Chrome 網址列輸入 `chrome://extensions`，開啟「開發人員模式」。
2. 點「載入未封裝項目」，選擇本套件的 `extension` 資料夾。
3. 切到要標註的網站，點拼圖圖示 → **Frontend UI Annotator 便條紙**；可釘選到工具列。

**每個分頁需各自點擊啟動，無需返回安裝頁。** 安裝頁示範已改成手動啟動，避免與實際安裝混淆。成功時在目標頁顯示工具列，失敗則開啟錯誤說明頁。Chrome 內建頁面不支援；本機 HTML 需於擴充功能詳細資料開啟檔案網址存取。

權限僅為 `activeTab`、`scripting`，腳本隨套件附帶，沒有遠端程式下載。更新來源腳本後執行 `node scripts/build.mjs`，再到擴充功能管理頁按重新載入。


專為 **Google Antigravity IDE** 與 **外部真實瀏覽器（Chrome / Edge）** 設計的全能前端視覺回饋與借鏡迭代系統。

不論是**修改自己開發的網頁**，還是**在別人的網站上隨手貼便條紙借鏡靈感**，本工具提供**零外部依賴、純原生 JS** 的覆蓋層：
- 📌 **全域任意位置貼便條紙**：點擊按鈕、卡片或兩大區塊間的空白縫隙隨處貼紙，自由敘述任何想法（修改、插入新元件、質感借鏡、刪除略過）。
- 🌐 **目前頁面風格摘要**：掃描已載入的 DOM，統計顏色、字體、圓角與區塊；結果仍需確認，不代表完整設計系統。
- 🧠 **環境資訊**：file: 網頁提供檔案路徑，localhost 提供路由；外站帶入網址與標題，供 AI 配合專案原始碼確認修改位置。

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
5. **退出與相容性**：
   * 零外部 npm/CDN 依賴，執行仍受目標網站 CSP 與 Trusted Types 限制，一鍵點擊 `✕` 徹底清除覆蓋層還原原始網頁。

---

## 🚀 Antigravity 一鍵安裝方式

使用者**完全不需要事先手動下載或解壓縮整個 GitHub 專案**！請根據您的情境選擇最方便的安裝方式：

### 🌐 方式一：免下載！Windows (PowerShell) 雲端一行直裝（推薦）
開啟 PowerShell，複製貼上以下單行指令並按 Enter，即可直接從 GitHub 雲端安裝本技能及其標註器腳本資源至 Antigravity 全域目錄：

```powershell
$u="https://github.com/Lin-Yu-kuan/mySkill/archive/refs/heads/main.zip"; $d="$HOME\.gemini\config\skills\frontend-ui-annotator"; $t=Join-Path $env:TEMP ("myskill-"+[guid]::NewGuid()); Invoke-WebRequest $u -OutFile "$t.zip" -ErrorAction Stop; Expand-Archive "$t.zip" $t -Force -ErrorAction Stop; New-Item -ItemType Directory -Path $d -Force | Out-Null; Copy-Item "$t\mySkill-main\frontend-ui-annotator\*" $d -Recurse -Force -ErrorAction Stop; Remove-Item "$t.zip",$t -Recurse -Force -ErrorAction SilentlyContinue; Write-Host "✅ frontend-ui-annotator 技能套件已成功安裝至 Antigravity！" -ForegroundColor Green
```

---

### 🍎 方式二：免下載！macOS / Linux 雲端一行直裝
開啟終端機（Terminal），貼上以下指令直接提取安裝：

```bash
mkdir -p "$HOME/.gemini/config/skills" && curl -fsSL "https://github.com/Lin-Yu-kuan/mySkill/archive/refs/heads/main.tar.gz" | tar -xz -C "$HOME/.gemini/config/skills" --strip-components=1 "mySkill-main/frontend-ui-annotator/" && echo "✅ frontend-ui-annotator 技能套件已成功安裝！"
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

## 🔄 智慧無感自動更新（已安裝者）

本技能遵循 `mySkill` 規範，已在 `SKILL.md` 開頭標記 GitHub 來源。安裝完成後，未來若想升級至最新版本，**不需要再次手動執行安裝指令**！

只要在 Antigravity 對話框中說：
> 「幫我更新前端標註器技能」或「更新 frontend-ui-annotator 最新版本」

Antigravity 會自動讀取本機設定並連線至 GitHub 覆蓋更新為最新版本！若附屬標註腳本或樣式需要同步更新，亦可指示「請完整更新 frontend-ui-annotator 套件」。

---

## 🎯 使用指南

### 1. 修改自己的網頁（IDE 預覽視窗或 localhost）
- 在 Antigravity 生成原型或開啟本機開發伺服器（如 `http://localhost:3000` 或本地 HTML）。
- 點擊右下角懸浮列 **「📌 貼便條紙模式」**。
- 點擊想修改的按鈕、文字或空白處貼上便條紙：「按鈕改成深藍色漸層」、「卡片間距縮小」。
- 點擊 **「📋 複製便條紙」**，file: 網頁附帶本機路徑，localhost 附帶路由與中立語意，無論您是在 `/plan` 規劃階段還是直接修改，AI 依當前對話指令處理。

### 2. 借鏡別人的網站介面（外站靈感參考）
- 打開 `resources/bookmarklet-installer.html`，將黃色按鈕拖曳到瀏覽器書籤列。
- 造訪任何線上優秀網站（如 Linear.app、Stripe），點一下書籤列喚醒工具列。
- 在感興趣的區塊隨手貼紙：「這裡我想插入一排 5 位用戶的評價頭像」、「參考這個導覽列的毛玻璃效果」。
- 點擊 **「🌐 萃取整頁風格」** 可取得目前頁面的部分色彩與版面摘要。
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
    ├── bookmarklet.txt               # 由核心腳本產生的 URL 編碼 Bookmarklet
    └── bookmarklet-installer.html    # 瀏覽器書籤列一鍵拖曳安裝中心
```


## v3.1.0：可靠標註與 AI 回饋包

- 修正刪除後 ID 重複、退出後殘留事件、HTML 文字插入及編輯目標未保存。
- 自動保存／恢復本頁草稿，依完整網址分隔；支援清除與 JSON 匯入匯出。
- 圖釘跟隨元素移動，重新渲染後以定位資訊與文字指紋嘗試還原；灰色圖釘表示目標失效。
- Markdown 回饋包含穩定 ID、路由、畫面尺寸、定位資訊與樣式。JSON 額外包含結構化資料與手動附加的截圖。
- 「附截圖」接受 5 MB 以下 PNG/JPEG/WebP。截圖僅在本次工作階段保留，請用「匯出 JSON」備份；不會自動擷取螢幕或上傳。
- JSON 匯入限同一完整網址、10 MB、500 張便條紙；有現有資料時會確認取代。
- 草稿保存在來源網站 localStorage，網站腳本可能讀取。重要標註請另行匯出。
- 風格萃取仍是單頁啟發式摘要，沒有跨頁掃描、陰影萃取或完整 Tokens 還原能力。缺資料時的預設值不是實測值。
- 不保證 iframe、Shadow DOM、Canvas、頁面 CSS transform 或嚴格 CSP 網站可用。

### 開發驗證

核心來源為 `resources/annotator-overlay.js`；不要直接維護另外兩份生成檔：

```sh
node --check resources/annotator-overlay.js
node scripts/build.mjs
node scripts/build.mjs --check
node tests/browser.cjs
node tests/launch.cjs
```

瀏覽器測試需可由 Node 解析的 `playwright`（可用 `NODE_PATH` 指向已安裝的模組目錄）。預設使用 Playwright 的 Chromium；也可設定 `CHROME_PATH` 指向本機 Chrome。測試使用隔離瀏覽器與攔截的本機測試頁，不存取真實網站。測試下載需執行環境允許瀏覽器下載，桌機／手機截圖寫入忽略版本控制的 `test-results/`。

安裝新版後，請重新從安裝頁拖曳書籤；既有書籤包含舊版程式，不會自動變更。


### v3.1.1：修正點擊書籤沒有工具列

- 移除工具列、輸入卡片與預覽卡的 `innerHTML`，使用 DOM API 相容嚴格 Trusted Types 頁面。
- 初始化完成後才設定載入旗標；失敗會清除 UI／事件／計時器並顯示錯誤，允許重試。
- 新增啟動測試：編碼後 javascript: 連結、嚴格 Trusted Types、舊旗標恢復及模擬初始化失敗。
- 使用新版：重新整理目標頁面，重新開啟安裝頁，將標有 v3.1.1 的黃色連結拖到書籤列。舊書籤包含舊代碼，不會隨檔案更新。
- 若瀏覽器在執行前封鎖 javascript: 書籤（例如受限制頁面），工具本身無法顯示錯誤；程式可捕捉的是啟動後的初始化錯誤。


### 擴充功能跨分頁測試

`node tests/extension.cjs` 使用 Playwright Chromium 的全新設定檔，透過實際擴充功能 action 在兩個獨立頁面啟動。測試頁包含禁止頁面腳本的 CSP 與嚴格 Trusted Types；確認另一分頁不被誤注入、便條紙不混用、關閉／重開與重新整理後恢復正常。

需先安裝 Playwright Chromium（`playwright install chromium --no-shell`）。可用 `PLAYWRIGHT_BROWSERS_PATH` 指向測試瀏覽器；一般桌面 Chrome 不支援相同的命令列擴充功能測試載入方式。`extension/annotator-overlay.js` 由建置產生，不直接手改。
