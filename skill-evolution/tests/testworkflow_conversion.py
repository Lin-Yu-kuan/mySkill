"""Conversion scaffolding and runtime contracts; not AI quality evaluation."""
from argparse import Namespace
import json
import os
from pathlib import Path
import sys
import subprocess
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import workflow_project as project
import workflow_runtime as runtime

HANDLERS = '''
def valid(data, context, run_dir):
    if not isinstance(data.get("text"), str) or not data["text"].strip():
        raise ValueError("text required")

def render(context, output_dir):
    text = context["dependencies"]["draft"]["text"]
    path = output_dir / "report.txt"
    path.write_text(text, encoding="utf-8")
    return {"text": text, "artifacts": [path.relative_to(output_dir.parents[3]).as_posix()]}
'''


class ConversionTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.base = Path(self.tmp.name)
        self.source = self.base / "source"
        self.source.mkdir()
        (self.source / "SKILL.md").write_text("# Produce text\nPreserve source claims.\n", encoding="utf-8")
        self.root = self.base / "project"
        project.initialize(self.source, self.root)
        self.run = self.root / "runs" / "one"
        self.input = self.base / "inputs.json"
        project.write(self.input, {"data": {"topic": "trees"}, "files": []})
        self.flow = {"version": 1, "steps": [
            {"id": "draft", "kind": "ai", "needs": [], "prompt": "Write text", "validator": "valid"},
            {"id": "render", "kind": "local", "needs": ["draft"], "handler": "render", "validator": "valid"}]}
        project.write(self.root / "workflow.json", self.flow)
        (self.root / "handlers.py").write_text(HANDLERS, encoding="utf-8")

    def tearDown(self):
        self.tmp.cleanup()

    def call(self, name, **kw):
        defaults = dict(command=name, run_dir=self.run, inputs=self.input, human_confirmed=False,
                        reason="user requested revision", step="draft", reply=self.base / "reply.json")
        defaults.update(kw)
        return runtime.execute(self.root, Namespace(**defaults))

    def packet(self):
        return project.read(Path(self.call("next")["packet"]))

    def submit(self, packet, data, **kw):
        reply = {**packet["reply"], "data": data}
        project.write(self.base / "reply.json", reply)
        return self.call("submit", **kw)

    def test_scaffold_does_not_touch_source_and_is_not_complete(self):
        self.assertEqual(project.manifest(self.source), project.read(self.root / "source-manifest.json")["files"])
        result = project.check(self.root, self.source)
        self.assertFalse(result["passed"])
        self.assertFalse(result["tests_executed"])

    def test_destination_overlap_and_overwrite_rejected(self):
        for path in (self.source / "child", self.base, self.root):
            with self.assertRaises(ValueError):
                project.initialize(self.source, path)

    def ready(self):
        project.write(self.root / "conversion.json", {"status": "ready", "unresolved": [], "requirements": [
            {"id": "R1", "source": "SKILL.md", "locator": "Produce text", "description": "Produce faithful text",
             "steps": ["draft", "render"], "verification": "Test output and human claim review"}]})
        (self.root / "tests" / "test_result.py").write_text("# Fixture; project check does not execute tests\n", encoding="utf-8")

    def test_static_checker_separates_structure_from_behavior(self):
        self.ready()
        result = project.check(self.root, self.source)
        self.assertTrue(result["passed"], result)
        self.assertEqual(result["semantic_quality"], "not_verified")
        (self.source / "SKILL.md").write_text("changed", encoding="utf-8")
        self.assertFalse(project.check(self.root, self.source)["passed"])

    def test_end_to_end_text_and_local_artifact(self):
        self.call("start")
        packet = self.packet()
        self.assertTrue(self.submit(packet, {"text": "faithful content"})["accepted"])
        self.assertTrue(self.submit(packet, {"text": "faithful content"})["duplicate"])
        result = self.call("next")
        self.assertTrue(result["accepted"], result)
        self.assertTrue(all(t["state"] == "passed" for t in self.call("status")["tasks"]))
        paths = list((self.run / "attempts").rglob("report.txt"))
        self.assertEqual(len(paths), 1)
        self.assertEqual(paths[0].read_text(encoding="utf-8"), "faithful content")

    def test_retries_stop_and_restart_keeps_packet(self):
        self.call("start")
        for n in range(3):
            packet = self.packet()
            self.assertEqual(packet, self.packet())
            self.assertFalse(self.submit(packet, {})["accepted"])
            if n < 2:
                self.call("retry")
        with self.assertRaises(ValueError):
            self.call("retry")

    def test_reopen_invalidates_downstream_and_old_reply(self):
        self.call("start")
        packet = self.packet()
        self.submit(packet, {"text": "old"})
        self.call("next")
        self.call("reopen")
        with self.assertRaises(ValueError):
            self.submit(packet, {"text": "old"})
        self.assertTrue(all(t["state"] == "pending" for t in self.call("status")["tasks"]))

    def test_input_file_change_rejects_old_reply(self):
        evidence = self.base / "evidence.txt"
        evidence.write_text("first", encoding="utf-8")
        project.write(self.input, {"data": {}, "files": ["evidence.txt"]})
        self.call("start")
        packet = self.packet()
        evidence.write_text("second", encoding="utf-8")
        self.call("resume")
        with self.assertRaises(ValueError):
            self.submit(packet, {"text": "obsolete"})

    def test_changed_artifact_only_reopens_affected_steps(self):
        self.call("start")
        self.submit(self.packet(), {"text": "good"})
        self.call("next")
        next((self.run / "attempts").rglob("report.txt")).write_text("tampered", encoding="utf-8")
        tasks = {t["id"]: t for t in self.call("resume")["tasks"]}
        self.assertEqual(tasks["draft"]["state"], "passed")
        self.assertEqual(tasks["render"]["state"], "pending")

    def test_human_step_needs_explicit_confirmation(self):
        self.flow["steps"][0]["kind"] = "human"
        project.write(self.root / "workflow.json", self.flow)
        self.call("start")
        packet = self.packet()
        with self.assertRaisesRegex(ValueError, "確認"):
            self.submit(packet, {"text": "chosen"})
        self.assertTrue(self.submit(packet, {"text": "chosen"}, human_confirmed=True)["accepted"])

    def test_graph_and_missing_handler_rejected(self):
        self.ready()
        self.flow["steps"][0]["needs"] = ["render"]
        project.write(self.root / "workflow.json", self.flow)
        self.assertFalse(project.check(self.root)["passed"])
        self.flow["steps"][0]["needs"] = []
        self.flow["steps"][0]["validator"] = "missing"
        project.write(self.root / "workflow.json", self.flow)
        self.assertFalse(project.check(self.root)["passed"])

    def test_domain_independence_numeric_analysis(self):
        project.write(self.root / "workflow.json", {"version": 1, "steps": [
            {"id": "sum", "kind": "local", "handler": "calculate", "validator": "check"}]})
        (self.root / "handlers.py").write_text('''
def calculate(context, output_dir):
    return {"total": sum(context["inputs"]["numbers"])}
def check(data, context, run_dir):
    if data["total"] != sum(context["inputs"]["numbers"]):
        raise ValueError("wrong total")
''', encoding="utf-8")
        project.write(self.input, {"data": {"numbers": [3, 4, 5]}, "files": []})
        self.call("start")
        self.assertTrue(self.call("next")["accepted"])
        self.assertEqual(self.call("status")["tasks"][0]["state"], "passed")

    def test_interrupted_local_step_is_not_silently_replayed(self):
        self.call("start")
        self.submit(self.packet(), {"text": "good"})
        self.call("status")
        db = runtime.connect(self.run)
        db.execute("UPDATE tasks SET state='awaiting',attempt=1 WHERE id='render'")
        db.commit()
        db.close()
        self.assertIn("中斷", self.call("next")["error"])
        self.assertFalse(list((self.run / "attempts").rglob("report.txt")))

    def test_auxiliary_code_change_invalidates_old_packet(self):
        (self.root / "rules.txt").write_text("v1", encoding="utf-8")
        self.flow["code_files"] = ["rules.txt"]
        project.write(self.root / "workflow.json", self.flow)
        self.call("start")
        packet = self.packet()
        (self.root / "rules.txt").write_text("v2", encoding="utf-8")
        self.call("resume")
        with self.assertRaises(ValueError):
            self.submit(packet, {"text": "old"})

    def test_generated_cli_runs_without_source_skill(self):
        # The generated runtime has no imports from skill-evolution or the source.
        self.source.rename(self.base / "source-renamed")
        env = {**os.environ, "PYTHONUTF8": "1"}
        def run(*args):
            process = subprocess.run([sys.executable, str(self.root / "workflow.py"), *args,
                                      "--run-dir", str(self.run)], cwd=self.root, env=env,
                                     capture_output=True, text=True, encoding="utf-8")
            self.assertEqual(process.returncode, 0, process.stdout + process.stderr)
            return json.loads(process.stdout)
        run("start", "--inputs", str(self.input))
        packet = project.read(Path(run("next")["packet"]))
        reply_path = self.base / "cli-reply.json"
        project.write(reply_path, {**packet["reply"], "data": {"text": "portable"}})
        self.assertTrue(run("submit", "--reply", str(reply_path))["accepted"])
        self.assertTrue(run("next")["accepted"])


if __name__ == "__main__":
    unittest.main()
