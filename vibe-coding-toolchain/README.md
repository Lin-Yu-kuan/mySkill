# 🛠️ Antigravity Vibe Coding 黃金工具鏈分級配置專家 (`vibe-coding-toolchain`)

> 專為 Google Antigravity IDE 打造的開發環境分級啟動（Bootstrap）、衝突體檢與規則佈署 Skill（v2.0.0）。採用 **Tier 1 精簡主力 / Tier 2 無副作用增強 / Tier 3 痛點選裝** 三層架構，無衝突整合 **Context7、Chrome DevTools、Google 原生 Agent Skills（`google/skills`、`stitch-skills`）、`ast-grep`、`UI/UX Pro Max`** 與選配分析工具，並依實裝動態寫入規則。

[![Antigravity Skill](https://img.shields.io/badge/Antigravity-Skill-purple.svg)](https://antigravity.google)
[![Platform](https://img.shields.io/badge/OS-Windows%20%7C%20macOS%20%7C%20Linux-blue.svg)]()
[![Language](https://img.shields.io/badge/Language-繁體中文%20(臺灣)-brightgreen.svg)]()
[![Idempotent](https://img.shields.io/badge/Mode-分級零衝突%20%26%20環境體檢-orange.svg)]()

---

## 💡 為什麼需要這個 Skill？（v2.0 分級防雷設計）

過去「一次全裝」的工具鏈容易造成 MCP 重複掛載、小專案規則過重或與 Google 原生技能打架。`v2.0.0` 改為**按需分級、依實裝寫入規則**：

- **杜絕 Context7 重複掛載**：Antigravity 環境統一走 Marketplace 插件，不再與 `npm -g @upstash/context7-mcp` 雙重安裝搶工具位。
- **與 Google 原生 Agent Skills 分工**：Google 生態（GCP / Firebase / Gemini API / Android）優先走官方原生技能，React / Next.js / Tailwind / Python 等第三方開源套件交給 Context7。
- **前端設計系統不越界**：從零做介面才調用 `UI/UX Pro Max` 或 `stitch-skills`；維護既有頁面或搭配 `frontend-ui-annotator` 局部修改時，優先沿用既有樣式與 Design Tokens。
- **高侵入工具先告知風險**：`RTK`（輸出壓縮可能隱藏除錯細節）與 `CodeGraph`（需維護 `.codegraph/` 索引）不再預設強裝，確定有痛點再選裝。

---

## 🤝 與 Google 原生 Agent Skills 的分工對照

| 工具領域 | 本工具鏈方案 | Google 原生生態 | 建議搭配方式 |
| :--- | :--- | :--- | :--- |
| **套件文件查核** | Context7（Marketplace） | `google/skills` + Developer Knowledge MCP | **互補分工**：Google 服務用官方原生；第三方開源套件用 Context7 |
| **瀏覽器除錯** | Chrome DevTools（Marketplace） | 本身即為 Google 官方插件 | **直接共用**：一般瀏覽用內建能力，查 Console/Network/DOM 用它 |
| **前端設計生成** | `UI/UX Pro Max`（離線規則庫） | `google-labs-code/stitch-skills` | **二選一**：純文字推理選前者；搭配 Stitch MCP 生設計稿選後者 |
| **AST / 壓縮 / 圖譜** | `ast-grep`、`RTK`、`CodeGraph`、`repomix` | 無對應替代品 | **按需選裝**：`ast-grep` 無副作用可優先裝；其餘視專案規模選裝 |

---

## 🚀 Antigravity 一鍵安裝方式

使用者**完全不需要事先手動下載或解壓縮整個 GitHub 專案**！請根據您的情境選擇最方便的安裝方式：

### 🌐 方式一：免下載！Windows (PowerShell) 雲端一行直裝（推薦）
在新電腦上打開 PowerShell，貼上以下單行指令並按 Enter，即可直接從 GitHub 雲端安裝至 Antigravity 全域技能庫：

```powershell
$d="$HOME\.gemini\config\skills\vibe-coding-toolchain"; New-Item -ItemType Directory -Path $d -Force | Out-Null; Invoke-WebRequest -Uri "https://raw.githubusercontent.com/Lin-Yu-kuan/mySkill/main/vibe-coding-toolchain/SKILL.md" -OutFile "$d\SKILL.md.new"; Move-Item "$d\SKILL.md.new" "$d\SKILL.md" -Force; Write-Host "✅ vibe-coding-toolchain 技能已成功從 GitHub 雲端直裝至 Antigravity！" -ForegroundColor Green
```

---

### 🍎 方式二：免下載！macOS / Linux 雲端一行直裝
開啟終端機（Terminal），貼上以下指令直接下載安裝：

```bash
mkdir -p "$HOME/.gemini/config/skills/vibe-coding-toolchain" && curl -fsSL "https://raw.githubusercontent.com/Lin-Yu-kuan/mySkill/main/vibe-coding-toolchain/SKILL.md" -o "$HOME/.gemini/config/skills/vibe-coding-toolchain/SKILL.md.new" && mv "$HOME/.gemini/config/skills/vibe-coding-toolchain/SKILL.md.new" "$HOME/.gemini/config/skills/vibe-coding-toolchain/SKILL.md" && echo "✅ vibe-coding-toolchain 技能已成功安裝！"
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

本技能遵循 `mySkill` 規範，已在 `SKILL.md` 開頭標記 GitHub 來源。安裝完成後，若您在其他電腦上需要同步最新版本，只要在 Antigravity 對話框中說：
> 「幫我更新黃金工具鏈技能」或「更新 vibe-coding-toolchain 最新版本」

Agent 會比對 `.skillkit/skills.json` 版本與 SHA-256 雜湊值、備份原檔並安全更新為最新版本！

---

## ⚙️ 三層分級配置架構

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Step 0：環境預檢、重複掛載偵測 & 執行模式確認                        │
├──────────────────────────────────────────────────────────────────────┤
│ Tier 1：精簡主力（預設推薦、零衝突）                                 │
│ • Context7 (Marketplace 單一來源，禁用 npm 重複安裝)                 │
│ • Chrome DevTools (Google 官方 Marketplace 插件)                     │
│ • Google 原生 Agent Skills (開發 GCP/Firebase/Android 時按需單選)    │
├──────────────────────────────────────────────────────────────────────┤
│ Tier 2：進階增強（無副作用、按需選裝）                               │
│ • ast-grep (sg)：AST 語法樹跨檔案精準搜尋與批次重構                  │
│ • 前端設計系統（二選一）：UI/UX Pro Max 或 Google stitch-skills      │
├──────────────────────────────────────────────────────────────────────┤
│ Tier 3：特殊痛點工具（事前風險告知，明確同意後才裝）                 │
│ • RTK：終端機輸出壓縮（需知悉 rtk bypass <cmd> 除錯方式）            │
│ • CodeGraph：大型專案呼叫鏈圖譜（需維護 .codegraph/ 索引）           │
│ • repomix：單檔專案脈絡打包（供網頁版 AI 全局閱讀）                  │
├──────────────────────────────────────────────────────────────────────┤
│ Step 4：依實裝動態寫入規則（Global ~/.gemini/GEMINI.md & Workspace） │
│ • 只寫入實際已安裝的工具條目，並與 frontend-ui-annotator 保持相容    │
├──────────────────────────────────────────────────────────────────────┤
│ Step 5：版本驗收 & 衝突掃描報告（檢查重複 MCP 與空規則引用）         │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 💬 觸發方式與常用指令

| 使用情境 | 對話框輸入指令範例 | 執行效果 |
|---|---|---|
| **精簡主力一鍵配置（預設）** | `幫我配置黃金工具鏈` / `初始化開發環境` | 優先配置 Tier 1 零衝突主力，並詢問是否加選 Tier 2 / Google Skills |
| **既有電腦衝突與健康體檢** | `檢查我的黃金工具鏈健康度` / `驗收開發工具鏈` | 不重複安裝，盤點版本、重複 MCP 掛載與 `GEMINI.md` 規則衝突 |
| **新專案匯入局域規則** | `幫目前這個專案加上黃金工具鏈局域規則` | 依目前實裝工具動態生成 `.agents/rules/tooling.md` |
| **更新技能本身** | `幫我更新 vibe-coding-toolchain 技能` | 比對 manifest 與 SHA-256 後從 GitHub 安全更新 |

---

## 📂 檔案目錄結構

```text
vibe-coding-toolchain/
├── SKILL.md     # 技能定義核心檔案（三層分級安裝程序、動態規則範本與自動更新指引）
└── README.md    # 說明文件與 Antigravity 零下載一鍵安裝指南
```
