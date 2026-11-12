# Security model

## Guarantees and limits

- No sending operation, Gmail send endpoint, general Gmail service object, or destructive action is exposed to the agent-facing boundary.
- `gmail.compose` and `gmail.modify` can authorize sending at Google's OAuth layer. The application boundary is defense in depth, not a Gmail-scope guarantee.
- Incoming mail, attachments, quoted text, names, and URLs are untrusted data. Deterministic matching routes common prompt injection and credential phishing to review; these heuristics are not a complete classifier.
- Human review is required before any real outbound email. The software never approves or sends its own drafts.
- Logging records operation types and error classes, not message contents, tokens, OAuth credentials, or API keys.
- A single worker and per-message idempotency state prevent duplicate work within one process. Labels are not distributed locks or exactly-once delivery. A draft created before a crash can be duplicated on retry.
- URL inspection fetches nothing. It accepts supplied static HTML in a `--network none` container. Live browsing needs a separately reviewed controlled-egress proxy with DNS/IP pinning and redirect revalidation; this project does not implement one.

## OAuth and local secrets

Store OAuth client JSON and token JSON outside version control, restrict local access, and revoke consent when no longer needed. Google marks `gmail.readonly`, `gmail.compose`, and `gmail.modify` as restricted scopes. The code requests read-only plus compose for reading and creating drafts. Optional label mutation adds `gmail.modify`, which also enables sending. Do not use real mailbox credentials in tests or paste them into chat.

## Threat review checklist

1. Trace every model input to a data-only serialization path.
2. Verify model output schema and apply policy decisions in code.
3. Search all reachable mail adapters for send, arbitrary request, and destructive operations.
4. Validate every redirect and DNS resolution if a future controlled fetcher is added.
5. Confirm tests use synthetic mail and mocked adapters.
6. Inspect logs and Git history for secrets before publishing.

