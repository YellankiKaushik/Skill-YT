# Test Skill-YT yourself

This guide walks through the project using synthetic data. The Python and Node examples do not contact Gmail or send email. A real Codex skill invocation is a separate check and requires an account-supported model session.

## Level 1 — Python offline demo

From a fresh clone, install Python 3.11+ and run these commands in Windows PowerShell:

~~~powershell
git clone https://github.com/YellankiKaushik/Skill-YT.git
Set-Location Skill-YT
py -3.11 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e ".[test]"
.\.venv\Scripts\python.exe -m secure_inbox.cli
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\python.exe -m ruff check src tests scripts
~~~

The virtual environment is used through its interpreter path, so activation and PowerShell execution-policy changes are unnecessary. If the <code>py</code> launcher is unavailable, use <code>python -m venv .venv</code> with Python 3.11+.

### Expected demo behavior

The CLI prints JSON with these observed results:

- <code>demo-1</code> is <code>drafted</code>: a generic acknowledgment is stored in the in-memory mailbox.
- <code>demo-2</code> is <code>needs_review</code>: sponsorship terms and a minimum price are not configured.
- <code>demo-3</code> is <code>needs_review</code>: the synthetic message contains suspicious text and prompt-injection language.
- Every ID in <code>second_run</code> is <code>duplicate_skipped</code>.
- <code>draft_count</code> is <code>1</code>; <code>labels</code> are simulated in-memory states.
- <code>injection_detected</code> is <code>true</code>; <code>send_operation_available</code> is <code>false</code>.

A baseline local run produced **45 passed, 1 skipped** for Python, with Ruff passing. The skipped test required a local Docker engine. GitHub Actions separately passed the real Docker inspector integration job. Counts are dated observations; use your own command output for the current clone.

The offline demo has no review UI. Its draft stays in memory. Live Gmail drafts, if a user intentionally configures live access, must be inspected by a human; the app does not send messages.

On macOS/Linux, use:

~~~bash
python3 -m venv .venv
.venv/bin/python -m pip install -e '.[test]'
.venv/bin/python -m secure_inbox.cli
.venv/bin/python -m pytest -q
.venv/bin/python -m ruff check src tests scripts
~~~

## Level 2 — Independent Node.js acceptance example

Install a supported Node.js LTS release, then from the repository root run:

~~~powershell
Set-Location examples\skill-acceptance-test
node --version
npm --version
npm test
npm run demo
~~~

No <code>npm install</code> is required. The example has no external dependencies and only reads synthetic <code>messages.json</code>.

The tests cover ordinary inquiries, sponsorship pressure and human review, prompt injection, credential phishing, no send capability, duplicate events, crash-window recovery, malformed/uncertain input, and absent network/Gmail/provider integrations. A verified run produced **12 passed, 0 failed, 0 skipped**. The demo keeps safe drafts pending review, routes suspicious content to review without a draft, and skips the repeated ID. No email is sent.

## Level 3 — Real Codex skill invocation

This is different from reading <code>SKILL.md</code> or seeing the skill in a picker. A successful invocation requires a real model-backed Codex task that follows the skill workflow in another project and produces inspectable work and test output.

### Install into a disposable project

Run these commands from the root of the cloned Skill-YT repository:

~~~powershell
$skillRepo = (Get-Location).Path
$sandboxProject = Join-Path $env:TEMP 'secure-inbox-skill-sandbox'
New-Item -ItemType Directory -Force -Path $sandboxProject | Out-Null
Set-Content -LiteralPath (Join-Path $sandboxProject 'README.md') -Value '# Disposable offline inbox example'
.\.venv\Scripts\python.exe scripts\install_skill.py --project $sandboxProject --dry-run
.\.venv\Scripts\python.exe scripts\install_skill.py --project $sandboxProject
Test-Path (Join-Path $sandboxProject '.agents\skills\secure-inbox-agent\SKILL.md')
~~~

The final command should print <code>True</code>. The installer refuses to overwrite an existing target. Do not move or replace the global skill for this test.

### Run Codex from the disposable project

Open the disposable project in Codex, choose a model offered to your account, and start a new task:

~~~text
$secure-inbox-agent Build a tiny offline inbox example in this disposable
project. Use synthetic messages only. Create fixed acknowledgment drafts
that remain pending human review, flag prompt-injection text for review,
make duplicate processing idempotent for one worker, expose no send, Gmail,
or network operation, and add deterministic tests. Run the tests and show
the actual output. Do not access Gmail or any external provider.
~~~

Review the files and rerun the generated tests. Mark invocation **VERIFIED** only if Codex actually runs the task with the skill and supported model, produces inspectable work, and provides test output that reproduces locally. Skill discovery alone is not proof.

If the model is rejected or the task cannot start, record **NOT VERIFIED** and the actual error. Choose a model offered to the signed-in account; do not force a previously rejected identifier. A prompt template, skill file, or tool discovery is not successful invocation evidence.

In the prior closeout, skill discovery and guidance review were confirmed, but a model-backed invocation was blocked before execution because the configured model was unsupported for the signed-in account. This project does not claim a successful invocation.

## Evidence checklist

Keep the actual output for:

- Python offline CLI demo.
- Python tests and Ruff.
- Node acceptance tests and offline demo.
- Project-local skill installation.
- Model-backed Codex invocation, if it actually ran.
- GitHub Actions Python, Docker inspector, and Node jobs.
- Published [README](../README.md), [v1.1.0 release](https://github.com/YellankiKaushik/Skill-YT/releases/tag/v1.1.0), and [acceptance example](../examples/skill-acceptance-test/README.md).

## Troubleshooting

- **Python setup/install fails:** confirm Python 3.11+, run from the repository root, and check package-index/network access. Use <code>.venv\Scripts\python.exe</code> directly on Windows.
- **Node commands are missing:** install a supported Node.js LTS distribution and reopen PowerShell.
- **Docker tests cannot run locally:** start Docker Desktop/Engine. Python and Node offline examples do not need Docker; GitHub Actions runs the restricted Docker job.
- **Skill does not appear:** verify the project-local <code>SKILL.md</code>, restart Codex, and check the skill picker.
- **Codex model is unsupported:** choose a model offered in the UI; do not repeat a rejected model identifier.
- **Tests fail:** preserve the complete output and first failure, then confirm you are in the right repository or example directory before retrying.

No check in this guide requires Gmail, private messages, or sending email. Keep live Gmail disabled during testing.
