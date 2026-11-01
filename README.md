# 🧠 mySkill - AI Agent 技能庫

收錄個人的 AI Agent 技能集合（Skills），遵循標準通用 Agent Skill 規範，專為 **Google Antigravity** 及支援 Agent Skill 規範的 AI 工具打造。

---

## 📦 Skills 目錄

點擊下方表格中的名稱或詳細說明即可查看各項技能的完整文件與使用範例：

| 名稱 | 簡介 | 類別 | 詳細說明 |
|---|---|---|---|
| [knowledge-map-learning](./knowledge-map-learning) | 由上而下脈絡全景圖、四層認識論深度精講、逐回合即時落盤與自包含 HTML 互動手冊匯出 | 學習 / 思考 | [查看說明文件](./knowledge-map-learning/README.md) |
| [frontend-ui-annotator](./frontend-ui-annotator) | 前端介面生成與視覺標註專家，支援 IDE 內建預覽、跨瀏覽器 Bookmarklet、DOM 麵包屑切換與一鍵反饋迭代 | 前端 / UI 設計 | [查看說明文件](./frontend-ui-annotator/README.md) |
| [essay-solver](./essay-solver) | 臺灣國家考試、國營事業與專技申論題擬答，考場手寫實戰架構、標準四板塊輸出與嚴謹法條裁判查證 | 公職 / 考試 | [查看說明文件](./essay-solver/README.md) |

*(未來若有新增其他 Skill，會陸續擴充於此)*

---

## 🚀 通用安裝指南

### 在 Google Antigravity 中使用（所有專案皆可使用）
將 Skill 資料夾複製到 Antigravity 全域技能目錄：
- **Windows (PowerShell)**：
  ```powershell
  Copy-Item -Path "D:\develop\AI\mySkill\knowledge-map-learning" -Destination "$HOME\.gemini\config\skills\knowledge-map-learning" -Recurse -Force
  ```
- **macOS / Linux**：
  ```bash
  cp -r knowledge-map-learning "$HOME/.gemini/config/skills/knowledge-map-learning"
  ```

---

## 📂 專案結構規範

本倉庫採用 Monorepo 結構管理各個獨立的 AI 技能：

```text
mySkill/
├── README.md                      # 技能庫總覽首頁（當前檔案）
├── essay-solver/                  # 臺灣國考申論題解題專家
│   ├── SKILL.md                   # 核心技能定義（含考場準則與四區塊規範）
│   └── README.md                  # 技能說明與免下載一鍵安裝指南
├── knowledge-map-learning/        # 知識地圖主題學習法
│   ├── SKILL.md                   # 核心技能定義（含雙軌降級機制）
│   ├── README.md                  # 技能說明文件
│   ├── plugin.json                # 外掛 Manifest 清單
│   └── scripts/                   # HTML 編譯腳本與安全 Markdown 解析模組
└── frontend-ui-annotator/         # 前端介面生成與視覺標註專家
    ├── SKILL.md                   # 核心技能定義
    ├── README.md                  # 技能說明文件
    ├── plugin.json                # 外掛 Manifest 清單
    └── resources/                 # 標註器原生腳本與 Bookmarklet 安裝頁面
```

---

## 📄 License
MIT License
