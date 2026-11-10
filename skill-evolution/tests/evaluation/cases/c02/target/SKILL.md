---
name: text-file-inventory
description: 盤點使用者指定資料夾及所有子資料夾中的文字檔。
---

# Text File Inventory

輸入是一個現存、可讀的資料夾。只處理副檔名為小寫 .txt 的普通檔案；不跟隨符號連結。
執行 python scripts/list_text.py "<輸入資料夾>"，它會列出所有層級的 .txt 檔。
直接交付腳本的 JSON 陣列；不再另做檔案搜尋。空陣列表示整個目錄樹沒有文字檔。
腳本失敗時回報錯誤，不把失敗當空陣列。不修改檔案。
