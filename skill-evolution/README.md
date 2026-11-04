# 🔬 既有 Skill 唯讀診斷與最小化演進專家 (`skill-evolution`)

> 專為 AI Agent 技能開發者與維護者打造的**高可信度、克制、不套用預設重構模板的唯讀診斷專家**。透過完整追蹤引用鏈、區分「缺少判準 vs. 實測偏移」、以及辨識「語意極性反轉與同義改寫」的事實主張核對機制，在不破壞原有設計與互動契約的前提下，提供精準的最小化演進建議（Minimal Patch）或給出「現有設計已足夠」的安心認證。

[![Antigravity Skill](https://img.shields.io/badge/Antigravity-Skill-purple.svg)](https://antigravity.google)
[![Diagnostic Mode](https://img.shields.io/badge/Mode-唯讀診斷%20%7C%20最小化演進-blue.svg)]()
[![Language](https://img.shields.io/badge/Language-繁體中文%20(臺灣)-brightgreen.svg)]()
[![Python Helper](https://img.shields.io/badge/Helper-Python%203%20Standard%20Lib-orange.svg)]()

---

## 💡 為什麼需要這個 Skill？

當我們請通用 AI 檢查或優化某個既有的 `SKILL.md` 時，經常會遇到過度工程（Over-engineering）與誤診的痛點：
- **未看全貌就誤判「定義模糊」**：許多高品質 Skill 主檔保持精簡，將正反範例與邊界寫在 `references/*.md`。一般 AI 只看 `SKILL.md` 出現「自然口語」、「適度吐槽」，就盲目建議加上「每句不超過 20 字」、「每段最多 1 個 emoji」等死板數字，反而摧毀原有的自然文風。
- **機械式套用大型重構模板**：動輒畫出複雜的多代理並行架構圖、憑空捏造假想的 Token ROI 表格，甚至直接跨越原設計中的「使用者確認點（Human-in-the-loop）」。
- **脆弱的「關鍵詞差集」事實檢查**：用「素材沒出現該詞，輸出就不能出現」來防幻覺，結果**漏掉意思相反的極性反轉**（素材寫「目前沒有免費方案」→ 輸出寫「目前提供免費方案」，因兩邊都有「免費」而被放行），同時**誤擋合理的同義改寫**（素材寫「完全不收費」→ 輸出寫「免費使用」，因素材無「免費」二字而被誤殺）。
- **不敢說「現有設計已足夠」**：為了表現自己有做事，硬挑毛病改壞原本運作良好的規則。

Agent 先讀取引用鏈與腳本，再根據實際缺口提出 **1～2 條最小修正**；已有可用判準時，可直接回報「現有設計足夠」。

---

## 🚀 Antigravity 一鍵安裝方式

使用者**完全不需要事先手動下載或解壓縮整個 GitHub 專案**！請根據您的系統環境選擇最方便的安裝方式：

### 🌐 方式一：免下載！Windows (PowerShell) 雲端一行直裝（推薦）
開啟 PowerShell，複製貼上以下單行指令並按 Enter，即可直接從 GitHub 雲端安裝本技能及其附屬指南與 Python 工具至 Antigravity 全域目錄：

```powershell
$u="https://github.com/Lin-Yu-kuan/mySkill/archive/refs/heads/main.zip"; $t="$env:TEMP\myskill.zip"; $d="$HOME\.gemini\config\skills\skill-evolution"; if (!(Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force }; Invoke-WebRequest $u -OutFile $t; Expand-Archive $t "$env:TEMP\myskill-temp" -Force; Copy-Item "$env:TEMP\myskill-temp\mySkill-main\skill-evolution\*" $d -Recurse -Force; Remove-Item $t,"$env:TEMP\myskill-temp" -Recurse -Force; Write-Host "✅ skill-evolution 技能套件已成功安裝！" -ForegroundColor Green
```

---

### 🍎 方式二：免下載！macOS / Linux 雲端一行直裝
開啟終端機（Terminal），貼上以下指令直接串流提取安裝：

```bash
mkdir -p "$HOME/.gemini/config/skills/skill-evolution" && curl -sSL "https://github.com/Lin-Yu-kuan/mySkill/archive/refs/heads/main.tar.gz" | tar -xz -C "$HOME/.gemini/config/skills/skill-evolution" --strip-components=2 "mySkill-main/skill-evolution/" && echo "✅ skill-evolution 技能套件已成功安裝！"
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

## ✨ 五大核心診斷原則

1. **🛑 唯讀診斷即終點（Read-Only Diagnostic Endpoint）**  
   預設僅執行唯讀檢查，絕不擅自覆寫目標 Skill 檔案；嚴禁未經實測就畫出大型並行架構圖或捏造假想 Token ROI 表。當設計已完善時，直接給出「現有設計已足夠，無需修改」結論。

2. **🔗 強制沿引用鏈讀取完整上下文（Reference-Aware Traversal）**  
   順著 `SKILL.md` 內的相對路徑連結，完整讀取所有被引用的 `references/*.md` 與 `scripts/*`。若引用指南中已包含具體行為邊界與同素材好壞對照範例，即認定為「已有可用判準」，不亂加句長或 emoji 數量等機械限制。

3. **⚖️ 嚴格區分「缺少判準」與「實測偏移」**  
   | 診斷分類 | 判定標準 | 處置策略 |
   |---|---|---|
   | **A. 缺少判準 (Missing Criteria)** | 走完引用鏈後僅有抽象詞，無負向邊界也無正反示例 | 補充 1 組同素材「符合 vs. 不符合」對照或明確負向邊界 |
   | **B. 實測偏移 (Execution Drift)** | 指南已有清楚定義與範例，但面對未見過的新素材（Holdout Set）仍偶爾寫偏 | 保留原判準，僅針對具體失敗漏洞最小補強提示位置或核對步驟 |
   | **C. 現有設計足夠 (Sufficient as-is)** | 已有具體邊界與正反範例，且在新素材上表現穩定 | 明確標示「現有設計足夠，無需修改」並結束 |

4. **🎯 辨識語意極性與同義改寫的事實核對（Polarity- & Entailment-Aware Fact Check）**  
   屏棄脆弱的「關鍵詞差集比對」，將敏感詞表作為提醒信號（Trigger Signals），針對**價格/收費、公開/開源狀態、功能上線進度、安全性承諾**等關鍵主張，核對當次素材原句的三大要素：
   - **肯定／否定極性（Polarity）**：精準攔截「目前沒有免費方案 → 目前提供免費方案」的極性反轉，同時正確放行「完全不收費 → 免費使用」的同義改寫。
   - **時間與實現狀態（Temporality/Modality）**：攔截將「預計下個月開源／規劃中」寫成「已經開源／已上線」的時態越界。
   - **對象與範圍（Scope/Entity）**：防止將範例背景（如「家人考國考」）套用到無關的新題材。

5. **🚧 嚴格的機制採用門檻（Adoption Thresholds）**  
   尊重目標 Skill 的實際任務與互動契約：預設單平台產出的 Skill 不拆四路並行；含有「使用者確認點」（如先確認素材包才渲染成片）的工作流，任何平行化建議都必須保留該確認點。

---

## 🛠️ 內建確定性診斷輔助工具 (`skill_diagnostic_helper.py`)

本技能於 `scripts/skill_diagnostic_helper.py` 內建純 Python 標準函式庫撰寫的輔助腳本（零第三方依賴），提供三大子命令協助診斷與驗收：

```powershell
# 1. 盤點 SKILL.md 第一層直接連結與可能含有判準的行號
python scripts/skill_diagnostic_helper.py collect-context "<目標_skill_目錄路徑>"

# 2. 針對單組輸入素材與模型輸出，核對關鍵主張之肯定/否定極性與實現時態
python scripts/skill_diagnostic_helper.py check-claims --source "這是我週末做的小工具，完全不收費。" --output "這是我週末做的小工具，可以免費使用。"

# 3. 執行內建必考驗收基準測試（對比「單純關鍵詞差集」與「極性與時態感知核對」）
python scripts/skill_diagnostic_helper.py test-polarity
```

**如何解讀盤點結果**　`linked_references` 只包含主檔直接連結的現存檔案。`unlinked_support_files` 也可能是次層指南，或是命令列、純文字提及的腳本。Agent 須沿引用逐層補讀並查看腳本行為；遇到缺件時，記錄來源、路徑及無法查證的判準。

**如何解讀主張核對結果**　`passed` 只在 `status` 為 `verified` 時為真。`verified_alignments` 的 `output_claim` 和 `source_clause` 分別列出輸出主張與素材支持句。舊呼叫端收到 `passed: false` 時，讀取 `status` 區分 `contradicted`（至少一項明確矛盾）與 `needs_review`（證據不足、對象不明或超出規則範圍）。混合結果仍保留逐項證據，供 Agent 複核。

### 📊 內建驗收測例（節錄主張）

維護者可在技能目錄執行 `python -m unittest discover -s tests -v`，重測 CLI 的狀態、輸出主張與素材支持句。

表中節錄費用或公開狀態子句。`test-polarity` 的完整輸入包含作用對象；單獨輸入省略對象的子句，可能得到 `needs_review`。

| 測試案例 | 當次輸入素材 | 待檢核輸出稿 | 單純關鍵詞差集結果 | 極性與語意核對結果（本技能標準） |
|---|---|---|---|---|
| **案例 1：詞一樣、意思相反（極性反轉）** | `「目前沒有免費方案，採訂閱制。」` | `「目前提供免費方案，歡迎試用！」` | ❌ **錯誤放行**<br/>（兩邊皆含「免費」） | ✅ **判定矛盾**<br/>（否定極性翻轉為肯定極性） |
| **案例 2：詞不同、意思相同（同義改寫）** | `「這是我週末做的小工具，完全不收費。」` | `「這是我週末做的小工具，可以免費使用。」` | ❌ **錯誤攔截**<br/>（素材無「免費」二字） | ✅ **正確放行**<br/>（同屬零費用肯定極性） |
| **案例 3：時態與實現狀態越界** | `「預計下個月整理好之後開源。」` | `「程式碼已經開源，歡迎下載！」` | ❌ **錯誤放行**<br/>（兩邊皆含「開源」） | ✅ **精準攔截**<br/>（未來規劃改寫為已實現狀態） |

---

## 📋 標準四欄式唯讀診斷交付格式

每次診斷完成後，Agent 會先列出目標 Skill **「現有設計已足夠、不應改動」**的既有保護機制，接著以標準四欄表格交付具體缺口（若存在）並直接結束任務：

| 原文位置 | 會受影響的使用情境 | 最小修正建議 | 驗收方式（含未見過素材之正反測例） |
| :--- | :--- | :--- | :--- |
| 標註具體檔案與行號連結 | 具體說明何種輸入素材與輸出會出錯 | 僅提出最小、不破壞原架構的修改（或註明「現有設計足夠」） | 列出具體 Holdout 測試素材與預期結果（先比任務完成率、事實正確與語氣偏好，再比成本） |

---

## 💬 觸發方式與使用範例

安裝完成後，在 Antigravity 對話框中指定想要檢查的 Skill 即可自然觸發：

* *「請幫我用 `skill-evolution` 對 `@[social-post-voice]` 進行唯讀診斷，看看有沒有需要補強的邊界？」*
* *「幫我檢查並評估 `universal-animator` 這個 Skill 有沒有可以優化的地方，注意不要破壞它原本的確認流程。」*
* *「請診斷我寫的這個新 Skill，檢查它的事實查核規則會不會漏掉否定句或誤殺同義詞。」*

---

## 📂 檔案目錄結構

```text
skill-evolution/
├── SKILL.md                              # 核心技能定義、唯讀診斷與版本維護指引
├── README.md                             # 技能完整說明文件與 Antigravity 一鍵安裝指南（當前檔案）
├── references/
│   └── diagnostic_rubric.md              # 唯讀診斷判準指南（含極性核對測例、演化機制採用門檻與 Holdout 驗收原則）
├── tests/
│   └── testclaims.py                     # 主張核對 CLI 回歸測試
└── scripts/
    └── skill_diagnostic_helper.py        # 第一層引用盤點與主張核對 CLI 工具（純 Python 標準庫）
```

