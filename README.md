# 🧠 mySkill - AI Agent 技能庫

收錄個人的 AI Agent 技能集合（Skills），遵循標準通用 Agent Skill 規範，專為 **Google Antigravity** 及支援 Agent Skill 規範的 AI 工具打造。

---

## 📦 Skills 目錄

點擊下方表格中的名稱或詳細說明即可查看各項技能的完整文件與使用範例：

| 名稱 | 簡介 | 類別 | 詳細說明 |
|---|---|---|---|
| [knowledge-map-learning](./knowledge-map-learning) | 由上而下脈絡全景圖、四層認識論深度精講、逐回合即時落盤與自包含 HTML 互動手冊匯出 | 學習 / 思考 | [查看說明文件](./knowledge-map-learning/README.md) |
| [frontend-ui-annotator](./frontend-ui-annotator) | 前端介面生成、全域自由便條紙標註與全頁風格萃取專家，支援任意位置隨手貼紙、外站全頁 Design Tokens 萃取、雙軌環境智慧辨識與一鍵迭代 | 前端 / UI 設計 | [查看說明文件](./frontend-ui-annotator/README.md) |
| [essay-solver](./essay-solver) | 臺灣國家考試、國營事業與專技申論題擬答，考場手寫實戰架構、標準四板塊輸出與嚴謹法條裁判查證 | 公職 / 考試 | [查看說明文件](./essay-solver/README.md) |
| [analyze-exam-subject](./analyze-exam-subject) | 本機考古題 PDF 題庫智慧盤點與聚合分析，支援視覺逐頁開圖核對、精簡批次快取、去重命題事件統計與結構化考點地圖報告產出 | 備考 / 題庫分析 | [查看說明文件](./analyze-exam-subject/README.md) |
| [vibe-coding-toolchain](./vibe-coding-toolchain) | Antigravity IDE「Vibe Coding 黃金工具鏈」一鍵配置與健康體檢專家，自動安裝與掛載 RTK、ast-grep、CodeGraph、repomix、Context7 MCP、Chrome DevTools，並以冪等方式寫入全域與專案局域規則 | 環境配置 / 開發工具鏈 | [查看說明文件](./vibe-coding-toolchain/README.md) |

*(未來若有新增其他 Skill，會陸續擴充於此)*

---

## 🚀 通用安裝指南

每個技能目錄內均有詳細的安裝說明（支援 Windows PowerShell 一行直裝、macOS/Linux 一行直裝、對話框自然語言安裝與本機 Symlink）。

### 本地複製安裝（所有專案皆可使用）
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

## 📂 專案結構規範

本倉庫採用 Monorepo 結構管理各個獨立的 AI 技能：

```text
mySkill/
├── GEMINI.md                      # 本倉庫專屬開發規範（含零下載安裝與自動更新標準）
├── README.md                      # 技能庫總覽首頁（當前檔案）
├── essay-solver/                  # 臺灣國考申論題解題專家
│   ├── SKILL.md                   # 核心技能定義（含來源網址與自動更新指引）
│   └── README.md                  # 技能說明與免下載一鍵安裝指南
├── knowledge-map-learning/        # 知識地圖主題學習法
│   ├── SKILL.md                   # 核心技能定義（含來源網址與自動更新指引）
│   ├── README.md                  # 技能說明文件
│   ├── plugin.json                # 外掛 Manifest 清單
│   └── scripts/                   # HTML 編譯腳本與安全 Markdown 解析模組
├── frontend-ui-annotator/         # 前端介面生成、自由便條紙標註與全站風格萃取專家
│   ├── SKILL.md                   # 核心技能定義（含來源網址與自動更新指引）
│   ├── README.md                  # 技能說明文件
│   ├── plugin.json                # 外掛 Manifest 清單
│   └── resources/                 # 便條紙與風格萃取原生腳本、Bookmarklet 安裝頁面
├── analyze-exam-subject/          # 本機考古題題庫智慧分析專家
│   ├── SKILL.md                   # 核心技能定義（含來源網址與自動更新指引）
│   ├── README.md                  # 技能說明文件與一鍵直裝指南
│   ├── requirements.txt           # 依賴套件（pypdf, pypdfium2, Pillow）
│   ├── references/                # 作業指引與資料契約規範
│   ├── scripts/                   # 本機純 Python 盤點、渲染與精簡分析工具鏈
│   └── tests/                     # 單元測試與行為驗收案例
└── vibe-coding-toolchain/         # Vibe Coding 黃金工具鏈一鍵配置與體檢專家
    ├── SKILL.md                   # 核心技能定義（含 5 階段安裝、規則範本與自動更新指引）
    └── README.md                  # 技能說明文件與零下載雲端安裝指南
```

---

## 📄 License
MIT License
