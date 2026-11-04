# 🧠 mySkill - AI Agent 技能庫

收錄高品質的 AI Agent 技能集合（Skills），遵循標準通用 Agent Skill 規範，專為 **Google Antigravity** 及支援 Agent Skill 規範的 AI 工具打造。

[![Total Skills](https://img.shields.io/badge/Skills-5%20個專業技能-purple.svg)](#📦-領域分類目錄-skill-catalog)
[![Domains](https://img.shields.io/badge/Domains-5%20大領域體系-blue.svg)](#📦-領域分類目錄-skill-catalog)
[![Zero Download](https://img.shields.io/badge/Install-零下載雲端一行直裝-brightgreen.svg)](#🎁-領域全家桶一鍵安裝-domain-bundles)
[![Auto Update](https://img.shields.io/badge/Update-自然語言無感更新-orange.svg)](#🔄-智慧無感自動更新已安裝者)

---

## 🧭 快速領域導覽

- **📚 公職考試與備考體系 (Exam & Prep)**（1）：[`essay-solver`](./essay-solver)
- **🧠 思維架構與深度自學 (Knowledge & Learning)**（1）：[`knowledge-map-learning`](./knowledge-map-learning)
- **🎨 前端視覺與互動設計 (Frontend & UI/UX)**（1）：[`frontend-ui-annotator`](./frontend-ui-annotator)
- **✍️ 內容創作與個人社群 (Content & Social Voice)**（1）：[`social-post-voice`](./social-post-voice)
- **🛠️ 開發環境與技能治理 (Dev Toolchain & Skill Governance)**（1）：[`vibe-coding-toolchain`](./vibe-coding-toolchain)

---

## 📦 領域分類目錄 (Skill Catalog)

點擊下方各領域表格中的**技能名稱**或**詳細說明**即可查看完整文件與單獨一鍵安裝指令：

### 📚 公職考試與備考體系 (Exam & Prep)
> 專為國家考試、國營事業、專技考試打造的申論擬答與歷屆考古題 PDF 考點大數據分析。

| 技能名稱 | 核心功能簡介 | 子類別 | 類型 | 說明文件 |
|---|---|---|---|---|
| [**essay-solver**](./essay-solver) | 臺灣國家考試、國營事業與專技申論題擬答，考場手寫實戰架構、標準四板塊輸出與嚴謹法條裁判查證 | `公職 / 考試` | 📄 單檔 | [查看說明](./essay-solver/README.md) |

### 🧠 思維架構與深度自學 (Knowledge & Learning)
> 由上而下建構知識全景圖、四層認識論深度講義與抗上下文壓縮的系統化自學流程。

| 技能名稱 | 核心功能簡介 | 子類別 | 類型 | 說明文件 |
|---|---|---|---|---|
| [**knowledge-map-learning**](./knowledge-map-learning) | 由上而下脈絡全景圖、四層認識論深度精講、逐回合即時落盤與自包含 HTML 互動手冊匯出 | `學習 / 思考` | 📦 套件 | [查看說明](./knowledge-map-learning/README.md) |

### 🎨 前端視覺與互動設計 (Frontend & UI/UX)
> 結合瀏覽器自由便條紙標註、全站 Design Tokens 萃取與高質感 UI 生成工作流。

| 技能名稱 | 核心功能簡介 | 子類別 | 類型 | 說明文件 |
|---|---|---|---|---|
| [**frontend-ui-annotator**](./frontend-ui-annotator) | 前端介面生成、全域自由便條紙標註與全頁風格萃取專家，支援任意位置隨手貼紙、外站全頁 Design Tokens 萃取、雙軌環境智慧辨識與一鍵迭代 | `前端 / UI 設計` | 📦 套件 | [查看說明](./frontend-ui-annotator/README.md) |

### ✍️ 內容創作與個人社群 (Content & Social Voice)
> 具備個人真實語氣、適度吐槽且嚴守事實邊界的跨平台社群貼文寫作與改稿。

| 技能名稱 | 核心功能簡介 | 子類別 | 類型 | 說明文件 |
|---|---|---|---|---|
| [**social-post-voice**](./social-post-voice) | 臺灣繁體中文自然生活感社群貼文寫作與改稿專家，適度吐槽不浮誇，支援 Dcard、Facebook、Instagram、Threads 多平台語氣轉寫與嚴格事實邊界把關 | `社群創作 / 語氣改寫` | 📦 套件 | [查看說明](./social-post-voice/README.md) |

### 🛠️ 開發環境與技能治理 (Dev Toolchain & Skill Governance)
> Antigravity 黃金工具鏈一鍵佈署體檢，以及既有 Skill 的唯讀診斷與最小化演進。

| 技能名稱 | 核心功能簡介 | 子類別 | 類型 | 說明文件 |
|---|---|---|---|---|
| [**vibe-coding-toolchain**](./vibe-coding-toolchain) | Antigravity IDE「Vibe Coding 黃金工具鏈」一鍵配置與健康體檢專家，自動安裝與掛載 RTK、ast-grep、CodeGraph、repomix、Context7 MCP、Chrome DevTools，並以冪等方式寫入全域與專案局域規則 | `環境配置 / 開發工具鏈` | 📄 單檔 | [查看說明](./vibe-coding-toolchain/README.md) |

---

## 🎁 領域全家桶一鍵安裝 (Domain Bundles)

不想一個一個技能分開貼指令？您可以根據需求，直接選擇**「全庫一鍵全裝」**或按領域選擇**「主題全家桶」**！

### 🌟 方案 A：全庫技能一鍵全裝（一次擁有全部技能）
- **Windows (PowerShell)**：
  ```powershell
  $u="https://github.com/Lin-Yu-kuan/mySkill/archive/refs/heads/main.zip"; $t="$env:TEMP\myskill.zip"; $b="$HOME\.gemini\config\skills"; Invoke-WebRequest $u -OutFile $t; Expand-Archive $t "$env:TEMP\myskill-temp" -Force; @("essay-solver","frontend-ui-annotator","knowledge-map-learning","social-post-voice","vibe-coding-toolchain") | ForEach-Object { $d="$b\$_"; if (!(Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }; Copy-Item "$env:TEMP\myskill-temp\mySkill-main\$_\*" $d -Recurse -Force }; Remove-Item $t,"$env:TEMP\myskill-temp" -Recurse -Force; Write-Host "✅ mySkill 全庫 (5 個技能) 已成功安裝！" -ForegroundColor Green
  ```
- **macOS / Linux**：
  ```bash
  mkdir -p "$HOME/.gemini/config/skills" && curl -sSL "https://github.com/Lin-Yu-kuan/mySkill/archive/refs/heads/main.tar.gz" | tar -xz -C "$HOME/.gemini/config/skills" --strip-components=1 "mySkill-main/essay-solver/" "mySkill-main/frontend-ui-annotator/" "mySkill-main/knowledge-map-learning/" "mySkill-main/social-post-voice/" "mySkill-main/vibe-coding-toolchain/" && echo "✅ mySkill 全庫 (5 個技能) 已成功安裝！"
  ```

### 📚 方案 B：按領域全家桶安裝
<details>
<summary><b>點擊展開各領域組合包一行直裝指令（國考包 / 開發治理包 / 前端創作包）</b></summary>

#### 📚 公職考試與備考體系 (Exam & Prep)（含 `essay-solver`）
- **Windows (PowerShell)**：
  ```powershell
  $u="https://github.com/Lin-Yu-kuan/mySkill/archive/refs/heads/main.zip"; $t="$env:TEMP\myskill.zip"; $b="$HOME\.gemini\config\skills"; Invoke-WebRequest $u -OutFile $t; Expand-Archive $t "$env:TEMP\myskill-temp" -Force; @("essay-solver") | ForEach-Object { $d="$b\$_"; if (!(Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }; Copy-Item "$env:TEMP\myskill-temp\mySkill-main\$_\*" $d -Recurse -Force }; Remove-Item $t,"$env:TEMP\myskill-temp" -Recurse -Force; Write-Host "✅ 公職考試 / 備考 全家桶已安裝完成！" -ForegroundColor Green
  ```
- **macOS / Linux**：
  ```bash
  mkdir -p "$HOME/.gemini/config/skills" && curl -sSL "https://github.com/Lin-Yu-kuan/mySkill/archive/refs/heads/main.tar.gz" | tar -xz -C "$HOME/.gemini/config/skills" --strip-components=1 "mySkill-main/essay-solver/" && echo "✅ 公職考試 / 備考 全家桶已安裝完成！"
  ```

#### 🧠 思維架構與深度自學 (Knowledge & Learning)（含 `knowledge-map-learning`）
- **Windows (PowerShell)**：
  ```powershell
  $u="https://github.com/Lin-Yu-kuan/mySkill/archive/refs/heads/main.zip"; $t="$env:TEMP\myskill.zip"; $b="$HOME\.gemini\config\skills"; Invoke-WebRequest $u -OutFile $t; Expand-Archive $t "$env:TEMP\myskill-temp" -Force; @("knowledge-map-learning") | ForEach-Object { $d="$b\$_"; if (!(Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }; Copy-Item "$env:TEMP\myskill-temp\mySkill-main\$_\*" $d -Recurse -Force }; Remove-Item $t,"$env:TEMP\myskill-temp" -Recurse -Force; Write-Host "✅ 學習 / 思考 全家桶已安裝完成！" -ForegroundColor Green
  ```
- **macOS / Linux**：
  ```bash
  mkdir -p "$HOME/.gemini/config/skills" && curl -sSL "https://github.com/Lin-Yu-kuan/mySkill/archive/refs/heads/main.tar.gz" | tar -xz -C "$HOME/.gemini/config/skills" --strip-components=1 "mySkill-main/knowledge-map-learning/" && echo "✅ 學習 / 思考 全家桶已安裝完成！"
  ```

#### 🎨 前端視覺與互動設計 (Frontend & UI/UX)（含 `frontend-ui-annotator`）
- **Windows (PowerShell)**：
  ```powershell
  $u="https://github.com/Lin-Yu-kuan/mySkill/archive/refs/heads/main.zip"; $t="$env:TEMP\myskill.zip"; $b="$HOME\.gemini\config\skills"; Invoke-WebRequest $u -OutFile $t; Expand-Archive $t "$env:TEMP\myskill-temp" -Force; @("frontend-ui-annotator") | ForEach-Object { $d="$b\$_"; if (!(Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }; Copy-Item "$env:TEMP\myskill-temp\mySkill-main\$_\*" $d -Recurse -Force }; Remove-Item $t,"$env:TEMP\myskill-temp" -Recurse -Force; Write-Host "✅ 前端 / UI 設計 全家桶已安裝完成！" -ForegroundColor Green
  ```
- **macOS / Linux**：
  ```bash
  mkdir -p "$HOME/.gemini/config/skills" && curl -sSL "https://github.com/Lin-Yu-kuan/mySkill/archive/refs/heads/main.tar.gz" | tar -xz -C "$HOME/.gemini/config/skills" --strip-components=1 "mySkill-main/frontend-ui-annotator/" && echo "✅ 前端 / UI 設計 全家桶已安裝完成！"
  ```

#### ✍️ 內容創作與個人社群 (Content & Social Voice)（含 `social-post-voice`）
- **Windows (PowerShell)**：
  ```powershell
  $u="https://github.com/Lin-Yu-kuan/mySkill/archive/refs/heads/main.zip"; $t="$env:TEMP\myskill.zip"; $b="$HOME\.gemini\config\skills"; Invoke-WebRequest $u -OutFile $t; Expand-Archive $t "$env:TEMP\myskill-temp" -Force; @("social-post-voice") | ForEach-Object { $d="$b\$_"; if (!(Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }; Copy-Item "$env:TEMP\myskill-temp\mySkill-main\$_\*" $d -Recurse -Force }; Remove-Item $t,"$env:TEMP\myskill-temp" -Recurse -Force; Write-Host "✅ 社群創作 / 語氣改寫 全家桶已安裝完成！" -ForegroundColor Green
  ```
- **macOS / Linux**：
  ```bash
  mkdir -p "$HOME/.gemini/config/skills" && curl -sSL "https://github.com/Lin-Yu-kuan/mySkill/archive/refs/heads/main.tar.gz" | tar -xz -C "$HOME/.gemini/config/skills" --strip-components=1 "mySkill-main/social-post-voice/" && echo "✅ 社群創作 / 語氣改寫 全家桶已安裝完成！"
  ```

#### 🛠️ 開發環境與技能治理 (Dev Toolchain & Skill Governance)（含 `vibe-coding-toolchain`）
- **Windows (PowerShell)**：
  ```powershell
  $u="https://github.com/Lin-Yu-kuan/mySkill/archive/refs/heads/main.zip"; $t="$env:TEMP\myskill.zip"; $b="$HOME\.gemini\config\skills"; Invoke-WebRequest $u -OutFile $t; Expand-Archive $t "$env:TEMP\myskill-temp" -Force; @("vibe-coding-toolchain") | ForEach-Object { $d="$b\$_"; if (!(Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }; Copy-Item "$env:TEMP\myskill-temp\mySkill-main\$_\*" $d -Recurse -Force }; Remove-Item $t,"$env:TEMP\myskill-temp" -Recurse -Force; Write-Host "✅ 環境配置 / 技能治理 全家桶已安裝完成！" -ForegroundColor Green
  ```
- **macOS / Linux**：
  ```bash
  mkdir -p "$HOME/.gemini/config/skills" && curl -sSL "https://github.com/Lin-Yu-kuan/mySkill/archive/refs/heads/main.tar.gz" | tar -xz -C "$HOME/.gemini/config/skills" --strip-components=1 "mySkill-main/vibe-coding-toolchain/" && echo "✅ 環境配置 / 技能治理 全家桶已安裝完成！"
  ```

</details>

---

## 🚀 單一技能通用安裝指南

每個技能目錄內均有詳細的專屬安裝說明（支援 Windows PowerShell 一行直裝、macOS/Linux 一行直裝、對話框自然語言安裝與本機 Symlink）。

### 本地複製安裝（已 Clone 本倉庫者）
將目標 Skill 資料夾複製到 Antigravity 全域技能目錄：
- **Windows (PowerShell)**：
  ```powershell
  Copy-Item -Path ".\<skill-name>" -Destination "$HOME\.gemini\config\skills\<skill-name>" -Recurse -Force
  ```
- **macOS / Linux**：
  ```bash
  cp -r ./<skill-name> "$HOME/.gemini/config/skills/<skill-name>"
  ```

---

## 🔄 智慧無感自動更新（已安裝者）

本倉庫所有技能的 `SKILL.md` 均內建 GitHub 來源網址標註（`repository` 與 `update_url`）及自動更新指引。

一旦您安裝過任何技能，若想取得 GitHub 上的最新版本，**不需要手動重新下載或尋找目錄**！  
只要在 Antigravity 對話框中說：
> 「幫我更新 [技能名稱]」或「檢查 [技能名稱] 最新版本」

Antigravity 會自動讀取本機技能設定，連線至 GitHub 下載最新版覆蓋更新，一句話無感完成！

---

## 🛠️ 倉庫自動化維護與治理工具

為解決技能數量持續增長帶來的維護負擔，本倉庫內建零依賴的自動化管理腳本 [`scripts/manage.py`](./scripts/manage.py)：

```bash
# 1. 檢查所有技能是否符合 GEMINI.md 規範（Frontmatter、更新網址、README 安裝指令）
python scripts/manage.py lint

# 2. 新增或修改技能後，一鍵自動同步生成根目錄 README.md（領域表格、全家桶指令、目錄樹）
python scripts/manage.py sync
```

---

## 📂 專案結構規範

本倉庫採用**「實體扁平相容 + 邏輯領域分群」**的 Monorepo 架構，確保所有雲端更新網址永久穩定：

```text
mySkill/
├── GEMINI.md                      # 本倉庫專屬開發規範（含領域分類、零下載安裝與自動更新標準）
├── README.md                      # 技能庫領域總覽首頁（由 scripts/manage.py 自動同步）
├── scripts/
│   └── manage.py                  # 技能規範體檢 (lint) 與總目錄自動生成 (sync) 工具
├── essay-solver/                  # [公職 / 考試]
│   ├── SKILL.md
│   └── README.md
├── frontend-ui-annotator/         # [前端 / UI 設計]
│   ├── SKILL.md
│   ├── README.md
│   ├── plugin.json
│   └── resources/
├── knowledge-map-learning/        # [學習 / 思考]
│   ├── SKILL.md
│   ├── README.md
│   ├── plugin.json
│   └── scripts/
├── social-post-voice/             # [社群創作 / 語氣改寫]
│   ├── SKILL.md
│   ├── README.md
│   ├── agents/
│   └── references/
└── vibe-coding-toolchain/         # [環境配置 / 開發工具鏈]
    ├── SKILL.md
    └── README.md
```

---

## 📄 License
MIT License
