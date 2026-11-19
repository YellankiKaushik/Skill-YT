# Independent acceptance test report

**Scope:** Offline Node.js example using synthetic messages.
**Result:** PASS — 11 tests passed, 0 failed, 0 skipped; `npm run demo` exited successfully.

## Verified behavior

- Routine inquiry creates a fixed acknowledgment draft pending human review.
- Sponsorship inquiry does not invent rates or terms and remains pending review.
- Prompt injection, phishing, and credential theft are routed for review without creating a draft.
- Duplicate events create one draft; retry after persistence recovers it rather than creating another.
- Malformed and uncertain messages are handled without crashing.
- Review accepts approve/reject only. The example exposes no send, Gmail, or arbitrary request operation.
- Demo execution with an empty environment succeeds using only synthetic fixture data.

No Gmail account, OAuth, external provider, Docker, or network connection is used. Source inspection confirms the example imports only Node built-ins and contains no provider or mail-sending integration.

## Skill evidence and limits

The installed `secure-inbox-agent` skill was discovered, and its security/testing guidance was reviewed during project closeout. A prior acceptance note claimed a successful model-backed invocation; that could not be verified against the recorded Codex attempt, which was rejected before model execution because the configured model was unsupported for the signed-in ChatGPT account. This report does not claim a successful model-backed skill invocation.

This independent example models single-worker in-memory idempotency only. It does not prove distributed processing, exactly-once delivery, live Gmail behavior, external AI-provider behavior, or complete prompt-injection protection.
