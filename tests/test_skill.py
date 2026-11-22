from pathlib import Path
import hashlib
import re
import subprocess
import sys
import zipfile


ROOT = Path(__file__).parents[1]
SKILL = ROOT / ".agents" / "skills" / "secure-inbox-agent"


def test_skill_has_required_metadata_and_references():
    text = (SKILL / "SKILL.md").read_text(encoding="utf-8")
    assert text.startswith("---\nname: secure-inbox-agent\n")
    assert "description:" in text.split("---", 2)[1]
    for name in ("security.md", "gmail-workflow.md", "testing.md"):
        assert (SKILL / "references" / name).is_file()


def test_installer_refuses_existing_target():
    text = (ROOT / "scripts" / "install_skill.py").read_text(encoding="utf-8")
    assert "if target.exists()" in text and "FileExistsError" in text


def test_reproducible_archive_preserves_skill_and_mit_notice(tmp_path):
    outputs = [tmp_path / "first.zip", tmp_path / "second.zip"]
    for output in outputs:
        subprocess.run(
            [sys.executable, str(ROOT / "scripts/package_skill.py"), "--output", str(output)],
            check=True, capture_output=True,
        )
    assert outputs[0].read_bytes() == outputs[1].read_bytes()
    with zipfile.ZipFile(outputs[0]) as archive:
        assert archive.testzip() is None
        expected = {f"secure-inbox-agent/{name}" for name in (
            "LICENSE", "SKILL.md", "agents/openai.yaml", "references/security.md",
            "references/gmail-workflow.md", "references/testing.md",
        )}
        assert set(archive.namelist()) == expected
        assert all(not Path(name).is_absolute() and ".." not in Path(name).parts for name in archive.namelist())
        assert archive.read("secure-inbox-agent/LICENSE") == (ROOT / "LICENSE").read_bytes()
        archive.extractall(tmp_path / "extracted")
    extracted = tmp_path / "extracted/secure-inbox-agent"
    for source in SKILL.rglob("*"):
        if source.is_file():
            copy = extracted / source.relative_to(SKILL)
            assert hashlib.sha256(copy.read_bytes()).digest() == hashlib.sha256(source.read_bytes()).digest()
    manifest = (extracted / "SKILL.md").read_text(encoding="utf-8")
    for reference in re.findall(r"\]\((references/[^)]+)\)", manifest):
        assert (extracted / reference).is_file()
    result = subprocess.run(
        [sys.executable, str(ROOT / "scripts/package_skill.py"), "--output", str(outputs[0])],
        capture_output=True,
    )
    assert result.returncode != 0
    assert outputs[0].read_bytes() == outputs[1].read_bytes()


def test_project_install_copies_license_and_preserves_existing_target(tmp_path):
    command = [sys.executable, str(ROOT / "scripts/install_skill.py"), "--project", str(tmp_path)]
    subprocess.run([*command, "--dry-run"], check=True, capture_output=True)
    assert not (tmp_path / ".agents").exists()
    subprocess.run(command, check=True, capture_output=True)
    target = tmp_path / ".agents/skills/secure-inbox-agent"
    original = {p.relative_to(SKILL): p.read_bytes() for p in SKILL.rglob("*") if p.is_file()}
    assert len(original) == 6
    assert {p.relative_to(target): p.read_bytes() for p in target.rglob("*") if p.is_file()} == original
    assert (target / "LICENSE").read_bytes() == (ROOT / "LICENSE").read_bytes()
    result = subprocess.run(command, capture_output=True)
    assert result.returncode != 0
    assert b"FileExistsError" in result.stderr
    assert {p.relative_to(target): p.read_bytes() for p in target.rglob("*") if p.is_file()} == original

