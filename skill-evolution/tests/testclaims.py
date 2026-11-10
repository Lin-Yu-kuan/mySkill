import json
import subprocess
import sys
import unittest
from pathlib import Path


HELPER = Path(__file__).resolve().parents[1] / "scripts" / "skill_diagnostic_helper.py"


def check(source, output):
    result = subprocess.check_output([
        sys.executable, str(HELPER), "check-claims", "--source", source, "--output", output,
    ])
    return json.loads(result)


class ClaimsCLITests(unittest.TestCase):
    def test_status_and_evidence(self):
        cases = [
            ("桌面版免費", "桌面版完全免費", "verified", "桌面版免費"),
            ("桌面版免費", "企業版免費", "needs_review", None),
            ("下載免費，匯出需付費", "下載免費", "verified", "下載免費"),
            ("本週修正了一個錯字", "程式碼已經開源", "needs_review", None),
            ("企業版已公開", "企業版已開源", "needs_review", None),
            ("企業版已開源", "企業版已經開源", "verified", "企業版已開源"),
            ("桌面版預計下個月上線", "桌面版預計明年上線", "needs_review", None),
            ("桌面版尚未上線", "桌面版已上線", "contradicted", None),
            ("桌面版免費", "免費", "needs_review", None),
            ("下載需付費", "歡迎大家下載", "needs_review", None),
            ("如果續約，桌面版免費", "桌面版免費", "needs_review", None),
            ("桌面版已公開，下載免費", "下載免費", "needs_review", None),
            ("桌面版需付費", "桌面版採月費訂閱", "needs_review", None),
            ("企業版採月費訂閱", "企業版採年費訂閱", "needs_review", None),
            ("桌面版免費。但這項優惠只限在學學生。", "桌面版免費", "needs_review", None),
            ("桌面版免費。更正：桌面版目前沒有免費方案。", "桌面版免費", "needs_review", None),
        ]
        for source, output, status, evidence in cases:
            with self.subTest(source=source, output=output):
                result = check(source, output)
                self.assertEqual(result["status"], status)
                self.assertEqual(result["passed"], status == "verified")
                self.assertEqual([item["source_clause"] for item in result["verified_alignments"]],
                                 [evidence] if evidence else [])
                if evidence:
                    self.assertEqual(result["verified_alignments"][0]["output_claim"], output)

    def test_mixed_status(self):
        source = "桌面版免費，企業版需付費"
        for extra, status in [("絕對安全", "needs_review"), ("企業版免費，絕對安全", "contradicted")]:
            with self.subTest(extra=extra):
                result = check(source, "桌面版免費，" + extra)
                self.assertEqual(result["status"], status)
                self.assertFalse(result["passed"])
                self.assertEqual(result["verified_alignments"][0]["source_clause"], "桌面版免費")
                if status == "contradicted":
                    self.assertIn("企業版需付費", [issue.get("source_clause") for issue in result["issues"]])

    def test_original_benchmark(self):
        subprocess.run([sys.executable, str(HELPER), "test-polarity"], capture_output=True, check=True)


if __name__ == "__main__":
    unittest.main()
