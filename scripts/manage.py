#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
mySkill 技能庫自動化治理與目錄同步工具 (Skill Governance & Catalog Manager)
用法：
  python scripts/manage.py lint          # 檢查所有技能是否符合 GEMINI.md 規範
  python scripts/manage.py sync          # 自動掃描所有技能並同步生成根目錄 README.md
  python scripts/manage.py list          # 列出目前所有技能與領域分類統計
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

REPO_URL = "https://github.com/Lin-Yu-kuan/mySkill"
RAW_BASE_URL = "https://raw.githubusercontent.com/Lin-Yu-kuan/mySkill/main"

IGNORE_DIRS = {
    ".git",
    ".github",
    ".agents",
    ".agent",
    ".gemini",
    ".vscode",
    "scripts",
    "__pycache__",
    "node_modules",
}

# 領域分類定義與排序權重
CATEGORY_DEFINITIONS: Dict[str, Dict[str, str]] = {
    "exam": {
        "title": "📚 公職考試與備考體系 (Exam & Prep)",
        "desc": "專為國家考試、國營事業、專技考試打造的申論擬答與歷屆考古題 PDF 考點大數據分析。",
        "badge": "公職考試 / 備考",
    },
    "learning": {
        "title": "🧠 思維架構與深度自學 (Knowledge & Learning)",
        "desc": "由上而下建構知識全景圖、四層認識論深度講義與抗上下文壓縮的系統化自學流程。",
        "badge": "學習 / 思考",
    },
    "frontend": {
        "title": "🎨 前端視覺與互動設計 (Frontend & UI/UX)",
        "desc": "結合瀏覽器自由便條紙標註、全站 Design Tokens 萃取與高質感 UI 生成工作流。",
        "badge": "前端 / UI 設計",
    },
    "content": {
        "title": "✍️ 內容創作與個人社群 (Content & Social Voice)",
        "desc": "具備個人真實語氣、適度吐槽且嚴守事實邊界的跨平台社群貼文寫作與改稿。",
        "badge": "社群創作 / 語氣改寫",
    },
    "dev-tools": {
        "title": "🛠️ 開發環境與技能治理 (Dev Toolchain & Skill Governance)",
        "desc": "Antigravity 黃金工具鏈一鍵佈署體檢，以及既有 Skill 的唯讀診斷與最小化演進。",
        "badge": "環境配置 / 技能治理",
    },
}

REQUIRED_FRONTMATTER_KEYS = [
    "name",
    "category",
    "category_label",
    "summary",
    "description",
    "repository",
    "update_url",
]


def parse_frontmatter(content: str) -> Tuple[Dict[str, str], str]:
    """解析 Markdown YAML Frontmatter（純標準庫實作，支援單行與 >- 多行區塊）"""
    lines = content.splitlines()
    if not lines or lines[0].strip() != "---":
        return {}, content

    fm_lines: List[str] = []
    end_idx = -1
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            end_idx = i
            break
        fm_lines.append(lines[i])

    if end_idx == -1:
        return {}, content

    data: Dict[str, str] = {}
    current_key: Optional[str] = None
    multiline_mode = False
    multiline_buf: List[str] = []

    for line in fm_lines:
        if multiline_mode:
            if line.startswith("  ") or not line.strip():
                multiline_buf.append(line.strip())
                continue
            else:
                if current_key:
                    data[current_key] = " ".join(
                        [s for s in multiline_buf if s]
                    ).strip()
                multiline_mode = False
                multiline_buf = []
                current_key = None

        match = re.match(r"^([a-zA-Z0-9_-]+)\s*:\s*(.*)$", line)
        if match:
            key, val = match.group(1), match.group(2).strip()
            if val in (">-", ">", "|", "|-"):
                current_key = key
                multiline_mode = True
                multiline_buf = []
            else:
                data[key] = val.strip("\"'")

    if multiline_mode and current_key:
        data[current_key] = " ".join([s for s in multiline_buf if s]).strip()

    body = "\n".join(lines[end_idx + 1 :])
    return data, body


