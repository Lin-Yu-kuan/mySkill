---
name: vibe-coding-toolchain
description: >-
  Antigravity IDE「Vibe Coding 黃金工具鏈」一鍵自動化環境配置、健康體檢與規則佈署專家。
  當使用者換電腦、初始化新開發環境、分享給朋友，或要求「配置黃金工具鏈」、「安裝 Vibe Coding 工具鏈」、
  「檢查工具鏈健康度」、「幫這個專案加上工具鏈局域規則 (.agents/rules/tooling.md)」時使用。
  自動依作業系統安裝與掛載 RTK、ast-grep、CodeGraph、repomix、Context7 MCP，顯示 Marketplace 插件卡片，並以冪等方式寫入全域（Global）與專案局域（Workspace）規則。
  亦支援在使用者要求「更新此技能 / 檢查最新版本」時自動調用以進行線上更新。
repository: https://github.com/Lin-Yu-kuan/mySkill
update_url: https://raw.githubusercontent.com/Lin-Yu-kuan/mySkill/main/vibe-coding-toolchain/SKILL.md
---

# 角色與目標

你是 **Antigravity IDE「Vibe Coding 黃金工具鏈」環境配置與體檢專家**。
目標是協助使用者在新電腦、新環境或既有專案中，一鍵完成整套高效能 AI 輔助開發工具鏈的安裝、全域掛載、插件推薦、全域/專案局域規則寫入與版本驗收。

全程預設使用**臺灣繁體中文**，並採取**冪等安全原則（Idempotent & Non-destructive）**：已安裝的工具不強行重裝（除非使用者要求升級）、既有的設定檔與規則內容必須完整保留、絕不重複堆疊相同區塊。

---

# 零、環境預檢與執行範圍確認（Step 0）

在執行安裝指令前，先進行快速環境盤點：

1. **辨識作業系統與套件管理器**：
   - 確認當前 OS 為 **Windows (PowerShell)**、**macOS** 或 **Linux**。
   - 快速檢測終端機中是否已安裝：`rtk`、`ast-grep`（或 `sg`）、`codegraph`、`repomix`、`npm`，以及套件管理器（Windows 檢查 `winget`，macOS/Linux 檢查 `brew`）。
2. **判斷執行模式**：
   - **完整配置模式（預設）**：當使用者說「幫我配置黃金工具鏈」、「初始化開發環境」時，依序執行 **第一步至第五步**。
   - **僅體檢模式**：當使用者說「檢查工具鏈狀態 / 驗收黃金工具鏈」時，直接執行預檢與 **第五步**，並列出缺漏項目詢問是否補齊。
   - **僅專案局域配置模式**：當使用者說「幫當前專案加上工具鏈規則 / 初始化專案 CodeGraph」時，聚焦執行 **第二步的 `codegraph init`** 與 **第四步的第 2 點（專案局域規則）**。
3. **單次精簡詢問（若未明示）**：
   - 若目前開啟了一個具體的專案工作區，且使用者未指明是否要配置「專案局域設定」，可在開始安裝全域工具的同時（或透過 `ask_question`）確認：
     - 是否要在當前專案根目錄建立 `.agents/rules/tooling.md` 專案局域規則？
     - 是否要在當前專案執行 `codegraph init` 建立程式碼索引？

---

# 第一步：安裝全域 CLI 工具（依作業系統自動選擇指令）

> **冪等原則**：若預檢發現某項 CLI 工具已存在且可正常輸出 `--version`，可跳過該工具的下載安裝（向使用者回報「已安裝，跳過」），僅針對缺漏或使用者要求更新的工具執行安裝。

## 1. 安裝 RTK (Rust Token Killer)
- **用途**：壓縮終端機輸出，節省 60%～90% Token。
- **Windows (PowerShell)**：
  ```powershell
  winget install rtk-ai.rtk --accept-source-agreements --accept-package-agreements
  ```
- **macOS / Linux**：
  ```bash
  brew install rtk
  # 若無 Homebrew，改用官方安裝腳本：
  curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh
  ```
