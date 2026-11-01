# 🧠 mySkill - AI Agent 技能庫

收錄個人的 AI Agent 技能與外掛集合（Skills & Plugins），遵循標準通用 Agent Skill 與 Antigravity Plugin 規範，可相容於任何支援 Agent Skill / System Prompts 的 AI 宿主環境。

---

## 📦 Skills & Plugins 目錄

點擊下方表格中的名稱或詳細說明即可查看各項技能的完整文件與使用範例：

| 名稱 | 類型 | 簡介 | 詳細說明 |
|---|---|---|---|
| [knowledge-map-learning](./knowledge-map-learning) | Plugin / Skill | 由上而下脈絡全景圖、四層認識論深度精講、逐回合即時落盤與自包含 HTML 互動手冊匯出 | [查看說明文件](./knowledge-map-learning/README.md) |

*(未來若有新增其他 Skill，會陸續擴充於此)*

---

## 🚀 安裝指南

### 1. 安裝為 Antigravity 外掛（推薦，享受完整生命週期管理）
請切換至本倉庫目錄（或使用完整來源路徑）執行複製：
```powershell
# 在 mySkill 倉庫目錄下執行：
Copy-Item -Path "knowledge-map-learning" -Destination "$HOME\.gemini\config\plugins\knowledge-map-learning" -Recurse -Force
```
*或者直接指定絕對路徑：*
```powershell
Copy-Item -Path "D:\develop\AI\mySkill\knowledge-map-learning" -Destination "$HOME\.gemini\config\plugins\knowledge-map-learning" -Recurse -Force
```

### 2. 通用 Agent Skill 安裝（相容其他 AI 宿主環境）
將 `skills/knowledge-map-learning` 資料夾置於專案或全域技能目錄下：
- **專案工作區**：`cp -r knowledge-map-learning/skills/knowledge-map-learning <專案目錄>/<宿主技能目錄>/`
- **全域環境**：`Copy-Item -Path "knowledge-map-learning\skills\knowledge-map-learning" -Destination "$HOME\<宿主全域設定目錄>\skills\knowledge-map-learning" -Recurse`

---

## 📂 專案結構規範

本倉庫採用 Monorepo 結構管理各個獨立的 AI 技能與外掛：

```text
mySkill/
├── README.md                      # 技能庫總覽首頁（當前檔案）
└── knowledge-map-learning/        # 知識地圖主題學習法（Antigravity Plugin）
    ├── plugin.json                # 外掛 Manifest 清單
    ├── README.md                  # 外掛說明文件
    └── skills/
        └── knowledge-map-learning/
            ├── SKILL.md           # 核心技能定義（含雙軌降級機制）
            └── scripts/           # HTML 編譯腳本與安全 Markdown 解析模組
```

---

## 📄 License
MIT License
