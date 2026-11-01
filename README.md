# 🧠 mySkill - AI Agent 技能庫

收錄個人的 AI Agent 技能集合（Skills），遵循標準通用 Agent Skill 規範，可相容於任何支援 Agent Skill / System Prompts 的 AI 宿主環境。

---

## 📦 Skills 目錄

點擊下方表格中的 Skill 名稱或詳細說明即可查看各項技能的完整文件與使用範例：

| Skill 名稱 | 簡介 | 類別 | 詳細說明 |
|---|---|---|---|
| [knowledge-map-learning](./knowledge-map-learning) | 由上而下脈絡全景圖、四層認識論深度精講、逐回合即時落盤與自包含 HTML 互動手冊匯出 | 學習 / 思考 | [查看說明文件](./knowledge-map-learning/README.md) |

*(未來若有新增其他 Skill，會陸續擴充於此)*

---

## 🚀 通用安裝指南

本倉庫的技能遵循標準通用 Agent Skill 結構，可載入於任何支援 Agent Skills 的 AI 宿主環境中：

### 1. 專案工作區安裝（Workspace Scope）
將欲使用的 Skill 資料夾複製到當前工作專案的技能目錄下（例如專案內的技能資料夾或宿主專案設定目錄）：
```bash
cp -r knowledge-map-learning <你的專案路徑>/<宿主技能目錄>/knowledge-map-learning
```

### 2. 全域安裝（Global Scope，推薦）
將 Skill 資料夾複製到個人使用者家目錄的全域技能目錄下，所有對話工作區皆可隨時調用：
- **Windows (PowerShell)**：
  ```powershell
  # 複製至您的 AI 宿主全域技能目錄：
  Copy-Item -Path "knowledge-map-learning" -Destination "$HOME\<宿主全域設定目錄>\skills\knowledge-map-learning" -Recurse
  ```
- **macOS / Linux**：
  ```bash
  cp -r knowledge-map-learning "$HOME/<宿主全域設定目錄>/skills/knowledge-map-learning"
  ```

---

## 📂 專案結構規範

本倉庫採用 Monorepo 結構管理各個獨立的 AI Skill：

```text
mySkill/
├── README.md                      # 技能庫總覽首頁（當前檔案）
└── knowledge-map-learning/        # 知識地圖主題學習法
    ├── SKILL.md                   # 給 AI Agent 讀取的執行指令與規則
    ├── README.md                  # 給開發者/使用者看的詳細說明文件
    └── scripts/                   # 輔助工具與標準庫腳本
```

---

## 📄 License
MIT License
