# Antigravity 專案開發規範：mySkill 技能庫

本文件為 `mySkill` 倉庫的專屬開發與維護規範。Antigravity 在本工作區進行任何新增、修訂或文件編寫時，必須嚴格遵守以下規則。

---

## 零、倉庫架構原則：實體扁平相容・邏輯領域分群

1. **禁止將技能搬移至深層巢狀子資料夾**（例如禁止改為 `categories/exam/essay-solver/`）：
   - 所有技能目錄必須直接位於倉庫根目錄下（`mySkill/<skill-name>/`），以確保對外發布的 `update_url`（`https://raw.githubusercontent.com/Lin-Yu-kuan/mySkill/main/<skill-name>/SKILL.md`）與雲端一鍵安裝腳本 **100% 永久向後相容**。
2. **透過 Frontmatter 進行邏輯領域分類**：
   - 每個技能於 `SKILL.md` 的 YAML Frontmatter 中宣告 `category`（領域代碼）、`category_label`（子類別標籤）與 `summary`（首頁表格簡介）。
   - 標準五大領域代碼（`category`）：
     - `exam`：📚 公職考試與備考體系
     - `learning`：🧠 思維架構與深度自學
     - `frontend`：🎨 前端視覺與互動設計
     - `content`：✍️ 內容創作與個人社群
     - `dev-tools`：🛠️ 開發環境與技能治理

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
- **特徵**：包含 `scripts/`、`references/`、`resources/` 或 `plugin.json` 等附屬檔案（如 `knowledge-map-learning`、`frontend-ui-annotator`）。
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

## 四、自動化總目錄同步與體檢規範（Automated Governance）

每當專案內新增、刪除或修改任何 Skill 時，**嚴禁僅靠人工手改根目錄 `README.md`**，必須執行內建管理腳本 [`scripts/manage.py`](./scripts/manage.py)：

```bash
# 步驟 1：執行規範體檢（檢查所有技能的 Frontmatter、更新網址與安裝指令）
python scripts/manage.py lint

# 步驟 2：自動同步生成根目錄 README.md（包含領域分類表格、全家桶安裝指令、專案結構目錄樹）
python scripts/manage.py sync
```

---

## 五、SKILL.md 自動更新與元資料規範（Skill Metadata & Auto-Update Standard）

為實現自動化分類索引與使用者對 Antigravity 說「幫我更新 [技能名稱]」即可無感升級，每個 Skill 的 `SKILL.md` 必須遵循以下標準：

### 1. Frontmatter 必備欄位
```yaml
---
name: <skill-name>
category: <exam|learning|frontend|content|dev-tools>
category_label: <子類別標籤，如：公職 / 考試>
summary: <供根目錄 README 表格顯示的一句話核心功能簡介>
description: >-
  [技能觸發說明與適用範圍]
  亦支援在使用者要求「更新此技能 / 檢查最新版本」時自動調用以進行線上更新。
repository: https://github.com/Lin-Yu-kuan/mySkill
update_url: https://raw.githubusercontent.com/Lin-Yu-kuan/mySkill/main/<skill-name>/SKILL.md
---
```
- **`category` & `category_label` & `summary`**：供 `scripts/manage.py` 自動彙整領域分類目錄與全家桶安裝包使用。
- **`repository`**：統一指向 GitHub 倉庫根目錄。
- **`update_url`**：指向該技能在 `main` 分支上的 Raw `SKILL.md` 連結。
- **`description`**：必須提及更新觸發字眼，確保 Antigravity 在使用者發出更新請求時能依據 Progressive Disclosure 機制正確喚醒本技能。

### 2. 結尾必備「技能維護與自動更新指引」章節
在 `SKILL.md` 最末尾必須包含統一的更新指引：
- **單檔案技能**：讀取 `update_url` 內容並直接覆蓋本地 `SKILL.md`。
- **目錄套件型技能**：提供快速單檔覆蓋（`SKILL.md`）與全套件串流解壓更新指令雙軌機制。
