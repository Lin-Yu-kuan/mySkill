#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_notes.py - 知識地圖學習手冊 HTML 組裝編譯器
完全使用 Python 標準庫，零外部依賴。
功能：讀取實體 Markdown 筆記，注入單一檔案自包含 HTML 模板（含即時搜尋、Scrollspy、深淺色主題、列印 Print CSS）。
"""

import sys
import os
import re
import html
from pathlib import Path

# 確保在 Windows 或不同終端下以 UTF-8 輸出
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

def parse_markdown_to_sections(md_text):
    """
    輕量解析 Markdown 結構，提取章節標題、模組與內文，供 Sidebar 目錄與主內容渲染。
    """
    lines = md_text.splitlines()
    title = "主題研讀手冊"
    for line in lines:
        if line.startswith("# "):
            title = line[2:].strip()
            break

    # 將 Markdown 簡易轉為 HTML（標準語法轉換）
    def md_to_html(text):
        # 程式碼區塊
        code_blocks = []
        def save_code_block(match):
            lang = match.group(1) or ""
            code = html.escape(match.group(2))
            idx = len(code_blocks)
            code_blocks.append(f'<pre><code class="language-{lang}">{code}</code></pre>')
            return f'___CODE_BLOCK_{idx}___'
        
        text = re.sub(r'```([a-zA-Z0-9_\-]*)\n([\s\S]*?)```', save_code_block, text)

        # 標題
        text = re.sub(r'^#### (.*?)$', r'<h4>\1</h4>', text, flags=re.MULTILINE)
        text = re.sub(r'^### (.*?)$', r'<h3 id="\1">\1</h3>', text, flags=re.MULTILINE)
        text = re.sub(r'^## (.*?)$', r'<h2>\1</h2>', text, flags=re.MULTILINE)
        text = re.sub(r'^# (.*?)$', r'<h1>\1</h1>', text, flags=re.MULTILINE)

        # 引用
        text = re.sub(r'^> (.*?)$', r'<blockquote>\1</blockquote>', text, flags=re.MULTILINE)

        # 粗體與行內程式碼
        text = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', text)
        text = re.sub(r'`(.*?)`', r'<code>\1</code>', text)

        # 清單
        text = re.sub(r'^- (.*?)$', r'<li>\1</li>', text, flags=re.MULTILINE)

        # 段落換行
        paragraphs = text.split('\n\n')
        processed_p = []
        for p in paragraphs:
            p_strip = p.strip()
            if not p_strip:
                continue
            if p_strip.startswith('<h') or p_strip.startswith('<pre') or p_strip.startswith('<blockquote') or p_strip.startswith('<li>'):
                processed_p.append(p_strip)
            elif '___CODE_BLOCK_' in p_strip:
                processed_p.append(p_strip)
            else:
                p_html = p_strip.replace('\n', '<br>')
                processed_p.append(f'<p>{p_html}</p>')

        final_html = '\n'.join(processed_p)

        # 還原程式碼區塊
        for idx, block in enumerate(code_blocks):
            final_html = final_html.replace(f'___CODE_BLOCK_{idx}___', block)

        return final_html

    body_html = md_to_html(md_text)

    # 提取目錄項目 (H3 節點標題，如 M1-1 節點名稱)
    headings = []
    for line in lines:
        if line.startswith("### "):
            h_text = line[4:].strip()
            # 建立 slug id
            slug = re.sub(r'[^\w\-一-龥]', '-', h_text)
            headings.append({"title": h_text, "id": slug})

    return title, headings, body_html

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{TITLE}</title>
<style>
:root {{
    --bg-main: #f8fafc;
    --bg-card: #ffffff;
    --text-primary: #0f172a;
    --text-secondary: #475569;
    --border: #e2e8f0;
    --accent: #2563eb;
    --accent-light: #dbeafe;
    --code-bg: #1e293b;
    --code-color: #f8fafc;
    --sidebar-w: 280px;
}}

[data-theme="dark"] {{
    --bg-main: #0b0f19;
    --bg-card: #131b2e;
    --text-primary: #f1f5f9;
    --text-secondary: #94a3b8;
    --border: #1e293b;
    --accent: #3b82f6;
    --accent-light: #1e3a8a;
    --code-bg: #030712;
    --code-color: #e2e8f0;
}}

* {{ box-sizing: border-box; margin: 0; padding: 0; }}
body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    background: var(--bg-main);
    color: var(--text-primary);
    line-height: 1.7;
    display: flex;
    min-height: 100vh;
}}

/* 頂部閱讀進度條 */
#reading-progress {{
    position: fixed;
    top: 0;
    left: 0;
    height: 3px;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    width: 0%;
    z-index: 9999;
    transition: width 0.1s;
}}

/* 側邊欄 */
#sidebar {{
    width: var(--sidebar-w);
    background: var(--bg-card);
    border-right: 1px solid var(--border);
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    display: flex;
    flex-direction: column;
    z-index: 100;
}}

.sidebar-header {{
    padding: 18px;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
}}

.sidebar-header h2 {{
    font-size: 1rem;
    font-weight: 700;
    color: var(--accent);
}}

.search-box {{
    padding: 12px 18px;
    border-bottom: 1px solid var(--border);
}}

.search-box input {{
    width: 100%;
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: var(--bg-main);
    color: var(--text-primary);
    outline: none;
}}

.nav-tree {{
    flex: 1;
    overflow-y: auto;
    padding: 12px 18px;
}}

.nav-item {{
    display: block;
    padding: 8px 10px;
    margin-bottom: 4px;
    border-radius: 6px;
    color: var(--text-secondary);
    text-decoration: none;
    font-size: 0.9rem;
    transition: all 0.2s;
}}

.nav-item:hover, .nav-item.active {{
    background: var(--accent-light);
    color: var(--accent);
    font-weight: 600;
}}

/* 主內容區 */
#main-content {{
    margin-left: var(--sidebar-w);
    flex: 1;
    padding: 40px 60px;
    max-width: 960px;
}}

h1 {{ font-size: 2rem; margin-bottom: 16px; color: var(--accent); }}
h2 {{ font-size: 1.5rem; margin-top: 32px; margin-bottom: 12px; border-bottom: 2px solid var(--border); padding-bottom: 6px; }}
h3 {{ font-size: 1.25rem; margin-top: 28px; margin-bottom: 10px; color: var(--accent); scroll-margin-top: 40px; }}
h4 {{ font-size: 1.05rem; margin-top: 20px; margin-bottom: 6px; }}
p, li {{ margin-bottom: 12px; font-size: 1.02rem; }}
ul {{ padding-left: 24px; margin-bottom: 16px; }}

blockquote {{
    border-left: 4px solid var(--accent);
    padding: 10px 16px;
    background: var(--accent-light);
    border-radius: 0 6px 6px 0;
    margin: 16px 0;
    font-size: 0.95rem;
}}

pre {{
    background: var(--code-bg);
    color: var(--code-color);
    padding: 14px 18px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 16px 0;
    font-family: Consolas, Monaco, "Courier New", monospace;
    font-size: 0.9rem;
}}

code {{
    background: var(--accent-light);
    color: var(--accent);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.88rem;
    font-family: Consolas, Monaco, monospace;
}}

pre code {{
    background: none;
    color: inherit;
    padding: 0;
}}

/* 搜尋高亮 */
mark.search-match {{
    background: #fef08a;
    color: #854d0e;
    padding: 2px 4px;
    border-radius: 3px;
}}

/* 列印專用 CSS */
@media print {{
    #sidebar, #reading-progress, .theme-toggle {{ display: none !important; }}
    #main-content {{ margin-left: 0 !important; padding: 0 !important; width: 100% !important; max-width: 100% !important; }}
    body {{ background: #fff !important; color: #000 !important; }}
    h1, h2, h3, h4 {{ page-break-after: avoid; }}
    pre, blockquote {{ page-break-inside: avoid; }}
}}
</style>
</head>
<body>
<div id="reading-progress"></div>

<aside id="sidebar">
    <div class="sidebar-header">
        <h2>目錄導航</h2>
        <button class="theme-toggle" onclick="toggleTheme()" style="background:none;border:none;cursor:pointer;font-size:1.2rem;">🌓</button>
    </div>
    <div class="search-box">
        <input type="text" id="search-input" placeholder="內文即時搜尋..." oninput="handleSearch(this.value)">
    </div>
    <nav class="nav-tree" id="nav-tree">
        {NAV_ITEMS}
    </nav>
</aside>

<main id="main-content">
    {BODY_CONTENT}
</main>

<script>
// 閱讀進度條
window.addEventListener('scroll', () => {{
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const progress = total > 0 ? (window.pageYOffset / total) * 100 : 0;
    document.getElementById('reading-progress').style.width = progress + '%';
}});

// 深淺色主題
function toggleTheme() {{
    const current = document.documentElement.getAttribute('data-theme');
    const target = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', target);
    localStorage.setItem('theme', target);
}}
if (localStorage.getItem('theme') === 'dark') {{
    document.documentElement.setAttribute('data-theme', 'dark');
}}

// 簡易內文高亮搜尋
function handleSearch(query) {{
    query = query.trim().toLowerCase();
    const content = document.getElementById('main-content');
    // 清除舊標記
    const marks = content.querySelectorAll('mark.search-match');
    marks.forEach(m => {{
        m.replaceWith(document.createTextNode(m.textContent));
    }});
    if (!query) return;

    function walk(node) {{
        if (node.nodeType === 3) {{
            const val = node.nodeValue;
            const idx = val.toLowerCase().indexOf(query);
            if (idx >= 0) {{
                const span = document.createElement('span');
                span.innerHTML = val.substring(0, idx) + 
                    '<mark class="search-match">' + val.substring(idx, idx + query.length) + '</mark>' + 
                    val.substring(idx + query.length);
                node.parentNode.replaceChild(span, node);
            }}
        }} else if (node.nodeType === 1 && node.childNodes && !['SCRIPT','STYLE','PRE'].includes(node.tagName)) {{
            Array.from(node.childNodes).forEach(walk);
        }}
    }}
    walk(content);
}}
</script>
</body>
</html>
"""

