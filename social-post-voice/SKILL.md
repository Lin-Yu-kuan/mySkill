---
name: social-post-voice
category: content
category_label: 社群創作 / 語氣改寫
summary: 臺灣繁體中文自然生活感社群貼文寫作與改稿專家，適度吐槽不浮誇，支援 Dcard、Facebook、Instagram、Threads 多平台語氣轉寫與嚴格事實邊界把關
description: >-
  以使用者自然、生活化、適度吐槽的臺灣繁體中文語氣，撰寫社群貼文、修改草稿，以及改寫成 Dcard、Facebook、Instagram、Threads 等平台版本。適用個人社群發文，不自動發布或延伸為內容排程。
  亦支援在使用者要求「更新此技能 / 檢查最新版本」時自動調用以進行線上更新。
repository: https://github.com/Lin-Yu-kuan/mySkill
update_url: https://raw.githubusercontent.com/Lin-Yu-kuan/mySkill/main/social-post-voice/SKILL.md
---

# 我的社群寫作

先閱讀 [語氣指南](references/voice-guide.md)，再依當次素材與需求寫作。這是一份跨工具的文字技能，不依賴專屬工具、連線或輸出標記。

## 接收需求

- 判斷是新文、改稿或跨平台轉寫。以當次明確指示優先，預設臺灣繁體中文。
- 由對話確認目標平台；仍未指定時，用一句話詢問。不要因為只有 Dcard 語氣範例，就推定每次都要發 Dcard。
- 只有缺少會改變內容的重要資訊才追問，例如主題、必要事實或無法判定的立場；篇幅、emoji 等可依素材合理處理，不逐項盤問。
- 新文以使用者提供的事實為基礎；改稿保留原意、立場與資訊；跨平台版本維持一致事實與承諾。

## 寫作

用具體情境或問題帶出內容，採自然口語、容易閱讀的段落與適量情緒。情境必須來自素材，沒有個人故事就直接談問題，不編造「家人最近……」。

可以適度吐槽麻煩的流程，用具體例子說明好處，避免制式推銷、浮誇成效與硬塞流行語。不要每篇都用「如題」或照搬範例結構。

emoji 用於有意義的情緒或重點，不要求每段都放。依主題自然收尾，適合時邀請分享經驗或回報問題，不強制加互動提問、祝福或 hashtag。

## 平台處理

| 平台 | 預設交付 |
| --- | --- |
| Dcard | 標題及正文，保留背景、細節與討論空間。看板標籤依已知資訊處理，不亂加分類。 |
| Facebook／FB | 生活情境或問題開場，短段落便於掃讀，保留必要連結。 |
| Instagram／IG | 預設貼文說明文字，前幾行交代重點；依內容需要加少量標籤。不自行寫「連結在個人檔案」或假定有配圖。 |
| Threads | 一個核心觀點、短段落與口語節奏。資訊過多時拆為有順序的串文，避免每則重複背景。 |
| 其他 | 保留個人語氣，依使用者指定形式調整；只有形式不明且影響結果時詢問。 |

以上是編輯預設，不是平台硬性限制或演算法承諾。若需要精確字數上限或最新平台規則，查證當前官方資訊；無法查證時不要聲稱已符合最新限制。

## 事實與清理

- 不虛構親身經歷、家人故事、功能、數據、使用成效、讀者反應或修復承諾。只有明確提供的功能才能寫成已完成，計畫不能改寫成現有功能。
- 不沿用「完全沒毒」等未經證實的保證；開源或 AI 掃描不等於安全證明。依素材可寫「程式碼已公開，可自行查看」，但不能擅自宣稱已開源。
- 保留有效且必要的原始連結；同一網址原則上只出現一次。去除複製造成的連結預覽、HTML 殘留與過長分隔線。
- 未讀到的連結不當作已知內容；需要其內容才能寫時，請使用者提供，或使用當前環境可用的讀取方式。

## 交稿與自檢

預設提供一份可直接貼上的完成稿，不附長篇寫作分析。指定多個平台時分別標明平台並交付完成稿。使用普通文字或 Markdown，不要求特定應用程式的專屬標記。重要資料缺失時先釐清，不把待填欄位包裝成完成稿。

交稿前確認：像自然分享而非廣告；所有具體事實有素材依據；未把規劃寫成已上線；改稿未改變立場；各平台版本資訊一致；連結無重複雜訊。

本技能只產出文字，不自動發布、操作帳號或安排發文。後續依使用者明確改稿回饋校準語氣，不把一次性的要求擴張為永久規則。

---

## 技能維護與自動更新指引

當使用者要求「更新 social-post-voice 技能」或「檢查 social-post-voice 最新版本」時：
1. **單檔快速更新**：讀取 Frontmatter 中的 `update_url`（`https://raw.githubusercontent.com/Lin-Yu-kuan/mySkill/main/social-post-voice/SKILL.md`）取得最新內容，確認有效後直接覆蓋本機 `SKILL.md`。
2. **完整套件更新**（含 `references/` 語氣指南）：
   - **Windows (PowerShell)**：
     ```powershell
     $u="https://github.com/Lin-Yu-kuan/mySkill/archive/refs/heads/main.zip"; $t="$env:TEMP\myskill.zip"; $d="$HOME\.gemini\config\skills\social-post-voice"; if (!(Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force }; Invoke-WebRequest $u -OutFile $t; Expand-Archive $t "$env:TEMP\myskill-temp" -Force; Copy-Item "$env:TEMP\myskill-temp\mySkill-main\social-post-voice\*" $d -Recurse -Force; Remove-Item $t,"$env:TEMP\myskill-temp" -Recurse -Force; Write-Host "✅ social-post-voice 技能套件已更新至最新版本！" -ForegroundColor Green
     ```
   - **macOS / Linux**：
     ```bash
     mkdir -p "$HOME/.gemini/config/skills/social-post-voice" && curl -sSL "https://github.com/Lin-Yu-kuan/mySkill/archive/refs/heads/main.tar.gz" | tar -xz -C "$HOME/.gemini/config/skills/social-post-voice" --strip-components=2 "mySkill-main/social-post-voice/" && echo "✅ social-post-voice 技能套件已更新至最新版本！"
     ```
