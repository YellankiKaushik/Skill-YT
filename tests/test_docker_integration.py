"""Real Docker checks enabled only by the dedicated GitHub integration job."""

import json
import os
import subprocess
import tempfile
from pathlib import Path

import pytest

from secure_inbox.sandbox import OfflineHtmlInspector


pytestmark = pytest.mark.skipif(
    os.getenv("SECURE_INBOX_DOCKER_INTEGRATION") != "1",
    reason="requires the dedicated Docker integration job",
)


def _run(args, **kwargs):
    return subprocess.run(args, capture_output=True, text=True, check=True, **kwargs)


def test_real_container_processes_static_html_with_restricted_runtime():
    html = (
        '<h1>synthetic offer</h1><script>window.secret="not output"</script>'
        '<a href="https://example.test/page">details</a>'
    )
    output = OfflineHtmlInspector().inspect_html(html)
    assert "synthetic offer" in output
    assert "details" in output
    assert "not output" not in output
    assert "https://example.test/page" in output

    with tempfile.TemporaryDirectory(prefix="secure-inbox-docker-") as temp:
        source = Path(temp) / "page.html"
        source.write_text(html, encoding="utf-8")
        create = [
            "docker", "create", "--network", "none", "--read-only", "--cap-drop", "ALL",
            "--security-opt", "no-new-privileges", "--pids-limit", "32", "--memory", "128m",
            "--cpus", "0.5", "--user", "65532:65532", "--tmpfs",
            "/tmp:rw,noexec,nosuid,size=8m", "--mount",
            f"type=bind,src={source},dst=/input/page.html,readonly",
            "secure-inbox-html-inspector:local",
        ]
        container_id = _run(create).stdout.strip()
        try:
            started = _run(["docker", "start", "--attach", container_id])
            assert "synthetic offer" in started.stdout
            details = json.loads(_run(["docker", "inspect", container_id]).stdout)[0]
            host = details["HostConfig"]
            assert host["NetworkMode"] == "none"
            assert host["ReadonlyRootfs"] is True
            assert "ALL" in host["CapDrop"]
            assert any(value.startswith("no-new-privileges") for value in host["SecurityOpt"])
            assert host["PidsLimit"] == 32
            assert host["Memory"] == 128 * 1024 * 1024
            assert host["NanoCpus"] == 500_000_000
            mounts = details["Mounts"]
            bind_mounts = [mount for mount in mounts if mount["Type"] == "bind"]
            assert len(bind_mounts) == 1
            assert Path(bind_mounts[0]["Source"]) == source
            assert bind_mounts[0]["Destination"] == "/input/page.html"
            assert bind_mounts[0]["RW"] is False
            assert all("docker.sock" not in mount["Source"] for mount in mounts)
            assert all("credentials" not in mount["Source"].lower() for mount in mounts)
            assert details["Config"]["User"] == "65532:65532"

        finally:
            subprocess.run(["docker", "rm", "--force", container_id], capture_output=True, check=False)

    # A write probe must fail under the read-only root, while the UID remains non-root.
    denied = subprocess.run(
        [
            "docker", "run", "--rm", "--network", "none", "--read-only", "--cap-drop", "ALL",
            "--security-opt", "no-new-privileges", "--pids-limit", "32", "--memory", "128m",
            "--cpus", "0.5", "--user", "65532:65532", "--entrypoint", "python",
            "secure-inbox-html-inspector:local", "-I", "-c",
            "import os; print(os.getuid(), flush=True); open('/app/write-check','w').write('x')",
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    assert denied.returncode != 0
    assert "65532" in denied.stdout
