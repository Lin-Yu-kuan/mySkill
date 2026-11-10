# Skill Evolution：既有 Skill 完整診斷與根因修正

預設完整檢查既有 Skill，以具體情境、可追溯的證據與反證排除誤報，再依影響與根因修正。成功標準是找到重要且有依據的問題，同時保留有效設計；不以發現數量或修改行數評分。

- **檢查／評估**：唯讀交付診斷，不直接修改。
- **明確要求優化／修改**：先診斷，再執行授權範圍內的修正與驗證；「有什麼可以優化」仍只提建議。
- **明確要求工作流轉換**：原 Skill 唯讀，在指定的新目錄建立獨立可執行專案，保留原功能並驗收；不因一般優化請求自動啟動。
- **版本維護**：比對或取得本技能的上游版本，與內容優化分開。

## 診斷如何運作

工作流轉換的詳細程序見 [轉換指南](references/workflow_conversion.md)，產物與執行介面見 [工作流契約](references/workflow_contract.md)。範本及檢查工具位於 scripts，完整套件更新會一併包含；沒有新增全域安裝或中央引擎依賴。

使用例：

> 用 skill-evolution 將「原 Skill 路徑」轉成獨立工作流，輸出到「新的專案目錄」。保留原有功能，原 Skill 不修改，沿用 Antigravity，不額外呼叫 AI API。

腳本 init 只建立草稿，不能代替宿主完成領域實作。check 只驗證靜態結構、功能映射與來源一致性；必須另跑測試，不宣稱已驗證 AI 語意品質。

1. 讀主檔與行為相關的引用鏈、腳本，記錄缺件與無法確認的部分。
2. 檢查觸發條件、任務與完成標準、指令一致性、引用與依賴、工具能力、流程分支與失敗恢復、授權與確認點、驗收有效性。
3. 為重要疑點建立合理輸入，沿規則推演；回查指南、例外與保護是否已解決問題。
4. 區分文件可證實的缺陷、實際執行失敗與待驗證風險，按根因去重並依影響排序。
5. 提出足以解決根因的修正；有實作要求時完成修改與相關驗證。

完成主要適用面向後才結束，沒有固定發現配額。已有範例不等於執行有效；沒有發現時可回報「在本次檢查範圍內未發現需修改項目」，不把未做的實測寫成品質認證。

核心流程見 [SKILL.md](SKILL.md)，詳細判準見 [診斷指南](references/diagnostic_rubric.md)。文風與極性核對只在目標任務相關時使用，不強加句長、emoji 或多代理架構。

---

## 🚀 Antigravity 一鍵安裝方式

使用者**完全不需要事先手動下載或解壓縮整個 GitHub 專案**！請根據您的系統環境選擇最方便的安裝方式：

### 🌐 方式一：免下載！Windows (PowerShell) 雲端一行直裝（推薦）
開啟 PowerShell，複製貼上以下單行指令並按 Enter，即可直接從 GitHub 雲端安裝本技能及其附屬指南與 Python 工具至 Antigravity 全域目錄：

```powershell
$u="https://github.com/Lin-Yu-kuan/mySkill/archive/refs/heads/main.zip"; $b="$HOME\.gemini\config\skills"; $t=Join-Path $env:TEMP ("skills-"+[guid]::NewGuid()); Invoke-WebRequest $u -OutFile "$t.zip" -ErrorAction Stop; Expand-Archive "$t.zip" $t -Force -ErrorAction Stop; @("skill-evolution") | ForEach-Object { $d="$b\$_"; New-Item -ItemType Directory -Path $d -Force | Out-Null; Copy-Item "$t\mySkill-main\$_\*" $d -Recurse -Force -ErrorAction Stop }; Remove-Item "$t.zip",$t -Recurse -Force -ErrorAction SilentlyContinue; Write-Host "✅ skill-evolution 技能套件已成功安裝！" -ForegroundColor Green
```

---

### 🍎 方式二：免下載！macOS / Linux 雲端一行直裝
開啟終端機（Terminal），貼上以下指令直接串流提取安裝：

```bash
mkdir -p "$HOME/.gemini/config/skills" && curl -fsSL "https://github.com/Lin-Yu-kuan/mySkill/archive/refs/heads/main.tar.gz" | tar -xz -C "$HOME/.gemini/config/skills" --strip-components=1 "mySkill-main/skill-evolution/" && echo "✅ skill-evolution 技能套件已成功安裝！"
```

---

### 💬 方式三：免開終端機！Antigravity 聊天框「自然語言安裝」
如果您正在使用 Antigravity IDE 或 CLI，連終端機都不需要開，直接在對話框貼上這句話交給 Agent：

> 「請幫我從 GitHub 倉庫 (`https://github.com/Lin-Yu-kuan/mySkill`) 將 `skill-evolution` 技能套件（含 `SKILL.md`、`references/` 與 `scripts/` 目錄）下載並安裝到我的 Antigravity 全域技能目錄 (`~/.gemini/config/skills/skill-evolution`)。」

