# Antigravity 專案開發規範：mySkill 技能庫

本文件為 `mySkill` 倉庫的專屬開發與維護規範。Antigravity 在本工作區進行任何新增、修訂或文件編寫時，必須嚴格遵守以下規則。

---

## 一、技能文件標準（Skill README Standard）

每個位於本倉庫中的技能（Skill）目錄下，除了核心定義檔 `SKILL.md` 之外，**必須包含一份高品質的 `README.md`**，且必須包含標準的 **「🚀 Antigravity 一鍵安裝方式」** 章節。

### 核心原則：零下載・免手動解壓（Zero-Download Cloud Install）
外部使用者在 GitHub 上瀏覽任何技能時，**絕對不應被要求先手動 Download ZIP、解壓縮或手動尋找本機路徑**。所有安裝指南必須提供「複製貼上一行指令，電腦自動從雲端下載安裝完成」的極致體驗。

---

## 二、技能安裝指令之二元分類規範

根據技能的目錄結構，嚴格區分並提供對應的安裝指令：

### 類型 1：單檔案技能（Single-File Skill）
- **特徵**：僅由 `SKILL.md` 組成，無附屬的 `scripts/` 或 `resources/` 資料夾（如 `essay-solver`）。
- **PowerShell 語法**：
  ```powershell
  $dir = "$HOME\.gemini\config\skills\<skill-name>"; if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force }; Invoke-RestMethod -Uri "https://raw.githubusercontent.com/Lin-Yu-kuan/mySkill/main/<skill-name>/SKILL.md" | Out-File -FilePath "$dir\SKILL.md" -Encoding utf8; Write-Host "✅ <skill-name> 技能已成功安裝！" -ForegroundColor Green
  ```
- **macOS / Linux 語法**：
  ```bash
  mkdir -p "$HOME/.gemini/config/skills/<skill-name>" && curl -sSL "https://raw.githubusercontent.com/Lin-Yu-kuan/mySkill/main/<skill-name>/SKILL.md" -o "$HOME/.gemini/config/skills/<skill-name>/SKILL.md" && echo "✅ <skill-name> 技能已成功安裝！"
  ```

---

### 類型 2：目錄套件型技能（Multi-File / Package Skill）
- **特徵**：包含 `scripts/`、`resources/` 或 `plugin.json` 等附屬檔案（如 `knowledge-map-learning`、`frontend-ui-annotator`）。
- **PowerShell 語法（純原生、免 Git、免第三方工具）**：
  利用 GitHub Archive Zip 串流解壓單一子目錄並自動清除暫存檔：
  ```powershell
  $u="https://github.com/Lin-Yu-kuan/mySkill/archive/refs/heads/main.zip"; $t="$env:TEMP\myskill.zip"; $d="$HOME\.gemini\config\skills\<skill-name>"; if (!(Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force }; Invoke-WebRequest $u -OutFile $t; Expand-Archive $t "$env:TEMP\myskill-temp" -Force; Copy-Item "$env:TEMP\myskill-temp\mySkill-main\<skill-name>\*" $d -Recurse -Force; Remove-Item $t,"$env:TEMP\myskill-temp" -Recurse -Force; Write-Host "✅ <skill-name> 技能套件已成功安裝！" -ForegroundColor Green
  ```
- **macOS / Linux 語法（原生 curl + tar 串流提取特定目錄）**：
  ```bash
  mkdir -p "$HOME/.gemini/config/skills/<skill-name>" && curl -sSL "https://github.com/Lin-Yu-kuan/mySkill/archive/refs/heads/main.tar.gz" | tar -xz -C "$HOME/.gemini/config/skills/<skill-name>" --strip-components=2 "mySkill-main/<skill-name>/" && echo "✅ <skill-name> 技能套件已成功安裝！"
  ```

---

## 三、四大標配安裝管道（每個 Skill README 必備）

每個技能的安裝章節必須同時具備以下四種情境說明：
1. **🌐 免下載！Windows (PowerShell) 雲端直裝**
2. **🍎 免下載！macOS / Linux 雲端直裝**
3. **💬 免開終端機！Antigravity 聊天框「自然語言安裝」**（提供一段讓使用者直接貼給 Agent 的安裝提示詞）
4. **💻 本機維護者軟連結（Symlink，修改即時生效）**：
   ```powershell
   New-Item -ItemType SymbolicLink -Path "$HOME\.gemini\config\skills\<skill-name>" -Target (Get-Location).Path -Force
   ```
5. *(可選)* **📁 已 Clone 完整倉庫者的本地複製方式**。

---

## 四、全域總目錄同步維護規範

每當專案內有以下變更時，**必須同步更新倉庫首頁根目錄 [`README.md`](./README.md)**：
1. **新增 Skill**：在「📦 Skills 目錄」表格中登記名稱、簡介、類別與連結，並更新「專案結構規範」目錄樹。
2. **更新 Skill 定位或說明**：同步修正根目錄表格簡介。

