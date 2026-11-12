"""Install the complete reusable skill without overwriting an existing copy."""

import argparse
import shutil
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser()
    scope = parser.add_mutually_exclusive_group(required=True)
    scope.add_argument("--project", type=Path, help="target project directory")
    scope.add_argument("--user", action="store_true", help="install in ~/.agents/skills")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    source = Path(__file__).resolve().parents[1] / ".agents" / "skills" / "secure-inbox-agent"
    base = (Path.home() / ".agents" / "skills") if args.user else args.project.resolve() / ".agents" / "skills"
    target = base / "secure-inbox-agent"
    if target.exists():
        raise FileExistsError(f"refusing to overwrite existing skill at {target}")
    if args.dry_run:
        print(f"Would copy {source} to {target}")
        return 0
    base.mkdir(parents=True, exist_ok=True)
    shutil.copytree(source, target)
    print(f"Installed skill to {target}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

