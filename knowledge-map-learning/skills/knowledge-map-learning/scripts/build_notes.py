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

from notes_markdown import render as parse_markdown_to_sections

HTML_TEMPLATE = r"""<!DOCTYPE html>
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
mark.current {{ background: #fb923c; color: #111; }}
.table-wrap {{ overflow-x: auto; }}
table {{ border-collapse: collapse; width: 100%; margin: 16px 0; }}
th, td {{ border: 1px solid var(--border); padding: 8px; text-align: left; }}
ol {{ padding-left: 24px; }}
@media (max-width: 760px) {{
    body {{ display: block; }}
    #sidebar {{ position: static; width: 100%; max-height: 40vh; }}
    #main-content {{ margin-left: 0; padding: 20px; min-width: 0; }}
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
        <div><button type="button" onclick="selectMatch(-1)" aria-label="上一個結果">▲</button>
        <output id="search-count" aria-live="polite">0 / 0</output>
        <button type="button" onclick="selectMatch(1)" aria-label="下一個結果">▼</button></div>
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

// Theme storage may be unavailable for local files.
function toggleTheme() {{
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {{ localStorage.setItem('theme', next); }} catch (_) {{}}
}}
let theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
try {{ theme = localStorage.getItem('theme') || theme; }} catch (_) {{}}
document.documentElement.dataset.theme = theme;

const content = document.getElementById('main-content');
let matches = [], current = -1;
function selectMatch(step) {{
    if (!matches.length) return;
    if (current >= 0) matches[current].classList.remove('current');
    current = (current + step + matches.length) % matches.length;
    const target = matches[current];
    target.classList.add('current');
    for (let parent = target.parentElement; parent; parent = parent.parentElement) {{
        if (parent.tagName === 'DETAILS') parent.open = true;
    }}
    target.scrollIntoView({{block:'center', behavior:'smooth'}});
    document.getElementById('search-count').textContent = `${{current + 1}} / ${{matches.length}}`;
}}
function handleSearch(query) {{
    content.querySelectorAll('mark.search-match').forEach(mark => mark.replaceWith(document.createTextNode(mark.textContent)));
    content.normalize();
    matches = []; current = -1;
    document.getElementById('search-count').textContent = '0 / 0';
    if (!query.trim()) return;
    const escaped = query.trim().replace(/[.*+?^${{}}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(escaped, 'giu');
    const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT, {{
        acceptNode(node) {{ return node.parentElement.closest('script,style,button') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; }}
    }});
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {{
        const text = node.nodeValue;
        const hits = [...text.matchAll(pattern)];
        if (!hits.length) continue;
        const fragment = document.createDocumentFragment();
        let end = 0;
        for (const hit of hits) {{
            fragment.append(document.createTextNode(text.slice(end, hit.index)));
            const mark = document.createElement('mark');
            mark.className = 'search-match'; mark.textContent = hit[0];
            fragment.append(mark); matches.push(mark);
            end = hit.index + hit[0].length;
        }}
        fragment.append(document.createTextNode(text.slice(end)));
        node.replaceWith(fragment);
    }}
    selectMatch(1);
}}
document.getElementById('search-input').addEventListener('keydown', event => {{
    if (event.key === 'Enter') {{ event.preventDefault(); selectMatch(event.shiftKey ? -1 : 1); }}
    if (event.key === 'Escape') {{ event.target.value = ''; handleSearch(''); }}
}});
const sections = [...content.querySelectorAll('h3[id]')];
const links = [...document.querySelectorAll('.nav-item')];
function updateNavigation() {{
    let active = sections[0];
    for (const heading of sections) {{ if (heading.getBoundingClientRect().top <= 100) active = heading; }}
    links.forEach(link => {{
        const selected = !!active && link.getAttribute('href') === '#' + active.id;
        link.classList.toggle('active', selected);
        if (selected) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    }});
}}
window.addEventListener('scroll', updateNavigation, {{passive:true}});
updateNavigation();
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
        nav_links.append(f'<a href="#{h["id"]}" class="nav-item">{html.escape(h["title"])}</a>')
    nav_html = '\n'.join(nav_links)

    # 注入模板
    full_html = HTML_TEMPLATE.format(
        TITLE=html.escape(title),
        NAV_ITEMS=nav_html,
        BODY_CONTENT=body_html
    )

    if Path(output_html_path).resolve() == md_path:
        raise ValueError("輸出路徑不可覆蓋來源 Markdown")
    import tempfile
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=output_html_path.parent, suffix=".tmp", delete=False) as stream:
            temp_path = Path(stream.name)
            stream.write(full_html)
        os.replace(temp_path, output_html_path)
    finally:
        if temp_path is not None:
            temp_path.unlink(missing_ok=True)
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
    try:
        success = build_notes(in_file, out_file)
    except (OSError, ValueError) as error:
        print(f"匯出失敗：{error}；來源 Markdown 保留。", file=sys.stderr)
        sys.exit(1)
    sys.exit(0 if success else 1)