class SkillInfo:
    def __init__(self, path: Path):
        self.path = path
        self.dir_name = path.name
        self.skill_md = path / "SKILL.md"
        self.readme_md = path / "README.md"
        self.frontmatter: Dict[str, str] = {}
        self.body: str = ""
        self.has_subdirs: bool = False
        self.sub_items: List[str] = []
        self._load()

    def _load(self) -> None:
        if self.skill_md.exists():
            content = self.skill_md.read_text(encoding="utf-8")
            self.frontmatter, self.body = parse_frontmatter(content)

        for item in sorted(self.path.iterdir()):
            if item.name.startswith(".") or item.name == "__pycache__":
                continue
            if item.is_dir():
                self.has_subdirs = True
                self.sub_items.append(f"{item.name}/")
            elif item.name not in ("SKILL.md", "README.md"):
                self.sub_items.append(item.name)

    @property
    def name(self) -> str:
        return self.frontmatter.get("name", self.dir_name)

    @property
    def category(self) -> str:
        return self.frontmatter.get("category", "other")

    @property
    def category_label(self) -> str:
        return self.frontmatter.get("category_label", "未分類")

    @property
    def summary(self) -> str:
        return self.frontmatter.get("summary", self.frontmatter.get("description", ""))

    @property
    def description(self) -> str:
        return self.frontmatter.get("description", "")

    @property
    def is_package(self) -> bool:
        return self.has_subdirs or any(
            x in self.sub_items for x in ("plugin.json", "requirements.txt")
        )


def discover_skills(root: Path) -> List[SkillInfo]:
    skills: List[SkillInfo] = []
    for item in sorted(root.iterdir()):
        if not item.is_dir() or item.name in IGNORE_DIRS or item.name.startswith("."):
            continue
        if (item / "SKILL.md").exists():
            skills.append(SkillInfo(item))
    return skills


def lint_skills(root: Path) -> int:
    skills = discover_skills(root)
    if not skills:
        print("❌ 找不到任何包含 SKILL.md 的技能目錄！")
        return 1

    print(f"🔍 開始掃描並檢驗 {len(skills)} 個技能目錄...\n")
    errors: List[str] = []
    warnings: List[str] = []

    for s in skills:
        prefix = f"[{s.dir_name}]"
        # 1. 檢查 Frontmatter 必填欄位
        for key in REQUIRED_FRONTMATTER_KEYS:
            if not s.frontmatter.get(key):
                errors.append(f"{prefix} SKILL.md 缺少必填 Frontmatter 欄位: `{key}`")

        # 2. 檢查名稱一致性
        if s.frontmatter.get("name") and s.frontmatter["name"] != s.dir_name:
            errors.append(
                f"{prefix} Frontmatter name (`{s.frontmatter['name']}`) 與資料夾名稱 (`{s.dir_name}`) 不一致"
            )

        # 3. 檢查 category 合法性
        cat = s.frontmatter.get("category", "")
        if cat and cat not in CATEGORY_DEFINITIONS:
            warnings.append(
                f"{prefix} category `{cat}` 未定義於標準領域清單 ({', '.join(CATEGORY_DEFINITIONS.keys())})"
            )

        # 4. 檢查 repository 與 update_url
        expected_update_url = f"{RAW_BASE_URL}/{s.dir_name}/SKILL.md"
        if s.frontmatter.get("repository") != REPO_URL:
            errors.append(f"{prefix} repository 欄位應為 `{REPO_URL}`")
        if s.frontmatter.get("update_url") != expected_update_url:
            errors.append(f"{prefix} update_url 應為 `{expected_update_url}`")

        # 5. 檢查更新觸發關鍵詞
        desc = s.description
        if "更新" not in desc and "版本" not in desc:
            warnings.append(f"{prefix} description 建議提及「更新」或「檢查版本」以支援無感更新喚醒")

        # 6. 檢查 README.md
        if not s.readme_md.exists():
            errors.append(f"{prefix} 缺少 `README.md` 說明文件")
        else:
            readme_text = s.readme_md.read_text(encoding="utf-8")
            if "一鍵安裝" not in readme_text:
                warnings.append(f"{prefix} README.md 缺少「🚀 Antigravity 一鍵安裝方式」章節")
            if ".gemini\\config\\skills" not in readme_text:
                errors.append(f"{prefix} README.md 缺少 Windows PowerShell 安裝指令")
            if ".gemini/config/skills" not in readme_text:
                errors.append(f"{prefix} README.md 缺少 macOS / Linux 安裝指令")

        status = "✅ 通過" if not any(e.startswith(prefix) for e in errors) else "❌ 異常"
        pkg_type = "📦 套件型" if s.is_package else "📄 單檔型"
        print(f"  {status} {s.dir_name:<26} | {pkg_type} | 領域: {s.category_label}")

    print("\n" + "=" * 65)
    if warnings:
        print(f"⚠️  警告 ({len(warnings)} 項):")
        for w in warnings:
            print(f"  - {w}")
    if errors:
        print(f"❌ 錯誤 ({len(errors)} 項):")
        for e in errors:
            print(f"  - {e}")
        print("\n💡 請修正上述錯誤後再重新執行 `python scripts/manage.py lint`。")
        return 1

    print(f"🎉 體檢完畢！共 {len(skills)} 個技能全數符合 GEMINI.md 規範標準。")
    return 0


