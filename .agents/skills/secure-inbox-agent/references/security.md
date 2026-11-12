# Security review reference

## Tool and data boundaries

- Keep raw OAuth tokens and provider keys in the adapter/runtime only; never include them in prompts, generated drafts, logs, or test fixtures.
- Give the model only the minimum message fields needed. Classifier output must be schema validated; free-form model text must not select tools or alter policy.
- Enforce allowlists in application code. Prohibit send, arbitrary Gmail requests, delete/trash, forwarding, and credential-bearing browsing.
- Escape or quote untrusted email content as data. This reduces instruction confusion but does not replace output validation or code-enforced business rules.

## Commercial and action rules

Use only approved terms stored outside the email. Do not infer a minimum offer, accept an offer, share private data, or promise an action. Missing policy means manual review. Humans inspect drafts before sending.

## URL safety

The reference implementation fetches no URL. A future fetcher must use controlled egress, deny loopback/private/link-local/reserved IPs after DNS resolution, reject non-HTTP schemes, re-check every redirect, cap bytes/time, and isolate browser execution. Do not mount credentials or the Docker socket. Static HTML must not execute JavaScript.

