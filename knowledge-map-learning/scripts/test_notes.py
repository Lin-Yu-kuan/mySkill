import tempfile
import unittest
from pathlib import Path
from build_notes import build_notes, parse_markdown_to_sections


class NotesTests(unittest.TestCase):
    def test_export_preserves_content_and_source(self):
        sample = '''# 測試

### 節點 "引號" <vector> M1-1

- 模組
  - 子節點

| ID | 狀態 |
|---|---|
| M1-1 | 進行中 |

`<vector>` 和 <script>alert(1)</script> 與 [來源](https://example.com)

```cpp
### 不是目錄
std::vector<int> a;
```

### 節點 "引號" <vector> M1-1

#### 學生
最後一回合：搜尋 搜尋
'''
        _, headings, body = parse_markdown_to_sections(sample)
        self.assertEqual(len(headings), 2)
        self.assertNotEqual(headings[0]['id'], headings[1]['id'])
        self.assertIn('<table>', body)
        self.assertEqual(body.count('<ul>'), 2)
        self.assertNotIn('<script>', body)
        self.assertIn('&lt;vector&gt;', body)
        self.assertIn('std::vector&lt;int&gt;', body)
        self.assertIn('<a href="https://example.com">', body)
        with tempfile.TemporaryDirectory(dir=Path(__file__).parent) as folder:
            source = Path(folder) / 'notes.md'
            source.write_text(sample, encoding='utf-8')
            self.assertTrue(build_notes(source))
            output = source.with_name('notes-Interactive-Notes.html').read_text(encoding='utf-8')
            self.assertTrue(output.endswith('</html>\n'))
            self.assertIn('最後一回合', output)
            self.assertIn('href="#section-1"', output)
            self.assertIn('id="section-1"', output)
            with self.assertRaises(ValueError):
                build_notes(source, source)
            self.assertEqual(source.read_text(encoding='utf-8'), sample)
            import subprocess
            js = Path(folder) / 'ui.js'
            js.write_text(output.split('<script>')[1].split('</script>')[0], encoding='utf-8')
            subprocess.run(['node', '--check', str(js)], check=True)

    def test_unsafe_links_and_code_are_literal(self):
        _, headings, body = parse_markdown_to_sections('[bad](javascript:alert)\n\n```html\n### fake\n<img src=x>\n```')
        self.assertFalse(headings)
        self.assertNotIn('href=', body)
        self.assertNotIn('<img', body)


if __name__ == '__main__':
    unittest.main()
