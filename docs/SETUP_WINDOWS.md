# Windows setup

## Local Python and offline mode

Install Python 3.11+ for your user account, then in PowerShell:

```powershell
cd C:\path\to\Skill-YT
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -e ".[test]"
python -m secure_inbox.cli
pytest -q
ruff check src tests scripts
```

Offline mode needs no Gmail credentials, model key, Docker, or internet access after package installation.

## Optional model provider

Set `OPENAI_API_KEY`, `CLASSIFIER_MODEL`, and `DRAFTER_MODEL` in your local environment. Choose model identifiers currently available to your account; none are bundled or assumed. Set `OPENAI_BASE_URL` for an OpenAI-compatible endpoint and adjust token/time limits. Do not commit `.env` or secrets. The deterministic fallback remains available when model settings are missing or requests fail.

## Google Cloud and Gmail

1. Create a Google Cloud project and enable the Gmail API.
2. Configure the OAuth consent screen and create an OAuth Client ID for a desktop application. Download its client JSON to a private local path; do not commit it.
3. Install the optional adapter dependencies: `python -m pip install -e ".[gmail]"`.
4. Start with `gmail.readonly` and `gmail.compose`; Google classifies both as restricted scopes. `gmail.compose` authorizes draft management and sending. The application does not expose sending, but OAuth cannot be described as draft-only.
5. Label mutations are off by default. To enable them, set `GMAIL_ENABLE_LABEL_MUTATION=true`; this adds `gmail.modify`, which grants Gmail read, compose, and send permissions. Existing labels are looked up before creation.
6. Set `GMAIL_CREDENTIALS_PATH` and `GMAIL_TOKEN_PATH` to private local files. Run `python -m secure_inbox.cli --live` to trigger desktop OAuth and read one inbox page. No polling loop runs.
7. Inspect drafts manually in Gmail's Drafts folder. The app never sends them.

Google may require OAuth verification for restricted scopes. Review Google's [scope table](https://developers.google.com/workspace/gmail/api/auth/scopes) and [draft creation method](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.drafts/create) before enabling account access.

## Docker HTML snapshot inspection

Install Docker Desktop, build `docker build -t secure-inbox-html-inspector:local scripts/sandbox`, and pass an already acquired HTML snapshot to `OfflineHtmlInspector.inspect_html`. The container runs without network access and cannot inspect arbitrary internet pages. The agent does not fetch URLs.

## Reusable skill

`python scripts/install_skill.py --project "C:\path\to\another-project"` copies the complete skill to that repository. Use `--user` for `~/.agents/skills`. Existing installations are preserved; the installer raises an error rather than replacing them. A dry run is available with `--dry-run`.

