"""Escaped Markdown subset for learning notes; raw HTML is always literal text.

Supports headings, fenced code, nested lists (2+ spaces), pipe tables,
quotes, paragraphs, emphasis, inline code and safe links. Not CommonMark.
"""
import html
import re
from urllib.parse import urlsplit


def inline(text):
    pattern = r'(`+)(.+?)\1|\[([^\]]+)\]\(([^\s)]+)\)|\*\*(.+?)\*\*|\*([^*]+)\*'
    result, end = [], 0
    for m in re.finditer(pattern, text):
        result.append(html.escape(text[end:m.start()]))
        if m.group(1):
            result.append('<code>' + html.escape(m.group(2)) + '</code>')
        elif m.group(3) is not None:
            label, url = m.group(3), m.group(4)
            scheme = urlsplit(url).scheme.lower()
            if scheme in ('', 'https', 'http', 'mailto') and not url.startswith(('//', '\\')):
                result.append('<a href="' + html.escape(url, quote=True) + '">' + html.escape(label) + '</a>')
            else:
                result.append(html.escape(m.group(0)))
        else:
            tag = 'strong' if m.group(5) is not None else 'em'
            result.append(f'<{tag}>' + html.escape(m.group(5) or m.group(6)) + f'</{tag}>')
        end = m.end()
    result.append(html.escape(text[end:]))
    return ''.join(result)


def cells(line):
    return [x.strip().replace('\\|', '|') for x in re.split(r'(?<!\\)\|', line.strip().strip('|'))]


def render(markdown):
    headings = []
    title = '主題研讀手冊'
    title_found = False
    def blocks(lines):
        nonlocal title, title_found
        out, i = [], 0
        while i < len(lines):
            line = lines[i]
            if not line.strip():
                i += 1
                continue
            fence = re.match(r'^\s*(`{3,}|~{3,})(.*)$', line)
            if fence:
                marker, info = fence.groups()
                code = []
                i += 1
                while i < len(lines) and not re.fullmatch(r'\s*' + re.escape(marker[0]) + '{' + str(len(marker)) + r',}\s*', lines[i]):
                    code.append(lines[i])
                    i += 1
                i += 1
                out.append('<pre><code>' + html.escape('\n'.join(code)) + '</code></pre>')
                continue
            heading = re.match(r'^(#{1,6})\s+(.+)$', line)
            if heading:
                level, label = len(heading[1]), heading[2]
                if level == 1 and not title_found:
                    title, title_found = label, True
                anchor = ''
                if level == 3:
                    ident = f'section-{len(headings) + 1}'
                    headings.append({'title': label, 'id': ident})
                    anchor = f' id="{ident}"'
                out.append(f'<h{level}{anchor}>{inline(label)}</h{level}>')
                i += 1
                continue
            if i + 1 < len(lines) and '|' in line and all(re.fullmatch(r':?-{3,}:?', c) for c in cells(lines[i + 1])):
                headers = cells(line)
                out.append('<div class="table-wrap"><table><thead><tr>' + ''.join('<th>' + inline(c) + '</th>' for c in headers) + '</tr></thead><tbody>')
                i += 2
                while i < len(lines) and '|' in lines[i] and lines[i].strip():
                    row = cells(lines[i])
                    out.append('<tr>' + ''.join('<td>' + inline(c) + '</td>' for c in row) + '</tr>')
                    i += 1
                out.append('</tbody></table></div>')
                continue
            item = re.match(r'^( *)([-+*]|\d+[.)])\s+(.*)$', line)
            if item:
                indent = len(item[1])
                ordered = item[2][0].isdigit()
                tag = 'ol' if ordered else 'ul'
                out.append(f'<{tag}>')
                while i < len(lines):
                    match = re.match(r'^( *)([-+*]|\d+[.)])\s+(.*)$', lines[i])
                    if not match or len(match[1]) != indent or match[2][0].isdigit() != ordered:
                        break
                    content = [match[3]]
                    i += 1
                    while i < len(lines):
                        nxt = lines[i]
                        if not nxt.strip():
                            if i + 1 < len(lines) and len(lines[i + 1]) - len(lines[i + 1].lstrip()) > indent:
                                content.append('')
                                i += 1
                                continue
                            break
                        spaces = len(nxt) - len(nxt.lstrip())
                        if spaces <= indent:
                            break
                        content.append(nxt[min(spaces, indent + 2):])
                        i += 1
                    out.append('<li>' + blocks(content) + '</li>')
                out.append(f'</{tag}>')
                continue
            if line.startswith('>'):
                quoted = []
                while i < len(lines) and lines[i].startswith('>'):
                    quoted.append(re.sub(r'^> ?', '', lines[i]))
                    i += 1
                out.append('<blockquote>' + blocks(quoted) + '</blockquote>')
                continue
            if re.fullmatch(r'\s*(---+|\*\*\*+)\s*', line):
                out.append('<hr>')
                i += 1
                continue
            paragraph = [line]
            i += 1
            while i < len(lines) and lines[i].strip():
                if re.match(r'^(#{1,6}\s|\s*```|\s*~~~|>|\s*[-+*]\s|\s*\d+[.)]\s)', lines[i]):
                    break
                if i + 1 < len(lines) and '|' in lines[i] and all(re.fullmatch(r':?-{3,}:?', c) for c in cells(lines[i + 1])):
                    break
                paragraph.append(lines[i])
                i += 1
            out.append('<p>' + '<br>\n'.join(inline(p) for p in paragraph) + '</p>')
        return '\n'.join(out)
    body = blocks(markdown.splitlines())
    return title, headings, body
