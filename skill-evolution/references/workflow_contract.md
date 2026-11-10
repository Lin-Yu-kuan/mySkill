# 獨立工作流格式 v1

新專案含 workflow.py（固定版本引擎）、workflow.json、handlers.py、conversion.json、source-manifest.json、tests 與操作文件。執行僅需 Python 3.10+；領域額外依賴另列 requirements.txt。

workflow.json：

```json
{
  "version": 1,
  "steps": [
    {"id": "outline", "kind": "ai", "needs": [], "prompt": "依據輸入建立大綱", "validator": "validate_outline"},
    {"id": "render", "kind": "local", "needs": ["outline"], "handler": "render_document", "validator": "validate_document"}
  ]
}
```

步驟 ID 只含英數、底線及連字號；依賴必須先列出，不可循環。種類為 local、ai、human。ai/human 必須有 prompt；local 必須有 handler；每步都必須有 validator。

workflow.json 可有 `code_files` 相對路徑陣列；列出 handlers 另外使用的腳本、範本與設定檔，讓變更參與失效判定。所有影響輸出的額外程式／資源必須登錄；引擎不會自動分析 Python import 鏈。

handlers.py 中同步函式：

- `handler(context, output_dir) -> dict`：context 包含 inputs、dependencies、config、evidence；output_dir 為當次嘗試的獨立目錄，只能在此產生檔案。輸出使用相對 run-dir 路徑引用自己的產物。
- `validator(data, context, run_dir) -> None`：資料不合格 raise ValueError，檢查領域條件與引用，必要時驗證產物存在及內容。不能只 return False，必須明確拋出錯誤。
- validators 與 handlers 是受信任的本機程式，需審查及測試；引擎不是作業系統沙箱。

啟動輸入 JSON 為 `{ "data": {...}, "files": ["已授權輸入檔案路徑"] }`。所有會影響結論的外部檔案必須列在 files，引擎核對 hash；不會自動追蹤藏在 data 文字中的路徑。檔案路徑相對於輸入 JSON 所在目錄解析。

```powershell
python workflow.py start --run-dir "<新的執行目錄>" --inputs "<輸入JSON>"
python workflow.py next --run-dir "<執行目錄>"
python workflow.py submit --run-dir "<執行目錄>" --reply "<JSON回覆>"
python workflow.py retry --run-dir "<執行目錄>" --step "outline"
python workflow.py reopen --run-dir "<執行目錄>" --step "outline" --reason "引用存在但內容需要人工修正"
python workflow.py resume --run-dir "<執行目錄>"
```

next 每次只處理一個就緒步驟；local 在新嘗試目錄執行，ai/human 匯出工作包。AI 回覆為 `{step,input_hash,attempt,data}`；human 額外使用 submit 的 `--human-confirmed`，僅由使用者確認後提供。相同已通過回覆可重送，不重複接受；其他回覆不可覆蓋。

狀態存在 SQLite；每次嘗試與 re-open 理由留存。輸入、步驟規格、handler 模組及依賴結果參與指紋。handler 模組變更保守使所有使用它的步驟失效；輸出檔需列入結果的 `artifacts` 字串陣列，後續驗證 hash，避免默默沿用被修改的檔案。沒有檔案產物時使用空陣列。

每步初次執行加兩次修正共三次，失敗後需 retry 才能再領。reopen 保存歷史並重開指定步驟及必要下游；不能自動繞過停止條件。status/resume 會核對輸入並更新失效狀態。

conversion.json 包含 status（draft/ready）、unresolved 陣列與 requirements 陣列。每項 requirement 至少有 id、source（原套件相對路徑）、locator（章節或行號）、description、steps（步驟 ID 陣列）、verification（驗收方式）。語意要求可以列人工驗收，但不得冒充已通過。