def generate_readme(skills: List[SkillInfo]) -> str:
    # 按領域分組
    grouped: Dict[str, List[SkillInfo]] = {k: [] for k in CATEGORY_DEFINITIONS}
    other_skills: List[SkillInfo] = []

    for s in skills:
        if s.category in grouped:
            grouped[s.category].append(s)
        else:
            other_skills.append(s)

    total_count = len(skills)
    cat_count = sum(1 for v in grouped.values() if v)

    lines: List[str] = [
        "# 🧠 mySkill - AI Agent 技能庫",
        "",
        "收錄高品質的 AI Agent 技能集合（Skills），遵循標準通用 Agent Skill 規範，專為 **Google Antigravity** 及支援 Agent Skill 規範的 AI 工具打造。",
        "",
        f"[![Total Skills](https://img.shields.io/badge/Skills-{total_count}%20個專業技能-purple.svg)](#📦-領域分類目錄-skill-catalog)",
        f"[![Domains](https://img.shields.io/badge/Domains-{cat_count}%20大領域體系-blue.svg)](#📦-領域分類目錄-skill-catalog)",
        "[![Zero Download](https://img.shields.io/badge/Install-零下載雲端一行直裝-brightgreen.svg)](#🎁-領域全家桶一鍵安裝-domain-bundles)",
        "[![Auto Update](https://img.shields.io/badge/Update-自然語言無感更新-orange.svg)](#🔄-智慧無感自動更新已安裝者)",
        "",
        "---",
        "",
        "## 🧭 快速領域導覽",
        "",
    ]

    for cat_key, meta in CATEGORY_DEFINITIONS.items():
        cat_skills = grouped.get(cat_key, [])
        if not cat_skills:
            continue
        skill_links = " 、 ".join([f"[`{s.name}`](./{s.dir_name})" for s in cat_skills])
        lines.append(f"- **{meta['title']}**（{len(cat_skills)}）：{skill_links}")

    lines.extend([
        "",
        "---",
        "",
        "## 📦 領域分類目錄 (Skill Catalog)",
        "",
        "點擊下方各領域表格中的**技能名稱**或**詳細說明**即可查看完整文件與單獨一鍵安裝指令：",
        "",
    ])

    for cat_key, meta in CATEGORY_DEFINITIONS.items():
        cat_skills = grouped.get(cat_key, [])
        if not cat_skills:
            continue
        lines.extend([
            f"### {meta['title']}",
            f"> {meta['desc']}",
            "",
            "| 技能名稱 | 核心功能簡介 | 子類別 | 類型 | 說明文件 |",
            "|---|---|---|---|---|",
        ])
        for s in cat_skills:
            pkg_badge = "📦 套件" if s.is_package else "📄 單檔"
            lines.append(
                f"| [**{s.name}**](./{s.dir_name}) | {s.summary} | `{s.category_label}` | {pkg_badge} | [查看說明](./{s.dir_name}/README.md) |"
            )
        lines.append("")

    if other_skills:
        lines.extend([
            "### 🧩 其他擴充技能",
            "",
            "| 技能名稱 | 核心功能簡介 | 子類別 | 類型 | 說明文件 |",
            "|---|---|---|---|---|",
        ])
        for s in other_skills:
            pkg_badge = "📦 套件" if s.is_package else "📄 單檔"
            lines.append(
                f"| [**{s.name}**](./{s.dir_name}) | {s.summary} | `{s.category_label}` | {pkg_badge} | [查看說明](./{s.dir_name}/README.md) |"
            )
        lines.append("")

    # 領域全家桶一鍵安裝區
    all_names_ps = ",".join([f'"{s.dir_name}"' for s in skills])
    all_names_bash = " ".join([f'"mySkill-main/{s.dir_name}/"' for s in skills])

    lines.extend([
        "---",
        "",
        "## 🎁 領域全家桶一鍵安裝 (Domain Bundles)",
        "",
        "不想一個一個技能分開貼指令？您可以根據需求，直接選擇**「全庫一鍵全裝」**或按領域選擇**「主題全家桶」**！",
        "",
        "### 🌟 方案 A：全庫技能一鍵全裝（一次擁有全部技能）",
        "- **Windows (PowerShell)**：",
        "  ```powershell",
        f'  $u="{REPO_URL}/archive/refs/heads/main.zip"; $t="$env:TEMP\\myskill.zip"; $b="$HOME\\.gemini\\config\\skills"; Invoke-WebRequest $u -OutFile $t; Expand-Archive $t "$env:TEMP\\myskill-temp" -Force; @({all_names_ps}) | ForEach-Object {{ $d="$b\\$_"; if (!(Test-Path $d)) {{ New-Item -ItemType Directory -Path $d -Force | Out-Null }}; Copy-Item "$env:TEMP\\myskill-temp\\mySkill-main\\$_\\*" $d -Recurse -Force }}; Remove-Item $t,"$env:TEMP\\myskill-temp" -Recurse -Force; Write-Host "✅ mySkill 全庫 ({total_count} 個技能) 已成功安裝！" -ForegroundColor Green',
        "  ```",
        "- **macOS / Linux**：",
        "  ```bash",
        f'  mkdir -p "$HOME/.gemini/config/skills" && curl -sSL "{REPO_URL}/archive/refs/heads/main.tar.gz" | tar -xz -C "$HOME/.gemini/config/skills" --strip-components=1 {all_names_bash} && echo "✅ mySkill 全庫 ({total_count} 個技能) 已成功安裝！"',
        "  ```",
        "",
        "### 📚 方案 B：按領域全家桶安裝",
        "<details>",
        "<summary><b>點擊展開各領域組合包一行直裝指令（國考包 / 開發治理包 / 前端創作包）</b></summary>",
        "",
    ])

    for cat_key, meta in CATEGORY_DEFINITIONS.items():
        cat_skills = grouped.get(cat_key, [])
        if not cat_skills:
            continue
        ps_list = ",".join([f'"{s.dir_name}"' for s in cat_skills])
        bash_list = " ".join([f'"mySkill-main/{s.dir_name}/"' for s in cat_skills])
        names_str = " + ".join([f"`{s.dir_name}`" for s in cat_skills])
        lines.extend([
            f"#### {meta['title']}（含 {names_str}）",
            "- **Windows (PowerShell)**：",
            "  ```powershell",
            f'  $u="{REPO_URL}/archive/refs/heads/main.zip"; $t="$env:TEMP\\myskill.zip"; $b="$HOME\\.gemini\\config\\skills"; Invoke-WebRequest $u -OutFile $t; Expand-Archive $t "$env:TEMP\\myskill-temp" -Force; @({ps_list}) | ForEach-Object {{ $d="$b\\$_"; if (!(Test-Path $d)) {{ New-Item -ItemType Directory -Path $d -Force | Out-Null }}; Copy-Item "$env:TEMP\\myskill-temp\\mySkill-main\\$_\\*" $d -Recurse -Force }}; Remove-Item $t,"$env:TEMP\\myskill-temp" -Recurse -Force; Write-Host "✅ {meta["badge"]} 全家桶已安裝完成！" -ForegroundColor Green',
            "  ```",
            "- **macOS / Linux**：",
            "  ```bash",
            f'  mkdir -p "$HOME/.gemini/config/skills" && curl -sSL "{REPO_URL}/archive/refs/heads/main.tar.gz" | tar -xz -C "$HOME/.gemini/config/skills" --strip-components=1 {bash_list} && echo "✅ {meta["badge"]} 全家桶已安裝完成！"',
            "  ```",
            "",
        ])

    lines.extend([
        "</details>",
        "",
        "---",
        "",
        "## 🚀 單一技能通用安裝指南",
        "",
        "每個技能目錄內均有詳細的專屬安裝說明（支援 Windows PowerShell 一行直裝、macOS/Linux 一行直裝、對話框自然語言安裝與本機 Symlink）。",
        "",
        "### 本地複製安裝（已 Clone 本倉庫者）",
        "將目標 Skill 資料夾複製到 Antigravity 全域技能目錄：",
        "- **Windows (PowerShell)**：",
        "  ```powershell",
        '  Copy-Item -Path ".\\<skill-name>" -Destination "$HOME\\.gemini\\config\\skills\\<skill-name>" -Recurse -Force',
        "  ```",
        "- **macOS / Linux**：",
        "  ```bash",
        '  cp -r ./<skill-name> "$HOME/.gemini/config/skills/<skill-name>"',
        "  ```",
        "",
        "---",
        "",
        "## 🔄 智慧無感自動更新（已安裝者）",
        "",
        "本倉庫所有技能的 `SKILL.md` 均內建 GitHub 來源網址標註（`repository` 與 `update_url`）及自動更新指引。",
        "",
        "一旦您安裝過任何技能，若想取得 GitHub 上的最新版本，**不需要手動重新下載或尋找目錄**！  ",
        "只要在 Antigravity 對話框中說：",
        "> 「幫我更新 [技能名稱]」或「檢查 [技能名稱] 最新版本」",
        "",
        "Antigravity 會自動讀取本機技能設定，連線至 GitHub 下載最新版覆蓋更新，一句話無感完成！",
        "",
        "---",
        "",
        "## 🛠️ 倉庫自動化維護與治理工具",
        "",
        "為解決技能數量持續增長帶來的維護負擔，本倉庫內建零依賴的自動化管理腳本 [`scripts/manage.py`](./scripts/manage.py)：",
        "",
        "```bash",
        "# 1. 檢查所有技能是否符合 GEMINI.md 規範（Frontmatter、更新網址、README 安裝指令）",
        "python scripts/manage.py lint",
        "",
        "# 2. 新增或修改技能後，一鍵自動同步生成根目錄 README.md（領域表格、全家桶指令、目錄樹）",
        "python scripts/manage.py sync",
        "```",
        "",
        "---",
        "",
        "## 📂 專案結構規範",
        "",
        "本倉庫採用**「實體扁平相容 + 邏輯領域分群」**的 Monorepo 架構，確保所有雲端更新網址永久穩定：",
        "",
        "```text",
        "mySkill/",
        "├── GEMINI.md                      # 本倉庫專屬開發規範（含領域分類、零下載安裝與自動更新標準）",
        "├── README.md                      # 技能庫領域總覽首頁（由 scripts/manage.py 自動同步）",
        "├── scripts/",
        "│   └── manage.py                  # 技能規範體檢 (lint) 與總目錄自動生成 (sync) 工具",
    ])

    for idx, s in enumerate(skills):
        is_last_skill = idx == len(skills) - 1
        branch = "└──" if is_last_skill else "├──"
        child_prefix = "    " if is_last_skill else "│   "
        short_comment = s.category_label
        lines.append(f"{branch} {s.dir_name + '/':<30} # [{short_comment}]")
        children = ["SKILL.md", "README.md"] + s.sub_items
        for c_idx, child in enumerate(children):
            c_branch = "└──" if c_idx == len(children) - 1 else "├──"
            lines.append(f"{child_prefix}{c_branch} {child}")

    lines.extend([
        "```",
        "",
        "---",
        "",
        "## 📄 License",
        "MIT License",
        "",
    ])

    return "\n".join(lines)


