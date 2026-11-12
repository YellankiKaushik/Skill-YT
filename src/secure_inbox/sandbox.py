"""Optional offline-only Docker inspection of supplied HTML; live URL browsing is disabled."""

import subprocess
import tempfile
from pathlib import Path


class SandboxUnavailable(RuntimeError):
    pass


class OfflineHtmlInspector:
    def __init__(self, image: str = "secure-inbox-html-inspector:local", timeout: int = 15):
        self.image = image
        self.timeout = timeout

    def inspect_html(self, html: str) -> str:
        if len(html.encode("utf-8")) > 1_000_000:
            raise ValueError("HTML input exceeds 1 MB")
        try:
            with tempfile.TemporaryDirectory(prefix="secure-inbox-") as temp:
                root = Path(temp).resolve()
                source = root / "input.html"
                source.write_text(html, encoding="utf-8")
                command = [
                    "docker", "run", "--rm", "--network", "none", "--read-only", "--cap-drop", "ALL",
                    "--security-opt", "no-new-privileges", "--pids-limit", "32", "--memory", "128m",
                    "--cpus", "0.5", "--user", "65532:65532", "--tmpfs", "/tmp:rw,noexec,nosuid,size=8m",
                    "--mount", f"type=bind,src={source},dst=/input/page.html,readonly", self.image,
                ]
                result = subprocess.run(command, capture_output=True, text=True, timeout=self.timeout, check=False)
                if result.returncode:
                    raise SandboxUnavailable("offline HTML inspection failed")
                return result.stdout[:12000]
        except FileNotFoundError as exc:
            raise SandboxUnavailable("Docker is unavailable; skipping link inspection safely") from exc
        except subprocess.TimeoutExpired as exc:
            raise SandboxUnavailable("offline inspection exceeded its time limit") from exc

    def inspect_url(self, url: str) -> str:
        raise SandboxUnavailable("live URL fetching is disabled; inspect a vetted HTML snapshot offline")

