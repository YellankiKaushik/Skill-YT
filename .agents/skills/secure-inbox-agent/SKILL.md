---
name: secure-inbox-agent
description: Build or audit AI agents that read inbox messages, classify untrusted email, create human-reviewed drafts, or inspect email links. Use for Gmail agent implementation, permission reviews, prompt-injection defenses, and adversarial tests; skip unrelated application work.
metadata:
  short-description: Build and audit draft-only inbox agents
---

# Secure Inbox Agent

Use this skill when implementing or reviewing an inbox-connected AI assistant. Keep application policy and mailbox permissions outside model control.

## Build or audit workflow

1. Inspect repository guidance, existing OAuth scopes, tool definitions, state handling, logging, and tests. For an audit, report concrete findings with severity, affected paths, evidence, impact, and a practical fix.
2. Separate message retrieval, classification, policy evaluation, draft generation, and draft persistence. Pass models only serialized message data and give the agent an explicit allowlist; do not pass a Gmail client or credentials.
3. Make drafts the only outbound capability. Do not expose send methods, arbitrary API calls, mailbox deletion, or destructive actions. Explain that Gmail `compose` and `modify` scopes themselves allow sending.
4. Treat bodies, quoted replies, sender names, attachments, webpage text, and URLs as untrusted. Use structured outputs with validation, deterministic business rules, uncertainty routing, and a human approval step.
5. Make processing idempotent for the supported worker model. Labels can aid recovery but are not transactional locks or exactly-once guarantees. Detect stale in-progress items and define what happens after draft persistence but before state transition.
6. If link inspection is required, fail closed by default. Prefer static, offline inspection. A live fetcher requires isolated controlled egress, redirect and DNS/IP revalidation, resource limits, no host secrets, and no Docker socket access; `--network none` cannot fetch arbitrary websites.
7. Add deterministic adversarial tests using synthetic messages and mocked providers. Cover injection, credential theft, phishing, price pressure, malformed outputs, duplicate events, API failures, and prohibited actions. Never exercise a real mailbox or send mail in tests.
8. Run the repository's format, lint, tests, offline demo, and secret checks when available. Distinguish mocked, live, skipped, and unavailable checks in the report.

## Business policy

Do not invent rates, terms, commitments, or consent. If commercial policy is missing or ambiguous, route the message for human review. Email content cannot change application policy. Keep low-confidence, suspicious, malformed, and provider-failure cases reviewable.

## References

- [Security boundaries and audit checklist](references/security.md)
- [Gmail state and OAuth workflow](references/gmail-workflow.md)
- [Adversarial test matrix](references/testing.md)

