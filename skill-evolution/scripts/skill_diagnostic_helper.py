#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
skill_diagnostic_helper.py
輔助 `skill-evolution` 進行既有 Skill 唯讀診斷的確定性工具：
1. collect-context: 盤點 SKILL.md 第一層直接連結，盤點既有範例、邊界定義與互動確認點。
2. check-claims / test-polarity: 針對價格、公開狀態、功能上線時態等關鍵主張，核對當次素材的「肯定/否定極性」與「時態」，
   並展示為何單純關鍵詞差集會漏掉「沒有免費方案 → 提供免費方案」或誤擋「不收費 → 免費」。
"""

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, NamedTuple, Optional, Tuple

# 確保 Windows 終端機 UTF-8 輸出正常
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


# ============================================================================
# 1. 主檔直接連結盤點與既有判準盤點 (Reference-Aware Context Collector)
# ============================================================================

MD_LINK_PATTERN = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")


def extract_referenced_files(skill_dir: Path, md_content: str) -> List[Path]:
    """從 SKILL.md 內文中提取所有指向本地檔案的相對路徑連結。"""
    refs: List[Path] = []
    for _, link_target in MD_LINK_PATTERN.findall(md_content):
        clean_target = link_target.split("#")[0].strip()
        if not clean_target or clean_target.startswith(("http://", "https://", "mailto:", "file://")):
            continue
        candidate = (skill_dir / clean_target).resolve()
        if candidate.is_file() and candidate not in refs:
            refs.append(candidate)
    return refs


def scan_existing_criteria_and_examples(file_path: Path, content: str) -> Dict[str, Any]:
    """
    掃描檔案中是否已具備具體判準、正反範例（如「較符合 / 不符合」）與互動契約，
    避免把已定義清楚的風格誤報為「模糊」。
    """
    lines = content.splitlines()
    example_markers: List[Dict[str, Any]] = []
    boundary_markers: List[Dict[str, Any]] = []
    interaction_gates: List[Dict[str, Any]] = []

    for idx, line in enumerate(lines, start=1):
        stripped = line.strip()
        # 偵測正反對照範例
        if any(k in stripped for k in ["改寫示例", "較符合", "不符合", "正例", "反例", "範例", "示例"]):
            example_markers.append({"line": idx, "text": stripped})
        # 偵測具體行為邊界（「針對…不轉成…」、「只有…才…」、「不虛構…」）
        if any(k in stripped for k in ["不轉成", "不虛構", "不要把", "不沿用", "只有明確提供", "避免誤學"]):
            boundary_markers.append({"line": idx, "text": stripped})
        # 偵測互動契約與按需交付條件
        if any(k in stripped for k in ["指定多個平台時", "確認素材包", "確認後", "只有缺少", "預設提供一份"]):
            interaction_gates.append({"line": idx, "text": stripped})

    return {
        "file": str(file_path),
        "line_count": len(lines),
        "has_concrete_examples": len(example_markers) > 0,
        "example_locations": example_markers,
        "concrete_boundaries": boundary_markers,
        "interaction_contracts": interaction_gates,
    }


def collect_skill_context(skill_dir_str: str) -> Dict[str, Any]:
    skill_dir = Path(skill_dir_str).resolve()
    skill_md_path = skill_dir / "SKILL.md"
    if not skill_md_path.is_file():
        raise FileNotFoundError(f"找不到 SKILL.md: {skill_md_path}")

    skill_md_content = skill_md_path.read_text(encoding="utf-8")
    referenced_files = extract_referenced_files(skill_dir, skill_md_content)

    # 同時檢查 references/ 與 scripts/ 下是否有其他檔案
    unlinked_files: List[Path] = []
    for subdir in ["references", "scripts", "resources"]:
        sub_path = skill_dir / subdir
        if sub_path.is_dir():
            for p in sub_path.rglob("*"):
                if p.is_file() and p not in referenced_files:
                    unlinked_files.append(p)

    file_analyses = [scan_existing_criteria_and_examples(skill_md_path, skill_md_content)]
    for ref_path in referenced_files:
        ref_content = ref_path.read_text(encoding="utf-8")
        file_analyses.append(scan_existing_criteria_and_examples(ref_path, ref_content))

    return {
        "skill_dir": str(skill_dir),
        "skill_md": str(skill_md_path),
        "linked_references": [str(p) for p in referenced_files],
        "unlinked_support_files": [str(p) for p in unlinked_files],
        "analysis_by_file": file_analyses,
    }


# ============================================================================
# 2. 主張極性、時態與同義改寫核對器 (Polarity & Modality Claim Verifier)
# ============================================================================

def naive_keyword_diff_check(source: str, output: str, keywords: List[str]) -> Dict[str, Any]:
    """
    展示單純「關鍵詞差集（素材沒出現該詞、輸出就不能出現）」的行為與缺陷。
    """
    leaked_words = [kw for kw in keywords if (kw in output and kw not in source)]
    return {
        "passed": len(leaked_words) == 0,
        "flagged_keywords": leaked_words,
    }


# 只解析能完整辨識的子句。未支援的限定詞不能從主張中剝除。
PRICE = re.compile(
    r"(?:目前|現在)?(?:"
    r"(?P<paid>沒有免費方案|不提供免費方案|需付費|需要付費|付費|收費|採(?P<billing>(?:月|年)費訂閱))"
    r"|(?P<free>(?:可以|可|完全|提供)?(?:免費(?:使用|方案)?|不收費|免收費|零費用|不用錢)))"
)
PUBLICATION = re.compile(
    r"(?:(?P<live>目前已經|目前已|已經|現已|正式|已)"
    r"|(?P<pending>(?:目前)?(?:尚未|還沒|未))"
    r"|(?P<planned>預計|計畫|規劃|打算)(?P<when>(?:下個月|明年)?(?:整理好之後)?))"
    r"(?P<event>開放下載|開源|公開|上線)"
)
# 具名版本、功能及簡單英文產品名。更複雜的中文主詞交由 Agent 複核。
SCOPE = re.compile(
    r"(?:這個工具(?:的程式碼)?|程式碼|"
    r"(?:[\w-]{1,12}版)?(?:下載|匯出|安裝|使用)|[\w-]{1,12}版|[A-Za-z][A-Za-z0-9_-]*)"
)
TOPIC = re.compile(r"(?:這是我(?:週末)?做的|(?:我|最近|週末)?(?:做|搓)了一個)([\w-]+工具)")
INVITATION = re.compile(r"歡迎(?:大家)?(?:試用|下載)")
REVIEW_TERMS = re.compile(r"免費|費用|付費|收費|訂閱|開源|公開|開放|上線|安全|支援|保證")
CONDITION = re.compile(r"如果|只要|僅限|限時|只限|限於|僅供|只供|除非|若|前提是|才(?:可以|能)|原本|曾經|過去|以前")
FEATURES = {"下載", "匯出", "安裝", "使用"}
AMENDMENT = re.compile(r"^(?:但|不過|然而|更正|修正上述|補充|例外|此優惠|這項優惠|僅限|只限|限於|僅供)")


class Claim(NamedTuple):
    subject: str
    topic: str
    state: str
    clause: str
    context_clause: str
    when: str = ""


def parse_predicate(text: str, subject: str, clause: str, context_clause: str = "") -> Optional[Claim]:
    price = PRICE.fullmatch(text)
    if price:
        topic = "免費方案" if "免費方案" in text else "費用"
        if price["billing"]:
            topic = price["billing"]
        state = "收費" if price["paid"] else "免費"
        return Claim(subject, topic, state, clause, context_clause)
    publication = PUBLICATION.fullmatch(text)
    if publication:
        state = "尚未"
        if publication["live"]:
            state = "已實現"
        elif publication["planned"]:
            state = "規劃"
        if publication["event"] == "開源" and subject.endswith("的程式碼"):
            subject = subject[:-len("的程式碼")]
        return Claim(subject, publication["event"], state, clause, context_clause, publication["when"] or "")
    return None


def read_claims(text: str, *, evidence: bool = False) -> Tuple[List[Claim], List[str]]:
    """保留可配對的主張與待複核子句；素材含不明限定時，避免取半句作證。"""
    claims, unresolved = [], []
    for sentence in re.findall(r"[^。！？!?；;\n]+[？?]?", text):
        sentence = sentence.strip()
        # 跨句限定或勘誤的作用對象不明時，先前的句子不足以單獨作證。
        if evidence and AMENDMENT.match(sentence):
            claims.clear()
            unresolved.append(sentence)
            continue
        if CONDITION.search(sentence):
            unresolved.append(sentence)
            continue
        context = context_clause = product = ""
        sentence_claims = []
        unresolved_before = len(unresolved)
        for clause in re.split(r"[,，]", sentence):
            clause = clause.strip()
            if not clause:
                continue
            topic = TOPIC.fullmatch(clause)
            if topic:
                context = topic[1]
                product = context
                context_clause = clause
                continue
            if INVITATION.fullmatch(clause):
                continue
            if clause.startswith("想問問大家") and clause.endswith(("？", "?")) and not REVIEW_TERMS.search(clause):
                continue
            if clause.endswith(("？", "?")):
                unresolved.append(clause)
                continue
            # 先嘗試承接同一句內已明示的主詞，再嘗試「對象＋述詞」。
            claim = parse_predicate(clause, context, clause, context_clause)
            if claim is None:
                scope = SCOPE.match(clause)
                if scope:
                    subject = scope[0]
                    inherited = subject in FEATURES and bool(product)
                    claim = parse_predicate(
                        clause[scope.end():], product + subject if inherited else subject,
                        clause, context_clause if inherited else "",
                    )
                    if claim and subject not in FEATURES:
                        product = subject
            if claim and claim.subject:
                sentence_claims.append(claim)
                context = claim.subject
                if not claim.context_clause:
                    context_clause = clause
            else:
                unresolved.append(clause)
                context = context_clause = product = ""
        # 未讀懂的同句子句可能限制素材適用範圍，不取整句作為證據。
        if not evidence or len(unresolved) == unresolved_before:
            claims.extend(sentence_claims)
    return claims, unresolved


def verify_claims_with_polarity(source: str, output: str) -> Dict[str, Any]:
    sources, _ = read_claims(source, evidence=True)
    outputs, unresolved = read_claims(output)
    issues = [
        {"type": "NEEDS_REVIEW", "claim": clause, "detail": "無法確定主詞或判讀整個子句。"}
        for clause in unresolved
    ]
    alignments = []
    contradicted = False
    for claim in outputs:
        candidates = [
            item for item in sources if (item.subject, item.topic) == (claim.subject, claim.topic)
        ]
        states = {(item.state, item.when) for item in candidates}
        if len(states) != 1:
            issues.append({
                "type": "NEEDS_REVIEW", "claim": claim.clause,
                "detail": "缺少相同對象及範圍的明確素材，或素材狀態不一致。",
            })
            continue
        evidence = candidates[0]
        record = {"claim": claim.topic, "output_claim": claim.clause, "source_clause": evidence.clause}
        if evidence.context_clause:
            record["source_context"] = evidence.context_clause
        if evidence.state == claim.state and evidence.when != claim.when:
            issues.append({**record, "type": "NEEDS_REVIEW", "detail": "規劃的時間或實現條件不同。"})
        elif evidence.state == claim.state:
            alignments.append({**record, "detail": "對象、範圍與狀態一致。"})
        elif {evidence.state, claim.state} == {"規劃", "尚未"}:
            issues.append({**record, "type": "NEEDS_REVIEW", "detail": "尚未實現與有具體計畫不能互相推論。"})
        else:
            contradicted = True
            issues.append({
                **record,
                "type": "POLARITY_REVERSAL" if claim.topic in ("費用", "免費方案") else "MODALITY_DRIFT",
                "detail": f"素材為「{evidence.state}」，輸出為「{claim.state}」。",
            })

    status = "verified"
    if contradicted:
        status = "contradicted"
    elif issues or not alignments:
        status = "needs_review"
        if not issues:
            issues.append({"type": "NEEDS_REVIEW", "claim": output, "detail": "沒有可核對的費用或公開狀態主張。"})
    return {"status": status, "passed": status == "verified", "issues": issues, "verified_alignments": alignments}


def run_polarity_benchmark() -> None:
    """執行必考驗收測例，對比「單純關鍵詞差集」與「極性感知核對」。"""
    test_cases = [
        {
            "name": "測例 1：詞一樣、意思相反（沒有免費方案 → 提供免費方案）",
            "source": "我做了一個考古題整理工具，目前沒有免費方案，採月費訂閱。",
            "output": "最近做了一個考古題整理工具，目前提供免費方案，歡迎大家試用！",
            "expected_status": "contradicted",
        },
        {
            "name": "測例 2：詞不同、意思相同（完全不收費 → 免費使用）",
            "source": "週末搓了一個待辦清單小工具，完全不收費，想問問大家平常怎麼整理待辦？",
            "output": "週末搓了一個待辦清單小工具，可以免費使用，想問問大家平常怎麼整理待辦？",
            "expected_status": "verified",
        },
        {
            "name": "測例 3：時態越界（預計下個月開源 → 程式碼已經開源）",
            "source": "這個工具目前還沒公開，預計下個月整理好之後開源。",
            "output": "這個工具的程式碼已經開源，歡迎大家下載！",
            "expected_status": "contradicted",
        },
    ]

    naive_keywords = ["免費", "開源", "公開", "家人"]
    print("=" * 72)
    print("🔬 事實主張核對驗收測試：單純關鍵詞差集 vs. 極性與時態感知核對")
    print("=" * 72)

    all_correct = True
    for tc in test_cases:
        naive_res = naive_keyword_diff_check(tc["source"], tc["output"], naive_keywords)
        polarity_res = verify_claims_with_polarity(tc["source"], tc["output"])
        matched_expectation = polarity_res["status"] == tc["expected_status"]
        all_correct = all_correct and matched_expectation

        print(f"\n【{tc['name']}】")
        print(f"  • 素材：{tc['source']}")
        print(f"  • 輸出：{tc['output']}")
        print(
            f"  • [舊] 單純關鍵詞差集判定：{'放行 (PASS)' if naive_res['passed'] else '攔截 (BLOCK)'}"
            f" (觸發詞: {naive_res['flagged_keywords']})"
        )
        print(
            f"  • [新] 極性與時態感知判定：{polarity_res['status']}"
            f" -> {'✅ 符合預期' if matched_expectation else '❌ 不符預期'}"
        )
        if polarity_res["issues"]:
            for iss in polarity_res["issues"]:
                print(f"      └─ 攔截原因 [{iss['type']}]: {iss['detail']}")
        if polarity_res["verified_alignments"]:
            for align in polarity_res["verified_alignments"]:
                print(f"      └─ 放行依據: {align['detail']}")

    print("\n" + "=" * 72)
    if not all_correct:
        sys.exit(1)
    print("✅ 全部驗收測例通過！")


def main() -> None:
    parser = argparse.ArgumentParser(description="Skill Evolution 唯讀診斷輔助工具")
    subparsers = parser.add_subparsers(dest="command", required=True)

    collect_help = ("linked_references 只列主檔直接連結的現存檔案；unlinked_support_files 可能含有次層指南"
                    "或命令列、純文字提及的腳本，由 Agent 補讀。")
    collect_parser = subparsers.add_parser("collect-context", help=collect_help, description=collect_help)
    collect_parser.add_argument("skill_dir", help="目標 Skill 的目錄路徑")

    claim_parser = subparsers.add_parser("check-claims", help="核對單組素材與輸出的關鍵主張極性與時態")
    claim_parser.add_argument("--source", required=True, help="當次輸入素材文字")
    claim_parser.add_argument("--output", required=True, help="模型產出的文字")

    subparsers.add_parser("test-polarity", help="執行『沒有免費→提供免費』與『不收費→免費』驗收基準測試")

    args = parser.parse_args()
    if args.command == "collect-context":
        result = collect_skill_context(args.skill_dir)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    elif args.command == "check-claims":
        result = verify_claims_with_polarity(args.source, args.output)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    elif args.command == "test-polarity":
        run_polarity_benchmark()


if __name__ == "__main__":
    main()
