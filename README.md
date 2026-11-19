<a id="top"></a>

<div align="center">

<h1>🛡️ Secure Inbox AI Agent</h1>

<strong>A safer way to build, test, and reuse AI-powered inbox workflows</strong>

Offline-first Gmail assistant · Human-reviewed drafts · Reusable Codex Agent Skill

<a href="#quick-start">Get started</a> · <a href="#use-the-codex-skill">Use the Codex skill</a> · <a href="#security-model">Security model</a> · <a href="#documentation">Documentation</a>

</div>

## 👋 What is this project?

Secure Inbox AI Agent is an open-source reference implementation of an inbox assistant that reads and categorizes messages, prepares draft replies, and leaves the final decision to a human. It pairs a Python application with a reusable [Codex Agent Skill](.agents/skills/secure-inbox-agent/SKILL.md) named `secure-inbox-agent`.

Most AI agent demos focus on what an assistant can do. This project also focuses on what it must not do: follow malicious instructions embedded in messages, bypass approved business rules, expose credentials, or send mail autonomously.

You can use the repository in two different ways:

| You want to… | Use… | What happens |
| --- | --- | --- |
| Try a secure inbox workflow | Python application | Run a fully offline demo with sample emails, simulated state transitions, and reviewable drafts. |
| Build or audit an inbox agent in another project | Codex skill ([`$secure-inbox-agent`](.agents/skills/secure-inbox-agent/SKILL.md)) | Codex follows reusable security and testing instructions while working on that project's code. |

> [!IMPORTANT]
> The skill is not a standalone background service. It is a set of instructions for Codex. The Python app is the executable inbox workflow. Neither automatically sends emails; live Gmail access is explicitly opt-in.

### Where could this be useful?

- Developers building a Gmail assistant without giving an AI model a general-purpose mailbox client.
- Creators and small teams reviewing business inquiries or sponsorship requests while keeping pricing decisions under human control.
- Security-minded AI builders testing prompt injection, unsafe tools, retry behavior, and unexpected input.
- Codex users who want a repeatable checklist for new inbox-agent projects rather than rewriting instructions every time.

## ✨ What it can do

| Capability | How it works |
| --- | --- |
| Classify inbox messages | Categorizes business inquiries, sponsorships, general questions, spam, suspicious messages, and items needing manual review. |
| Create drafts, not send messages | The agent-facing boundary allows draft creation but exposes no send operation or unrestricted Gmail API access. |
| Keep people in control | Drafts remain available for review; unclear or sensitive cases are routed to manual review. |
| Apply business rules | Sponsorship workflows require explicitly configured approved terms and a minimum price; email text cannot change these rules. |
| Resist common prompt injections | Treats email as untrusted data; suspicious instructions trigger review. |
| Handle repeated work | Uses in-process tracking plus a per-message draft marker so a restarted single worker can recover an existing draft. |
| Run without accounts or API keys | The default demo uses synthetic messages, deterministic classification, and an in-memory mailbox. |
| Test agent safety | Includes pytest checks for draft-only behavior, malformed inputs, policy checks, and failure paths. |
| Inspect offline HTML in Docker (optional) | Can process an already-provided HTML snapshot in a restricted, network-disabled container. It does not fetch live URLs. |
| Reuse instructions across repositories | Installs a `SKILL.md` plus references for Codex at user or project scope. |

## 🧭 How it works

~~~mermaid
flowchart TD
    Offline["Synthetic emails (default)"] --> Classify["Classify messages"]
    Live["Bounded Gmail read (optional OAuth)"] --> Classify
    Classify --> Policy["Check policy and security"]
    Policy -->|"Needs review"| Review["Flag for manual review"]
    Policy -->|"Safe to draft"| Draft["Create in-memory or Gmail draft"]
    Draft --> Human["Human reviews the draft"]
~~~

In live mode, Gmail labels optionally record workflow state. The main implementation lives under [`src/secure_inbox/`](src/secure_inbox/). Its responsibilities are deliberately separated: mailbox operations, classification, policy checks, draft generation, orchestration, and security boundaries. Live operation is limited to one explicitly selected message. See [architecture details](docs/ARCHITECTURE.md).

<a id="quick-start"></a>

## 🚀 Quick start: run the offline demo

This is the recommended first step. No Gmail account, Google Cloud project, Docker Desktop, model API key, or Plurai account is needed.

### Prerequisites

- Python 3.11 or newer
- Git to clone the repository
- A terminal; the examples below use Windows PowerShell

### 1. Get the project

~~~powershell
git clone https://github.com/YellankiKaushik/Skill-YT.git
cd Skill-YT
~~~

### 2. Create a virtual environment

~~~powershell
py -3 -m venv .venv
~~~

