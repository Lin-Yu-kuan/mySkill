"""Scaffold and statically inspect a workflow project; never execute its source skill."""
from __future__ import annotations
import argparse
import ast
import hashlib
import json
from pathlib import Path
import shutil
import stat
import sys

from workflow_runtime import validate_flow

IGNORE = {".git", "__pycache__", ".pytest_cache", ".venv", "node_modules"}


def read(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def write(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def manifest(root):
    result = {}
    def visit(directory):
        for p in sorted(directory.iterdir()):
            if p.name in IGNORE:
                continue
            flags = getattr(p.lstat(), "st_file_attributes", 0)
            if p.is_symlink() or flags & getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400):
                raise ValueError(f"來源含連結，需先明確處理：{p}")
            if p.is_dir():
                visit(p)
            elif p.is_file():
                result[p.relative_to(root).as_posix()] = hashlib.sha256(p.read_bytes()).hexdigest()
    visit(root)
    return result


def initialize(source, output):
    source, output = source.resolve(strict=True), output.resolve()
    if not (source / "SKILL.md").is_file():
        raise ValueError("來源缺少 SKILL.md")
    if output.is_relative_to(source) or source.is_relative_to(output):
        raise ValueError("輸出與來源目錄不可重疊")
    if output.exists():
        raise ValueError("輸出已存在，不能覆寫")
    before = manifest(source)
    output.mkdir(parents=True)
    write(output / "source-manifest.json", {"files": before})
    write(output / "conversion.json", {"status": "draft", "requirements": [],
                                       "unresolved": ["完成來源盤點、功能映射、handlers 與測試"]})
    write(output / "workflow.json", {"version": 1, "steps": []})
    shutil.copyfile(Path(__file__).with_name("workflow_runtime.py"), output / "workflow.py")
    (output / "handlers.py").write_text('"""依來源 Skill 實作領域步驟與驗證器；尚未完成。"""\n', encoding="utf-8")
    (output / "tests").mkdir()
    (output / "README.md").write_text("# 工作流改造草稿\n\n尚未完成，不能交付為可用工作流。請依功能對照實作，再補操作與測試說明。\n", encoding="utf-8")
    (output / "SKILL.md").write_text("---\nname: converted-workflow\ndescription: 尚未完成的工作流入口，完成轉換後填入實際用途。\n---\n\n草稿：請先完成領域實作與驗收。\n", encoding="utf-8")
    if manifest(source) != before:
        raise ValueError("來源在盤點期間改變；請重新確認，草稿不能視為完成")
    return {"status": "draft", "project": str(output), "source_unchanged": True}


def check(project, source=None):
    project = project.resolve(strict=True)
    errors = []
    try:
        plan = read(project / "conversion.json")
        flow = validate_flow(read(project / "workflow.json"))
        tree = ast.parse((project / "handlers.py").read_text(encoding="utf-8-sig"))
        functions = {n.name for n in tree.body if isinstance(n, ast.FunctionDef)}
        ids = {s["id"] for s in flow["steps"]}
        for name in flow.get("code_files", []):
            path = (project / name).resolve(strict=True)
            if Path(name).is_absolute() or not path.is_relative_to(project) or not path.is_file():
                errors.append("code_files 必須是專案內檔案")
        for step in flow["steps"]:
            for key in ("handler", "validator"):
                if key in step and step[key] not in functions:
                    errors.append(f"{step['id']} 缺少同步函式 {step[key]}")
        if plan.get("status") != "ready" or plan.get("unresolved") != []:
            errors.append("轉換仍為草稿或有未解決事項")
        requirements = plan.get("requirements")
        if not isinstance(requirements, list) or not requirements:
            errors.append("缺少原功能對照")
        seen = set()
        files = read(project / "source-manifest.json")["files"]
        for r in requirements or []:
            if any(not isinstance(r.get(k), str) or not r[k].strip() for k in ("id", "source", "locator", "description", "verification")):
                errors.append("功能對照缺少來源、定位、描述或驗收方式")
            if r.get("id") in seen:
                errors.append("功能 ID 重複")
            seen.add(r.get("id"))
            if r.get("source") not in files:
                errors.append("功能來源不在原始盤點中")
            steps = r.get("steps")
            if not isinstance(steps, list) or not steps or any(x not in ids for x in steps):
                errors.append("功能映射到未知或空步驟")
        if not list((project / "tests").glob("test_*.py")):
            errors.append("缺少可執行的測試檔")
        for name in ("workflow.py", "README.md", "SKILL.md"):
            if not (project / name).is_file():
                errors.append(f"缺少 {name}")
        if source is not None and manifest(source.resolve(strict=True)) != files:
            errors.append("原 Skill 與來源清單不一致")
    except (OSError, ValueError, KeyError, TypeError, SyntaxError, AttributeError) as exc:
        errors.append(str(exc))
    return {"passed": not errors, "errors": errors, "scope": "static_structure_only",
            "source_verified": source is not None and not errors,
            "semantic_quality": "not_verified", "tests_executed": False}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    sub = p.add_subparsers(dest="command", required=True)
    init = sub.add_parser("init")
    init.add_argument("--source", type=Path, required=True)
    init.add_argument("--output", type=Path, required=True)
    inspect = sub.add_parser("check")
    inspect.add_argument("--project", type=Path, required=True)
    inspect.add_argument("--source", type=Path)
    args = p.parse_args()
    try:
        result = initialize(args.source, args.output) if args.command == "init" else check(args.project, args.source)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 2 if result.get("passed") is False else 0
    except (OSError, ValueError) as exc:
        print(json.dumps({"error": str(exc)}, ensure_ascii=False))
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
