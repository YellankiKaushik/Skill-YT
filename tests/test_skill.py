from pathlib import Path


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

