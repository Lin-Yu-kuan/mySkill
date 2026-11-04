# 🛠️ Antigravity Vibe Coding 黃金工具鏈一鍵配置專家 (`vibe-coding-toolchain`)

> 專為 Google Antigravity IDE 打造的開發環境快速啟動（Bootstrap）與健康體檢 Skill。換電腦、重灌系統或分享給團隊時，一句話自動完成 **RTK、ast-grep、CodeGraph、repomix、Context7 MCP、Chrome DevTools** 的安裝、掛載、規則寫入與版本驗收。

[![Antigravity Skill](https://img.shields.io/badge/Antigravity-Skill-purple.svg)](https://antigravity.google)
[![Platform](https://img.shields.io/badge/OS-Windows%20%7C%20macOS%20%7C%20Linux-blue.svg)]()
[![Language](https://img.shields.io/badge/Language-繁體中文%20(臺灣)-brightgreen.svg)]()
[![Idempotent](https://img.shields.io/badge/Mode-冪等安全安裝%20%26%20環境體檢-orange.svg)]()

---

## 💡 為什麼需要這個 Skill？

每次更換電腦、重設開發環境或帶新夥伴進入 Vibe Coding 工作流時，往往需要手動翻找筆記、逐一安裝 CLI 工具、設定 MCP 與編寫 `GEMINI.md` 規則：
- **Token 消耗暴增**：未安裝與掛載 `rtk`（Rust Token Killer），終端機冗長輸出瞬間塞爆上下文視窗。
- **跨檔案搜尋與重構緩慢**：缺乏 `CodeGraph` 呼叫鏈探索與 `ast-grep` 語法樹工具，只能依賴高耗能的 `grep` 與脆弱的正則替換。
- **過時 API 幻覺與盲目除錯**：未啟用 `Context7` 與 `Chrome DevTools`，導致 AI 依賴舊記憶盲猜語法、改完前端卻無法實機驗證渲染結果。
- **規則遺漏或重複覆蓋**：手動貼上全域規則時，容易不小心蓋掉原有的個人設定或漏掉專案局域規則。

**`vibe-coding-toolchain` 將整套環境配置標準化為可隨身攜帶的 Skill**：  
只要一行指令把這個 Skill 裝進新電腦，對 Antigravity 說一句 **「幫我配置黃金工具鏈」**，就能全自動檢測作業系統、補齊缺漏工具、掛載 MCP、彈出插件卡片並以「冪等不破壞既有設定」的方式寫入規則！

---

## 🚀 Antigravity 一鍵安裝方式

使用者**完全不需要事先手動下載或解壓縮整個 GitHub 專案**！請根據您的情境選擇最方便的安裝方式：

### 🌐 方式一：免下載！Windows (PowerShell) 雲端一行直裝（推薦）
在新電腦上打開 PowerShell，貼上以下單行指令並按 Enter，即可直接從 GitHub 雲端安裝至 Antigravity 全域技能庫：

```powershell
$dir = "$HOME\.gemini\config\skills\vibe-coding-toolchain"; if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force }; Invoke-RestMethod -Uri "https://raw.githubusercontent.com/Lin-Yu-kuan/mySkill/main/vibe-coding-toolchain/SKILL.md" | Out-File -FilePath "$dir\SKILL.md" -Encoding utf8; Write-Host "✅ vibe-coding-toolchain 技能已成功從 GitHub 雲端直裝至 Antigravity！" -ForegroundColor Green
```

---

### 🍎 方式二：免下載！macOS / Linux 雲端一行直裝
開啟終端機（Terminal），貼上以下指令直接下載安裝：

```bash
mkdir -p "$HOME/.gemini/config/skills/vibe-coding-toolchain" && curl -sSL "https://raw.githubusercontent.com/Lin-Yu-kuan/mySkill/main/vibe-coding-toolchain/SKILL.md" -o "$HOME/.gemini/config/skills/vibe-coding-toolchain/SKILL.md" && echo "✅ vibe-coding-toolchain 技能已成功安裝！"
```

---

### 💬 方式三：免開終端機！Antigravity 聊天框「自然語言安裝」
如果您正在使用 Antigravity IDE 或 CLI，連終端機都不需要開，直接在對話框貼上這句話交給 Agent：

> 「請幫我從 GitHub 安裝 vibe-coding-toolchain 技能：下載 `https://raw.githubusercontent.com/Lin-Yu-kuan/mySkill/main/vibe-coding-toolchain/SKILL.md` 並存放在我的 Antigravity 全域技能目錄 (`~/.gemini/config/skills/vibe-coding-toolchain/SKILL.md`)，接著立即執行它幫我配置好黃金工具鏈。」

---

### 💻 方式四：本機維護者軟連結（Symlink，修改即時生效）
如果您已將 `mySkill` 專案 Clone 至本機並進行開發維護，推薦建立符號連結。日後在原目錄修改 `SKILL.md`，Antigravity 會**即刻同步生效**，無須重複複製：

```powershell
# 請在 mySkill/vibe-coding-toolchain 目錄下執行（需管理員權限或開啟 Windows 開發人員模式）
New-Item -ItemType SymbolicLink -Path "$HOME\.gemini\config\skills\vibe-coding-toolchain" -Target (Get-Location).Path -Force
```

---

### 📁 方式五：已 Clone 完整倉庫者的本地複製方式
如果您已經將整個 `mySkill` 倉庫 Clone 到本機，亦可直接以本地檔案複製安裝：

- **Windows (PowerShell)**：
  ```powershell
  Copy-Item -Path ".\vibe-coding-toolchain" -Destination "$HOME\.gemini\config\skills\vibe-coding-toolchain" -Recurse -Force
  ```
- **macOS / Linux**：
  ```bash
  cp -r ./vibe-coding-toolchain "$HOME/.gemini/config/skills/vibe-coding-toolchain"
  ```

---

## 🔄 智慧無感自動更新（已安裝者）

本技能遵循 `mySkill` 規範，已在 `SKILL.md` 開頭標記 GitHub 來源。安裝完成後，未來若您擴充了黃金工具鏈的內容並推送到 GitHub，在其他電腦上**不需要再次執行終端機指令**！

只要在 Antigravity 對話框中說：
> 「幫我更新黃金工具鏈技能」或「更新 vibe-coding-toolchain 最新版本」

Antigravity 會自動讀取本機設定並連線至 GitHub 覆蓋更新為最新版本！

---

## ⚙️ 五階段全自動配置架構

觸發本技能後，Agent 會依序執行以下五個標準化階段：

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Step 1：安裝全域 CLI 工具（自動判別 Windows winget / macOS brew）    │
│ • RTK (rtk-ai.rtk)：壓縮終端機輸出，節省 60%~90% Token               │
│ • ast-grep (sg)：基於 AST 語法樹的跨檔案搜尋與精準批次重構           │
│ • npm 全域安裝：@colbymchenry/codegraph、repomix、@upstash/context7  │
├──────────────────────────────────────────────────────────────────────┤
│ Step 2：刷新 PATH 與初始化全域掛載                                   │
│ • rtk init -g --agent antigravity & rtk init -g --auto-patch         │
│ • codegraph install --yes（自動註冊 CodeGraph MCP）                  │
│ • （選用）於當前專案執行 codegraph init 建立呼叫鏈索引               │
├──────────────────────────────────────────────────────────────────────┤
│ Step 3：Marketplace 核心插件檢查與一鍵安裝卡片                       │
│ • Context7 (antigravity-plugins-partners/plugin/context7)            │
│ • Chrome DevTools (antigravity-plugins-official/plugin/...)          │
├──────────────────────────────────────────────────────────────────────┤
│ Step 4：冪等寫入全域（Global）與專案局域（Workspace）規則            │
│ • 安全更新 ~/.gemini/GEMINI.md（保留既有規則與 CodeGraph 區塊）      │
│ • （選用）於專案建立 .agents/rules/tooling.md 隨 Git 同步給團隊      │
├──────────────────────────────────────────────────────────────────────┤
│ Step 5：終端機版本驗收與健康度報告                                   │
│ • 實測 rtk / ast-grep / repomix / codegraph 版本與 Token 節省統計    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 💬 觸發方式與常用指令

安裝完成後，您可以隨時在 Antigravity 對話框輸入以下自然語言指令：

| 使用情境 | 對話框輸入指令範例 | 執行效果 |
|---|---|---|
| **新電腦一鍵全套配置** | `幫我配置黃金工具鏈` / `執行 vibe-coding-toolchain` | 完整執行 Step 1 ～ Step 5，自動安裝缺漏工具、掛載 MCP 與寫入規則 |
| **既有電腦環境體檢** | `檢查我的黃金工具鏈健康度` / `驗收開發工具鏈版本` | 不重複安裝，快速盤點 CLI 版本、MCP 掛載、插件與 `GEMINI.md` 狀態 |
| **新專案匯入局域規則** | `幫目前這個專案加上黃金工具鏈局域規則並初始化 CodeGraph` | 在當前專案建立 `.agents/rules/tooling.md` 並執行 `codegraph init` |
| **更新技能本身** | `幫我更新 vibe-coding-toolchain 技能` | 從 GitHub `main` 分支拉取最新 `SKILL.md` 覆蓋本機技能檔 |

---

## 📂 檔案目錄結構

```text
vibe-coding-toolchain/
├── SKILL.md     # 技能定義核心檔案（含 5 階段安裝程序、規則範本與自動更新指引）
└── README.md    # 說明文件與 Antigravity 零下載一鍵安裝指南
```