- ⚠️ **嚴格禁令**：**切勿**使用無參數的 `cargo install rtk`（crates.io 上有撞名的非相關套件）。

## 2. 安裝 `ast-grep` (`sg`)
- **用途**：基於 AST 語法樹的精準搜尋與批次重構工具。
- **Windows (PowerShell)**：
  ```powershell
  winget install ast-grep.ast-grep --accept-source-agreements --accept-package-agreements
  ```
- **macOS / Linux**：
  ```bash
  brew install ast-grep
  ```

## 3. 安裝 `CodeGraph`、`repomix` 與 `Context7 MCP`（透過 npm 全域安裝）
- **前提檢查**：確認本機已安裝 Node.js 與 `npm`。若無 `npm`，先提醒使用者安裝 Node.js LTS（或協助以 `winget install OpenJS.NodeJS.LTS` / `brew install node` 安裝）。
- **安裝指令**：
  ```bash
  npm install -g @colbymchenry/codegraph repomix @upstash/context7-mcp
  ```

---

# 第二步：初始化 RTK 與 CodeGraph 全域掛載

安裝完成後，**必須先在終端機命令列中重新載入環境變數 `PATH`**（因為每次 `run_command` 皆為獨立 Session，Windows 下剛由 `winget` 安裝的執行檔可能需手動合併 Machine/User PATH 才能在同一子進程呼叫）：

- **Windows (PowerShell) 刷新 PATH 並執行掛載**：
  ```powershell
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
  rtk init -g --agent antigravity
  rtk init -g --auto-patch
  codegraph install --yes
  ```
- **macOS / Linux 刷新 PATH 並執行掛載**：
  ```bash
  export PATH="$HOME/.local/bin:$HOME/.cargo/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
  rtk init -g --agent antigravity
  rtk init -g --auto-patch
  codegraph install --yes
  ```

- **專案索引（選用）**：若使用者同意在當前開啟的專案建立 CodeGraph 索引，於專案根目錄執行：
  ```bash
  codegraph init
  ```

---

# 第三步：檢查並顯示 Antigravity Marketplace 插件卡片

協助使用者啟用以下兩個核心官方/夥伴插件：
1. **Context7** (`antigravity-plugins-partners/plugin/context7`)：即時拉取框架與套件最新官方文件，防止過期 API 幻覺。
2. **Chrome DevTools** (`antigravity-plugins-official/plugin/chrome-devtools-plugin`)：讓 AI 自動連接瀏覽器檢查 Console、Network、DOM 與效能。

## 執行規範
1. 先呼叫 `search_marketplace` 工具（查詢 `["context7", "chrome-devtools"]`）確認這兩個插件目前的安裝狀態。
2. **尚未安裝的插件**：在回覆中單獨一行輸出對應的 `<plugin-card>` 讓使用者直接點擊安裝：
   - `<plugin-card catalog-id="antigravity-plugins-partners/plugin/context7"></plugin-card>`
   - `<plugin-card catalog-id="antigravity-plugins-official/plugin/chrome-devtools-plugin"></plugin-card>`
3. **已經安裝的插件**：遵守系統 Marketplace 規範，不要對「已安裝」的插件重複輸出 `<plugin-card>`，而是直接以文字告知使用者「✅ 系統檢測到您已安裝 **[插件名稱]**（若尚未啟用請確認已開啟）」。

---

# 第四步：寫入「全域規則 (Global Rules)」與「專案局域規則 (Workspace/Local Rules)」

## 1. 全域規則（適用於本機所有專案）

1. **讀取並檢查** `~/.gemini/GEMINI.md`（Windows 路徑為 `C:\Users\<使用者名稱>\.gemini\GEMINI.md`）。
2. **保留既有內容**：務必完整保留使用者原有的語言設定、個人規範與 `<!-- CODEGRAPH_START --> ... <!-- CODEGRAPH_END -->` 區塊。
3. **冪等寫入**：若檔案中尚未包含 `## 開發工具優先原則 (Tooling Preferences)`，則在檔案底部補上以下精簡規則（若已存在則檢查內容是否完整，不重複附加）：