---

### 💻 方式四：本機維護者軟連結（Symlink，修改即時生效）
如果您已將 `mySkill` 倉庫 Clone 至本機並進行開發維護，推薦建立符號連結。日後在原目錄修改腳本或指引，Antigravity 會**即刻同步生效**：

```powershell
# 請在 mySkill/skill-evolution 目錄下執行（需管理員權限或開啟 Windows 開發人員模式）
New-Item -ItemType SymbolicLink -Path "$HOME\.gemini\config\skills\skill-evolution" -Target (Get-Location).Path -Force
```

---

### 📁 方式五：已 Clone 完整倉庫者的本地複製方式
如果您已經將整個 `mySkill` 倉庫 Clone 到本機，亦可直接以本地檔案複製安裝：

- **Windows (PowerShell)**：
  ```powershell
  Copy-Item -Path ".\skill-evolution" -Destination "$HOME\.gemini\config\skills\skill-evolution" -Recurse -Force
  ```
- **macOS / Linux**：
  ```bash
  cp -r ./skill-evolution "$HOME/.gemini/config/skills/skill-evolution"
  ```

---

## 版本檢查與更新（已安裝者）

| 在 Antigravity 中提出的要求 | 實際範圍與回報 |
| --- | --- |
| 「檢查 skill-evolution 最新版本」 | 唯讀比對本機與遠端主檔，回報相同、有差異，或無法判定及原因。 |
| 「更新 skill-evolution 技能」 | 只更新主檔 `SKILL.md`。 |
| 「完整更新 skill-evolution 套件」 | 從同一份上游快照更新主檔與 `references/`、`scripts/` 內的上游檔案，保留其他本機檔案。 |

兩種更新都在寫入後重讀並比對目標內容，核對成功才回報實際更新範圍。詳細步驟見 [技能維護指引](SKILL.md#版本檢查與更新)。

---

## 診斷交付

報告依內容選擇段落、清單或表格，無固定四欄要求：

- 檢查範圍、適用面向、應保留的設計與不適用項目。
- 依影響排序的發現：證據層級、檔案與行號、觸發情境及後果、根因、修正與驗收方式。
- 待驗證風險、未讀取或未執行的部分，以及下一步如何查證。
- 實作時另附實際改動與測試結果；唯讀診斷則不改目標檔案。

## Python 診斷輔助工具

腳本使用 Python 3 標準函式庫；CLI 與 JSON 介面維持相容。

```powershell
python scripts/skill_diagnostic_helper.py collect-context "<目標_skill_目錄>"
python scripts/skill_diagnostic_helper.py check-claims --source "這是我週末做的小工具，完全不收費。" --output "這是我週末做的小工具，可以免費使用。"
python scripts/skill_diagnostic_helper.py test-polarity
python -m unittest discover -s tests -v
```

- `collect-context` 的 `linked_references` 只包含主檔直接連結的現存檔案。`unlinked_support_files` 可能包含次層指南或命令列提及的腳本；缺失連結需自行核對。Agent 仍須按引用檔所在目錄逐層補讀。
- `has_concrete_examples`、`concrete_boundaries` 等欄位是關鍵詞命中線索，不能證明判準完整、範例品質或行為正確。
- `check-claims` 只初篩有限句式的費用與公開狀態。`passed` 只在 `status: verified` 時為真；`contradicted` 表示至少一項已辨識矛盾，`needs_review` 表示需複核。用 `verified_alignments` 的 `output_claim` 與 `source_clause` 查證支持關係，不能把通過當成所有事實已驗證。

## 診斷行為評測

[評測協議](tests/evaluation/PROTOCOL.md) 提供八組回歸案例、隔離輸入與評分的方式，以及新舊版比較程序。案例涵蓋規則衝突、工具落差、次層缺件、失敗分支、範例不足、反證排誤、零發現及多個獨立缺陷。

評測案例與評分依據分開存放，不能一起交給診斷者。公開案例是回歸資料；真正的保留驗收案例須在修改完成後由未參與修改的評測者選定並封存。Python 單元測試通過只代表輔助工具回歸通過，不能證明診斷能力已提升。

## 使用範例

- 「用 skill-evolution 檢查這個 skill，有哪些需要修正的問題？先不要改檔。」
- 「幫我優化這個 skill，保留原本的確認流程，修改後執行相關驗證。」
- 「依這份已確認的診斷修好目標 skill，列出實際修改與未驗證的部分。」

## 套件結構

```text
skill-evolution/
├── SKILL.md
├── README.md
├── references/diagnostic_rubric.md
├── scripts/skill_diagnostic_helper.py
└── tests/
    ├── testclaims.py
    └── evaluation/
        ├── PROTOCOL.md
        ├── cases/              # 只把選定案例交給診斷者
        └── grading/            # 評分者專用，不提供給診斷者
```


