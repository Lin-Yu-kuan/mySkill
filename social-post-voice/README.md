# ✍️ 個人自然感社群貼文寫作與改稿專家 (`social-post-voice`)

> 以自然、生活化、適度吐槽卻不失焦點的**臺灣繁體中文個人分享語氣**，協助撰寫社群貼文、修改草稿，並精準改寫為 **Dcard、Facebook、Instagram、Threads** 等平台版本。拒絕濃烈 AI 業配腔與虛構故事，嚴格守住事實邊界。

[![Antigravity Skill](https://img.shields.io/badge/Antigravity-Skill-purple.svg)](https://antigravity.google)
[![Platforms](https://img.shields.io/badge/Platforms-Dcard%20%7C%20FB%20%7C%20IG%20%7C%20Threads-blue.svg)]()
[![Language](https://img.shields.io/badge/Language-繁體中文%20(臺灣)-brightgreen.svg)]()

---

## 💡 為什麼需要這個 Skill？

一般請 AI 寫社群貼文時，最常遇到的四大災難：
- **濃濃的廣告業配腔**：動輒「最強神器」、「效率翻倍」、「還在為 X 煩惱嗎？」，一看就像罐頭推銷文。
- **憑空捏造背景故事**：沒提到的家人、朋友、用戶回饋與使用數據被 AI 自己腦補出來。
- **把「未來規劃」寫成「已上線功能」**：開發中的想法被 AI 包裝成現成功能，造成讀者誤解。
- **各平台千篇一律**：不管發 Dcard 還是 Threads 都長得一模一樣，甚至每段狂塞 emoji 與制式 Hashtag。

`social-post-voice` 內建 **[個人語氣指南 (`references/voice-guide.md`)](./references/voice-guide.md)**，讓 AI 像真實開發者或創作者與同好交流一樣自然說話！

---

## 🚀 Antigravity 一鍵安裝方式

使用者**完全不需要事先手動下載或解壓縮整個 GitHub 專案**！請根據您的系統環境選擇最方便的安裝方式：

### 🌐 方式一：免下載！Windows (PowerShell) 雲端一行直裝（推薦）
開啟 PowerShell，複製貼上以下單行指令並按 Enter，即可直接從 GitHub 雲端安裝本技能及其語氣指南至 Antigravity 全域目錄：

```powershell
$u="https://github.com/Lin-Yu-kuan/mySkill/archive/refs/heads/main.zip"; $t="$env:TEMP\myskill.zip"; $d="$HOME\.gemini\config\skills\social-post-voice"; if (!(Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force }; Invoke-WebRequest $u -OutFile $t; Expand-Archive $t "$env:TEMP\myskill-temp" -Force; Copy-Item "$env:TEMP\myskill-temp\mySkill-main\social-post-voice\*" $d -Recurse -Force; Remove-Item $t,"$env:TEMP\myskill-temp" -Recurse -Force; Write-Host "✅ social-post-voice 技能套件已成功安裝！" -ForegroundColor Green
```

---

### 🍎 方式二：免下載！macOS / Linux 雲端一行直裝
開啟終端機（Terminal），貼上以下指令直接串流提取安裝：

```bash
mkdir -p "$HOME/.gemini/config/skills/social-post-voice" && curl -sSL "https://github.com/Lin-Yu-kuan/mySkill/archive/refs/heads/main.tar.gz" | tar -xz -C "$HOME/.gemini/config/skills/social-post-voice" --strip-components=2 "mySkill-main/social-post-voice/" && echo "✅ social-post-voice 技能套件已成功安裝！"
```

---

### 💬 方式三：免開終端機！Antigravity 聊天框「自然語言安裝」
如果您正在使用 Antigravity IDE 或 CLI，連終端機都不需要開，直接在對話框貼上這句話交給 Agent：

> 「請幫我從 GitHub 倉庫 (`https://github.com/Lin-Yu-kuan/mySkill`) 將 `social-post-voice` 技能套件（含 `SKILL.md` 與 `references/` 目錄）下載並安裝到我的 Antigravity 全域技能目錄 (`~/.gemini/config/skills/social-post-voice`)。」

---

### 💻 方式四：本機維護者軟連結（Symlink，修改即時生效）
如果您已將 `mySkill` 倉庫 Clone 至本機並進行開發維護，推薦建立符號連結。日後在原目錄微調語氣指南，Antigravity 會**即刻同步生效**：

```powershell
# 請在 mySkill/social-post-voice 目錄下執行（需管理員權限或開啟 Windows 開發人員模式）
New-Item -ItemType SymbolicLink -Path "$HOME\.gemini\config\skills\social-post-voice" -Target (Get-Location).Path -Force
```

---

### 📁 方式五：已 Clone 完整倉庫者的本地複製方式
如果您已經將整個 `mySkill` 倉庫 Clone 到本機，亦可直接以本地檔案複製安裝：

- **Windows (PowerShell)**：
  ```powershell
  Copy-Item -Path ".\social-post-voice" -Destination "$HOME\.gemini\config\skills\social-post-voice" -Recurse -Force
  ```
- **macOS / Linux**：
  ```bash
  cp -r ./social-post-voice "$HOME/.gemini/config/skills/social-post-voice"
  ```

---

## ✨ 四大核心寫作原則

1. **🗣️ 自然分享感，適度吐槽不失焦**  
   先交代為何在意或遇到什麼麻煩，再說怎麼解決；吐槽只針對操作痛點（如「點到懷疑人生」），好處一定連回具體省下的步驟。
2. **📱 跨平台原生節奏適配**  
   - **Dcard**：完整標題與正文，保留背景脈絡與討論空間。
   - **Facebook**：近況或問題開場，短段落便於掃讀。
   - **Instagram**：前幾行交代核心重點，不亂假定有配圖或強加個人檔案連結。
   - **Threads**：聚焦單一核心觀點與口語節奏，短素材不硬拆串文。
3. **🛡️ 嚴格事實與狀態邊界**  
   不虛構親身經歷、家人故事、使用數據或安全保證；嚴格區分「已上線功能」與「未來規劃」，絕不跨界吹噓。
4. **🧹 自動清理複製雜訊**  
   自動去除重複網址、HTML 殘留與過長分隔線，直接交付乾淨可貼上的完稿。

---

## 🔄 智慧無感更新（已安裝者）

若想將本技能更新至 GitHub 最新版本，只需在 Antigravity 對話框輸入：
> 「幫我更新 `social-post-voice` 技能」或「檢查 `social-post-voice` 最新版本」

