# Secure Inbox AI Agent

A small, offline-first Gmail inbox assistant that classifies messages and creates **drafts for a person to review**. Its agent-facing mailbox interface does not expose sending, arbitrary Gmail calls, or destructive operations. Gmail authentication and live access are disabled unless you run `--live`.

## Quick start

Requires Python 3.11 or newer.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[test]"
python -m secure_inbox.cli
pytest -q
ruff check src tests scripts
```

The offline demo uses synthetic messages, makes no network calls, creates one in-memory draft, routes suspicious content for review, shows simulated label states, and reports that sending is unavailable.

## Project layout

- `src/secure_inbox/`: Gmail adapter, model interface, policy checks, orchestration, and offline HTML sandbox.
- `.agents/skills/secure-inbox-agent/`: reusable Codex skill, UI metadata, and focused references.
- `scripts/install_skill.py`: copies the complete skill into project-local or user-wide `.agents/skills` and refuses overwrites.
- `tests/`: deterministic mocks and synthetic messages; no test accesses a real inbox or sends mail.
- `docs/`: architecture, security, and Windows setup.

## Install the reusable skill

From this repository:

```powershell
python scripts/install_skill.py --project "C:\Projects\my-app" --dry-run
python scripts/install_skill.py --project "C:\Projects\my-app"
python scripts/install_skill.py --user
```

In a Codex session for the target project, invoke it with `$secure-inbox-agent` and ask it to implement or audit an inbox agent. The skill folder is portable and can be copied intact to another repository.

## Live Gmail is explicit

Install the optional Google libraries with `python -m pip install -e ".[gmail]"`. Follow [the Windows setup guide](docs/SETUP_WINDOWS.md) before `python -m secure_inbox.cli --live`. The live entry point authenticates and reads a bounded inbox snapshot; it does not poll continuously. The Gmail adapter can create drafts, but there is no send method in its exposed surface.

Google OAuth does not offer a general Gmail draft-only scope: `gmail.compose` can send as well as manage drafts. Gmail label mutation uses `gmail.modify`, which also authorizes sending. See Google's [scope descriptions](https://developers.google.com/workspace/gmail/api/auth/scopes). Application boundaries reduce accidental actions but cannot stop a separate OAuth holder from using those scopes.

## Docker link inspection

Live URL fetching is intentionally disabled. The optional container inspects a caller-provided HTML snapshot without network, with read-only filesystem, dropped capabilities, resource limits, and a non-root UID. Build it with `docker build -t secure-inbox-html-inspector:local scripts/sandbox`. No Docker socket or credentials are mounted. A URL is never fetched by this service.

## Research and design basis

See [VIDEO_RESEARCH.md](VIDEO_RESEARCH.md) and [the implementation notes](docs/ARCHITECTURE.md). The supplied research packet describes a tutorial architecture; its sample commands, environment values, and model names are treated as unverified examples. The project does not depend on Plurai or a commercial model account.

Plurai's official site describes simulated scenario generation, evaluation, mocked tools, and CI-oriented workflows ([FAQ](https://www.plurai.ai/faq)). This project does not run Plurai: no account or compatible integration has been configured. Local adversarial pytest cases remain the required independent checks.

## CI

GitHub Actions installs Python 3.12, runs Ruff, pytest, and the offline demonstration. Live Gmail, model calls, and Docker are not CI prerequisites.

