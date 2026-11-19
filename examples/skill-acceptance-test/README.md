# Independent Skill Acceptance Test

This separate Node.js example exercises draft-only inbox handling with synthetic messages. It is intentionally independent of the Python application and uses only Node.js built-in modules: no npm packages, Gmail account, OAuth credentials, AI-provider key, Docker, or network access are required.

The example was developed and reviewed against the installed `$secure-inbox-agent` skill's security and testing guidance. Skill discovery was confirmed. A separate model-backed invocation could not be verified during closeout because the available Codex ChatGPT account rejected the configured model before execution.

## Run

Use Node.js 24 LTS or another compatible supported Node.js release:

```sh
npm test
npm run demo
```

`npm test` uses Node's built-in test runner. `npm run demo` processes the synthetic messages in `messages.json`.

## What it verifies

- Routine inquiries get a fixed acknowledgment draft that remains pending human review.
- Sponsorship inquiries receive no invented rates, prices, or contractual terms.
- Prompt-injection and credential-theft messages are routed for review without a draft.
- Duplicate messages are not drafted twice, and retry after draft persistence recovers the existing draft.
- Malformed or uncertain input is reviewable.
- Human approval only records a review decision; the example has no send capability.

This is a small offline illustration, not a complete Gmail implementation or a guarantee against every prompt injection. It makes no network calls and does not connect to Gmail or send messages. Its idempotency example models a single worker using in-memory state.
