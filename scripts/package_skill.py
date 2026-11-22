"""Build a small reproducible, licensed skill archive without replacing an output."""

import argparse
import hashlib
import re
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / ".agents" / "skills" / "secure-inbox-agent"
FILES = (
    "LICENSE",
    "SKILL.md",
    "agents/openai.yaml",
    "references/gmail-workflow.md",
    "references/security.md",
    "references/testing.md",
)


def package_skill(output: Path) -> str:
    manifest = (SKILL / "SKILL.md").read_text(encoding="utf-8")
    if not manifest.startswith("---\nname: secure-inbox-agent\n") or not re.search(
        r"^description: .+", manifest.split("---", 2)[1], re.MULTILINE
    ):
        raise ValueError("skill metadata is invalid")
    for reference in re.findall(r"\]\((references/[^)]+)\)", manifest):
        if reference not in FILES or not (SKILL / reference).is_file():
            raise ValueError("skill reference is missing or outside the package")
    if (SKILL / "LICENSE").read_bytes() != (ROOT / "LICENSE").read_bytes():
        raise ValueError("skill license must match the root MIT license")
    contents = {name: (SKILL / name).read_bytes() for name in FILES}
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("xb") as handle:
        with zipfile.ZipFile(
            handle, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9
        ) as archive:
            for name, data in contents.items():
                entry = zipfile.ZipInfo(
                    f"secure-inbox-agent/{name}", date_time=(1980, 1, 1, 0, 0, 0)
                )
                entry.create_system = 3
                entry.external_attr = 0o100644 << 16
                entry.compress_type = zipfile.ZIP_DEFLATED
                archive.writestr(entry, data, compresslevel=9)
    return hashlib.sha256(output.read_bytes()).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True, help="new ZIP path, must not exist")
    args = parser.parse_args()
    digest = package_skill(args.output)
    print(f"{digest}  {args.output.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