def sync_readme(root: Path, check_only: bool = False) -> int:
    skills = discover_skills(root)
    new_content = generate_readme(skills)
    readme_path = root / "README.md"

    if check_only:
        if not readme_path.exists():
            print("❌ 根目錄 README.md 不存在！")
            return 1
        current = readme_path.read_text(encoding="utf-8")
        if current.strip() != new_content.strip():
            print("⚠️  根目錄 README.md 與技能元資料不同步，請執行 `python scripts/manage.py sync` 更新。")
            return 1
        print("✅ 根目錄 README.md 已是最新同步狀態。")
        return 0

    readme_path.write_text(new_content, encoding="utf-8")
    print(f"✅ 已成功掃描 {len(skills)} 個技能並自動同步更新 `{readme_path}`！")
    return 0


def list_skills(root: Path) -> int:
    skills = discover_skills(root)
    print(f"📦 mySkill 技能清單（共 {len(skills)} 個技能）：\n")
    for cat_key, meta in CATEGORY_DEFINITIONS.items():
        matched = [s for s in skills if s.category == cat_key]
        if not matched:
            continue
        print(f"{meta['title']} ({len(matched)})")
        for s in matched:
            pkg = "套件" if s.is_package else "單檔"
            print(f"  - {s.name:<25} [{pkg}] {s.summary[:45]}...")
        print()
    return 0


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description="mySkill 技能庫自動化治理工具")
    sub = parser.add_subparsers(dest="cmd")

    sub.add_parser("lint", help="檢查所有技能是否符合 GEMINI.md 規範")
    sync_p = sub.add_parser("sync", help="自動生成並同步根目錄 README.md")
    sync_p.add_argument("--check", action="store_true", help="僅檢查是否同步，不寫入檔案")
    sub.add_parser("list", help="依領域列出所有技能")

    args = parser.parse_args()
    root = Path(__file__).resolve().parent.parent

    if args.cmd == "lint":
        return lint_skills(root)
    elif args.cmd == "sync":
        return sync_readme(root, check_only=args.check)
    elif args.cmd == "list":
        return list_skills(root)
    else:
        parser.print_help()
        return 0


if __name__ == "__main__":
    sys.exit(main())