If `py` is unavailable but Python is installed, use `python -m venv .venv` instead. The commands below use the virtual environment's interpreter directly, so you do not need to change PowerShell's execution policy.

### 3. Install the project and test tools

~~~powershell
.\.venv\Scripts\python.exe -m pip install -e ".[test]"
~~~

### 4. Run your first agent demo

~~~powershell
.\.venv\Scripts\python.exe -m secure_inbox.cli
~~~

The demo processes three synthetic messages: a general inquiry, a sponsorship request, and a suspicious credential-phishing message. It outputs JSON describing each outcome, simulated labels, and repeated-message handling. With the default policy, it creates one in-memory draft, routes the other messages for review, and demonstrates that the agent cannot invoke a send operation.

**What to expect:** A successful command exits with status 0. The JSON includes `outcomes`, `second_run`, `draft_count`, `labels`, `injection_detected`, and `send_operation_available`.

> [!NOTE]
> The demo's draft is stored only in the demonstration mailbox in memory.

### 5. Run the tests

~~~powershell
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\python.exe -m ruff check src tests scripts
~~~

The [GitHub Actions workflow](.github/workflows/ci.yml) also runs linting, pytest, and the offline demo with Python 3.12. [View CI results](https://github.com/YellankiKaushik/Skill-YT/actions/workflows/ci.yml).

On macOS or Linux:

~~~bash
python3 -m venv .venv
.venv/bin/python -m pip install -e '.[test]'
.venv/bin/python -m secure_inbox.cli
~~~

<a id="use-the-codex-skill"></a>

## 🤖 Use the skill in Codex

The `secure-inbox-agent` skill is intended for anyone who wants Codex to build, review, or improve an inbox-connected agent in another codebase. It contains [`SKILL.md`](.agents/skills/secure-inbox-agent/SKILL.md) plus focused guidance on [security](.agents/skills/secure-inbox-agent/references/security.md), [Gmail state management](.agents/skills/secure-inbox-agent/references/gmail-workflow.md), and [adversarial testing](.agents/skills/secure-inbox-agent/references/testing.md).

### Option A — Install for your user (all projects)

From the cloned Skill-YT repository:

~~~powershell
.\.venv\Scripts\python.exe scripts/install_skill.py --user --dry-run
.\.venv\Scripts\python.exe scripts/install_skill.py --user
~~~

On Windows, the installed folder normally becomes `C:\Users\<your-username>\.agents\skills\secure-inbox-agent\`.

### Option B — Install in one project only

~~~powershell
.\.venv\Scripts\python.exe scripts/install_skill.py --project "C:\Projects\my-app" --dry-run
.\.venv\Scripts\python.exe scripts/install_skill.py --project "C:\Projects\my-app"
~~~

This creates `C:\Projects\my-app\.agents\skills\secure-inbox-agent\`. The skill can then be version-controlled with that project if desired.

**Existing installation?** The installer intentionally refuses to overwrite it, including during dry-run. To update, fetch the latest source, move the existing skill folder to a backup outside `.agents/skills/`, and reinstall. Restore the backup if installation fails.

### Invoke the skill

1. Open Codex in your target project's root directory.
2. Start a new session if you installed or updated the skill while Codex was already open.
3. Use the skill picker by typing `$`, or mention `$secure-inbox-agent` directly.
4. Ask Codex to inspect your code, make changes, and run the target project's actual tests.

A first prompt to copy:

~~~text
$secure-inbox-agent Audit this repository's inbox agent. Identify
any Gmail sending capability, prompt-injection risks, missing human
review gates, broken business-policy checks, and failure-handling gaps.
Cite file paths and line numbers. Use synthetic test data only.
~~~

The installed skill provides instructions. Codex must still have permission to read and write the target repository and access a working model service. Skill discovery can succeed even when an end-to-end Codex turn is blocked by connectivity.

## 💬 Example Codex prompts

Use these prompts from the project you want Codex to work on.

### 1. Build a new draft-only assistant

~~~text
$secure-inbox-agent Build a minimal draft-only Gmail assistant in
this repository. Start offline with synthetic emails and mocks.
Separate mailbox access, classification, policy, and drafting.
Add deterministic security tests. Never send real email.
~~~

### 2. Audit an existing integration

~~~text
$secure-inbox-agent Review this inbox integration for OAuth scope
risks, exposed send tools, prompt injection, unsafe logging, retries,
and missing human approval. Cite the affected files and propose fixes.
~~~

### 3. Test sponsorship and pricing rules

~~~text
$secure-inbox-agent Add tests proving that malicious emails cannot
change approved sponsorship terms or bypass a configured minimum price.
Route uncertain cases for manual review.
~~~

### 4. Review link inspection

~~~text
$secure-inbox-agent Audit the handling of email URLs and HTML.
Do not fetch links automatically. Test unsafe inputs and verify that
offline inspection does not access the network or host credentials.
~~~

### 5. Trace why a draft was created

~~~text
$secure-inbox-agent Trace an incoming message through classification,
policy decisions, draft creation, and state transitions. Explain the
human review step and add tests for retries or duplicate delivery.
~~~

<a id="security-model"></a>

## 🔐 Security first, by design

This repository demonstrates defense in depth, not a guarantee that every possible agent attack is prevented.

| Safeguard | What it means | Important limitation |
| --- | --- | --- |
| Draft-only tool interface | The agent cannot call a send endpoint through the exposed mailbox operations. | Google's OAuth scopes may still authorize sending to other holders of the same credentials. |
| Human review | Generated drafts are not sent by the application. | A person must inspect them before deciding whether to send. |
| Untrusted-input treatment | Incoming email text is data, never higher-priority instructions. | Heuristic injection detection cannot catch every malicious message. |
| Deterministic business checks | Approved sponsorship terms and price limits come from configuration, not email instructions. | A human still needs to judge ambiguous financial or contractual offers. |
| Offline-first execution | Tests and the default demo do not require live mailbox access. | Mocked tests are not evidence of full production reliability. |
| Restricted HTML inspection | An optional Docker container has no network, no privileged access, and no mounted secrets. | It cannot visit arbitrary external websites; live browsing is not implemented. |
| Draft recovery marker | An opaque marker on each app-created draft lets a restarted single worker find a draft created before a crash. | Concurrent workers are unsupported; Gmail visibility delays, manual draft deletion, or API outages can still require operator review. This is not exactly-once delivery. |

**Gmail OAuth warning:** The Google `gmail.compose` and `gmail.modify` scopes can authorize sending email. The narrow application boundary removes send methods from this agent's interface, but it does not change Google's underlying OAuth permissions. Review the [official Gmail scope table](https://developers.google.com/workspace/gmail/api/auth/scopes) before connecting an account. For live experiments, use a dedicated test mailbox first. See [security details](docs/SECURITY.md).

## ⚙️ Optional configuration and live Gmail

Offline mode is the default. The following integrations are optional and must be explicitly configured.

| Setting | Purpose | Default / note |
| --- | --- | --- |
| `OPENAI_API_KEY` | Optional model provider credential | Unset; offline deterministic fallback works without it. |
| `OPENAI_BASE_URL` | OpenAI-compatible chat completions endpoint | `https://api.openai.com/v1` |
| `CLASSIFIER_MODEL` | Model used for classification | Unset; choose an actually available model ID. |
| `DRAFTER_MODEL` | Model used for drafting | Unset; deterministic template fallback is available. |
| `GMAIL_CREDENTIALS_PATH` | Local OAuth desktop client JSON | `credentials.json`; keep private. |
| `GMAIL_TOKEN_PATH` | Local Gmail OAuth token JSON | `token.json`; keep private. |
| `GMAIL_ENABLE_LABEL_MUTATION` | Permit Gmail label creation and updates | `false`; enabling adds `gmail.modify`, which can authorize sending. Labels are optional. |
| `SPONSORSHIP_ENABLED` | Allow policy-controlled sponsorship drafting | `false` |
| `SPONSORSHIP_APPROVED_TERMS` | Terms approved by a person | Empty by default. |
| `SPONSORSHIP_MINIMUM_PRICE` | Minimum sponsorship offer for automated drafting | Unset by default. |

Use [`.env.example`](.env.example) as a reference for environment variable names. The application reads process environment variables; it does not automatically load a `.env` file. Never commit credentials, OAuth tokens, or API keys.

### Enabling Gmail intentionally

1. Follow the [Windows Gmail setup guide](docs/SETUP_WINDOWS.md) to create a Google Cloud project, enable the Gmail API, and configure desktop OAuth.
2. Install optional dependencies with `python -m pip install -e ".[gmail]"` (or use your virtual environment's Python).
3. Set `GMAIL_CREDENTIALS_PATH` and `GMAIL_TOKEN_PATH` to private local files. By default the app requests `gmail.readonly` and `gmail.compose`; workflow labels are optional.
4. Review the scope permissions before granting consent. Set `GMAIL_ENABLE_LABEL_MUTATION=true` only if you explicitly want label updates; this adds `gmail.modify`, which can authorize sending.
5. In a dedicated test account, select one synthetic test message and execute `python -m secure_inbox.cli --live --message-id YOUR_TEST_MESSAGE_ID`.

The live entry point requires one explicit Gmail message ID and never lists or processes the rest of the inbox. It can create a draft; workflow labels are optional. It does not start continuous polling or send messages. Production deployment and unattended processing need additional design and review; this project is a reference implementation, not a turnkey autonomous mailbox service.

### Docker (optional)

To build the offline HTML snapshot inspector when Docker Desktop's engine is running:

~~~powershell
docker build -t secure-inbox-html-inspector:local scripts/sandbox
~~~

The inspector processes caller-provided HTML in a network-disabled container. It does not click email links or fetch remote webpages. Docker isn't required for the main demo or CI.

### Plurai (optional)

The research references Plurai for AI-agent simulations. This repository has independent deterministic tests; it does not claim to have completed a live Plurai integration or evaluation.

## 🗂️ Repository structure

~~~text
Skill-YT/
├── .agents/skills/secure-inbox-agent/  # Reusable Codex skill and references
├── .github/workflows/ci.yml          # Lint + tests + offline demo in CI
├── docs/                             # Architecture, security, Windows setup
├── scripts/                          # Skill installer and Docker assets
├── dist/                             # Clean reusable skill distribution ZIP
├── src/secure_inbox/                 # Python application modules
├── tests/                            # Synthetic fixtures and tests
├── .env.example                      # Environment variable reference
├── pyproject.toml                    # Python package and test configuration
├── VIDEO_RESEARCH.md                 # Research brief and provenance
├── README.md                         # You are here
└── LICENSE                           # MIT license
~~~

## 🧪 Project status and verification

| Area | Status |
| --- | --- |
| Python application / offline demo | 45 tests passed locally; Ruff, package dependency check, and offline demo passed. One real-Docker test is skipped on this machine and runs in the Docker CI job. |
| Reusable Codex skill | Required `name`/`description` metadata and all references are present. The user-wide install matches the repository package; Codex prompt metadata exposes the skill. |
| Cross-project offline acceptance | Project-local skill installation matched the package; an independent synthetic inbox example passed 3 tests. |
| GitHub CI | Runs Ruff, pytest, the offline demo, and a real Docker inspector integration test. [View workflow status](https://github.com/YellankiKaushik/Skill-YT/actions/workflows/ci.yml). |
| End-to-end live Codex invocation | Blocked before model execution: the configured `gpt-6.1-sol` model is unsupported for this ChatGPT sign-in. Skill discovery itself was confirmed. |
| Live Gmail account | Not connected or tested. OAuth client/token are absent; the Gmail workflow is prepared for one explicitly selected Inbox message. |
| Docker inspector | Local Docker engine is unavailable. GitHub Actions runs the real container integration test; see the release-readiness document for the result. |
| External AI provider | Not tested; classifier and drafter model IDs are unset, so no external model request was made. |
| Plurai | Official product documentation reviewed; no authorized integration or simulation run. |

This table distinguishes code that exists, tests that have run, and integrations not yet verified. It should not be read as a production security certification.

<a id="documentation"></a>

## 📚 Documentation

- [Windows setup](docs/SETUP_WINDOWS.md) — Python, OAuth, optional model provider, and Docker prerequisites.
- [Architecture](docs/ARCHITECTURE.md) — Components, data flow, and single-worker behavior.
- [Security model](docs/SECURITY.md) — Trust boundaries, OAuth limitations, and threat checklist.
- [Codex skill definition](.agents/skills/secure-inbox-agent/SKILL.md) — The portable `secure-inbox-agent` instructions.
- [Release readiness](docs/RELEASE_READINESS.md) — Verification scope, live integration prerequisites, and remaining limits.
- [Video research brief](VIDEO_RESEARCH.md) — Design input and identified assumptions.
- [Official Codex skills documentation](https://developers.openai.com/codex/skills/) — How Codex discovers and uses skills.

### About the original tutorial

This project grew out of a research exercise based on *My Workflow For Building AI Agents Securely*. The supplied [`VIDEO_RESEARCH.md`](VIDEO_RESEARCH.md) informed the design. The actual video transcript and specific timestamped claims were not independently verified during implementation, so this repository documents a defensible interpretation rather than claiming a line-by-line reproduction of the creator's private system.

## 🤝 Contributing

Bug reports, documentation improvements, and focused pull requests are welcome. For changes affecting Gmail permissions, draft persistence, live browsing, or model prompts, include tests and describe any change to the trust boundary. Run the project tests and Ruff before opening a PR.

Please do not include real email content, tokens, OAuth client secrets, API keys, or personal mailbox screenshots in issues or pull requests.

## 📄 License

Released under the [MIT License](LICENSE).

<div align="center">

<strong>Build useful AI agents. Keep the human in control.</strong>

<a href="#top">⬆ Back to top</a>

</div>