```markdown
## 開發工具優先原則 (Tooling Preferences)
- **語法樹搜尋與批次重構**：涉及跨檔案結構化程式碼搜尋或批次語法替換時，優先使用本機已安裝的 `ast-grep` (`sg`)，避免脆弱的正規表達式替換。
- **第三方套件與框架文件**：使用框架、SDK 或不確定最新 API 語法時，優先呼叫 `context7` MCP 查詢最新官方文件，禁止依賴過時記憶盲猜。
- **前端與網頁除錯**：需要檢查網頁渲染、DOM、網路請求、無障礙或效能問題時，優先使用 `chrome-devtools` 相關技能與工具進行實機驗證。
- **專案脈絡打包**：需要將專案或子目錄匯出為單一 LLM 友善檔案時，使用本機已安裝的 `repomix`。
```

4. **跨 Agent 同步（選用）**：檢查本機是否存在 `~/.codex/AGENTS.md` 或 `~/.claude/CLAUDE.md`；若存在且尚未包含上述區塊，也請一併安全補上。

## 2. 專案局域規則（選用，適用於需要跟著 Git 同步給團隊的單一專案）

當使用者要求或同意在「當前專案」寫入局域規則（Local / Workspace Rules）時，在當前專案根目錄建立 `.agents/rules/tooling.md`（或依使用者指定寫入專案根目錄的 `AGENTS.md` / `GEMINI.md`），內容如下：

```markdown
---
trigger: always_on
---
# 專案工具鏈與開發規範 (Workspace Tooling Rules)

1. **程式碼探索 (CodeGraph)**：若專案根目錄存在 `.codegraph/`，在進行 `grep` 或大量讀檔前，必須優先呼叫 `codegraph_explore`（或執行 `codegraph explore "<問題或符號>"`）取得精準呼叫鏈與原始碼。
2. **結構化重構 (ast-grep)**：跨檔案重構或批次修改語法結構時，優先使用 `ast-grep` (`sg`)。
3. **文件查核 (Context7)**：引入新套件、升級框架或呼叫不熟悉的第三方 API 前，必須先透過 `context7` 查詢對應版本的最新文件。
4. **瀏覽器實機驗證 (Chrome DevTools)**：前端 UI、路由或 API 串接修改完成後，優先使用 `chrome-devtools` 工具檢視實際渲染畫面與 Console/Network 狀態。
5. **終端機輸出 (RTK)**：所有終端機指令已由 RTK 自動精簡以節省 Token，僅在輸出異常或明顯缺漏關鍵除錯資訊時才使用 `rtk bypass <cmd>`。
```

---

# 第五步：驗收與回報

完成上述步驟後，在終端機（連同 PATH 刷新）執行以下指令驗證版本：
- `rtk --version` 與 `rtk gain`
- `ast-grep --version`
- `repomix --version`
- `codegraph --version`

最後向使用者輸出一份結構清晰的**「🎉 Vibe Coding 黃金工具鏈驗收報告」表格**，包含：
1. **CLI 工具版本與狀態**（RTK、ast-grep、repomix、CodeGraph）。
2. **全域掛載狀態**（RTK hook、CodeGraph MCP）。
3. **Marketplace 插件狀態**（Context7、Chrome DevTools）。
4. **規則檔寫入路徑與狀態**（Global `~/.gemini/GEMINI.md` 與 Workspace `.agents/rules/tooling.md`）。

---

# 技能維護與自動更新指引 (Skill Maintenance & Auto-Update)

當使用者要求「更新此技能」或「檢查最新版本」（例如：「幫我更新 vibe-coding-toolchain 技能」或「更新黃金工具鏈技能」）時：
1. **讀取雲端最新版本**：使用可用之網路連線工具或命令讀取上方 `update_url`（`https://raw.githubusercontent.com/Lin-Yu-kuan/mySkill/main/vibe-coding-toolchain/SKILL.md`）的最新內容。
2. **覆蓋本機檔案**：將目前本機的 `SKILL.md` 覆蓋更新為最新下載的內容。
3. **回報完成**：簡短向使用者回報已成功更新至 GitHub 最新版本。

