# 🧠 mySkill - AI Agent 技能庫

收錄個人的 AI Agent 技能集合（Skills），專為 **Google Antigravity** 及支援 Agent Skill 規範的 AI 工具打造。

---

## 📦 Skills 目錄

點擊下方表格中的 Skill 名稱或詳細說明即可查看各項技能的完整文件與使用範例：

| Skill 名稱 | 簡介 | 類別 | 詳細說明 |
|---|---|---|---|
| [knowledge-map-learning](./knowledge-map-learning) | 由上而下生成 Mermaid 知識地圖骨架，循序漸進且具互動反饋地引導學習全新領域 | 學習 / 思考 | [查看說明文件](./knowledge-map-learning/README.md) |

*(未來若有新增其他 Skill，會陸續擴充於此)*

---

## 🚀 通用安裝指南

### 在 Google Antigravity 中使用

#### 1. 安裝為全域 Skill（所有專案皆可使用）
將你想使用的 Skill 資料夾複製到 Antigravity 全域技能目錄：
```powershell
# 以 knowledge-map-learning 為例
Copy-Item -Path "knowledge-map-learning" -Destination "$HOME\.gemini\config\skills\knowledge-map-learning" -Recurse
```

#### 2. 安裝於特定專案
將 Skill 資料夾複製到你專案目錄的 `.gemini\skills\` 下：
```powershell
Copy-Item -Path "knowledge-map-learning" -Destination "<專案路徑>\.gemini\skills\knowledge-map-learning" -Recurse
```

---

## 📂 專案結構規範

本倉庫採用 Monorepo 結構管理各個獨立的 AI Skill：

```text
mySkill/
├── README.md                      # 技能庫總覽首頁（當前檔案）
└── knowledge-map-learning/        # 知識地圖主題學習法
    ├── SKILL.md                   # 給 AI Agent 讀取的執行指令與規則
    └── README.md                  # 給開發者/使用者看的詳細說明文件
```

---

## 📄 授權 (License)

[MIT License](LICENSE)