def build_notes(md_file_path, output_html_path=None):
    md_path = Path(md_file_path).resolve()
    if not md_path.exists():
        print(f"錯誤：找不到 Markdown 檔案: {md_path}", file=sys.stderr)
        return False

    if output_html_path is None:
        output_html_path = md_path.with_name(md_path.stem + "-Interactive-Notes.html")
    else:
        output_html_path = Path(output_html_path).resolve()

    print(f"正在讀取 Markdown 筆記: {md_path}")
    md_text = md_path.read_text(encoding="utf-8")

    title, headings, body_html = parse_markdown_to_sections(md_text)

    # 建立目錄連結
    nav_links = []
    for h in headings:
        nav_links.append(f'<a href="#{html.escape(h["title"])}" class="nav-item">{html.escape(h["title"])}</a>')
    nav_html = '\n'.join(nav_links)

    # 注入模板
    full_html = HTML_TEMPLATE.format(
        TITLE=html.escape(title),
        NAV_ITEMS=nav_html,
        BODY_CONTENT=body_html
    )

    output_html_path.write_text(full_html, encoding="utf-8")
    file_size_kb = output_html_path.stat().st_size / 1024
    print(f"[OK] HTML 手冊組裝完成！")
    print(f"檔案路徑: {output_html_path}")
    print(f"檔案大小: {file_size_kb:.1f} KB，共包含 {len(headings)} 個小節導航。")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法: python build_notes.py <input_markdown_file> [output_html_file]")
        sys.exit(1)
    in_file = sys.argv[1]
    out_file = sys.argv[2] if len(sys.argv) > 2 else None
    success = build_notes(in_file, out_file)
    sys.exit(0 if success else 1)
