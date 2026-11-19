# V1.1 release readiness

## Verified offline

- Python 3.13.14: 45 tests passed locally. The real Docker test is intentionally skipped unless the dedicated Docker integration job is enabled.
- Ruff, `pip check`, editable package installation as version 1.1.0, and the deterministic offline demo passed.
- Gmail API behavior is covered with synthetic fakes, including duplicate delivery, restart before and after draft creation, label update failure, lost create response, 429 retry, multiple messages in one thread, malformed sender/body handling, bounded message text, and the absence of a send capability.
- Live processing requires one explicitly selected Gmail message ID, verifies it is in Inbox, and does not list or poll the mailbox. Labels are optional. An opaque marker on each draft supports restart recovery for a single worker.
- The user-wide and project-local skill packages match the repository files. Codex prompt metadata lists the skill. A separate synthetic inbox example passed its 3 offline tests.

## External checks and limitations

- **Codex model-backed invocation:** Blocked before execution. The local CLI and a fresh Codex task both rejected the configured `gpt-6.1-sol` model for this ChatGPT sign-in. The skill is discoverable, but its requested model-backed audit/example run is not claimed as successful.
- **Docker:** The local Docker CLI is present, but Docker Desktop is not registered on this Windows installation and no engine is available. GitHub Actions has a real Docker job that builds the image and inspects a synthetic HTML snapshot with network disabled, read-only root, non-root UID, dropped capabilities, resource caps, and only the input snapshot mounted. See the workflow checks for the job result.
- **Gmail:** Optional Google API/OAuth packages are installed and mocked API tests pass. No OAuth client or token is configured, Google Cloud/API readiness is unknown, and no mailbox was accessed. The next test requires a dedicated test account and the official OAuth browser flow. Default scopes are `gmail.readonly` and `gmail.compose`; both are restricted, and `gmail.compose` can authorize sending. Optional label mutation adds `gmail.modify`, which also can authorize sending.
- **External model provider:** Not tested. No classifier/drafter model IDs are configured; no external model request was made.
- **Plurai:** Current public product documentation was reviewed. No authorized integration was available and no simulation was run; the deterministic synthetic tests remain the baseline.

## Release boundary

V1.1 is an offline-first reference implementation. The release does not claim live Gmail, external-model, or Plurai verification. A human must review drafts; the application has no send operation. Gmail OAuth scopes remain broader than the application interface. Draft marker recovery supports one worker and is not an exactly-once or multi-worker guarantee.
