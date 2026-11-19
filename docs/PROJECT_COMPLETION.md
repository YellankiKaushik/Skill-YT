# Skill-YT Project Completion

## Project

Skill-YT is an offline-first reference application for classifying inbox messages and creating human-reviewed drafts. Its Python application defaults to synthetic data and offline behavior. The reusable `$secure-inbox-agent` Codex skill guides developers building or auditing inbox agents, with emphasis on untrusted email, least capability, review gates, recovery, and adversarial tests.

The original v1.1.0 release remains published: [Skill-YT v1.1.0](https://github.com/YellankiKaushik/Skill-YT/releases/tag/v1.1.0).

## Independent acceptance example

The repository now includes `examples/skill-acceptance-test/`, a standalone Node.js example using built-in modules and synthetic fixtures. It checks ordinary and sponsorship inquiries, prompt injection, credential phishing, human review, duplicate processing, crash-window recovery, malformed input, and absence of sending or network/Gmail integrations. It runs without npm dependencies, Gmail, AI-provider credentials, or Docker.

The example’s source was inspected and the tests and demo were executed locally. Codex skill discovery was confirmed and the installed skill guidance was reviewed. A model-backed skill invocation was not verified: Codex CLI rejected the configured model for the signed-in ChatGPT account before model execution.

## Test results

- Python: **45 passed, 1 skipped** (the Docker integration test is skipped locally because Docker Desktop is unavailable).
- Ruff: passed.
- Python offline demo: passed; no send operation is available.
- Node acceptance test: **12 passed, 0 failed, 0 skipped**.
- Node offline demo: passed; safe drafts remain pending review, prompt injection is routed to manual review, and duplicate input is skipped.
- GitHub Actions: pending publication of the feature branch.

## Publication status

- Acceptance example on `main`: pending pull request and remote verification.
- Pull request: pending.
- Feature commit: pending.
- Final `main` SHA: pending remote verification.
- GitHub Actions run: pending.

## Limitations

Live Gmail remains mocked by user choice. No Gmail account was accessed and no message was sent. External AI-provider and Plurai behavior are not verified. The Node example illustrates single-worker in-memory idempotency and is not evidence of distributed or exactly-once processing. This offline-first project is safe to announce as an offline reference implementation; it is not a claim of production readiness or perfect prompt-injection protection.
