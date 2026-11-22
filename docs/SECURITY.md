# Security model

## Guarantees and limits

- No sending operation, Gmail send endpoint, general Gmail service object, or destructive action is exposed to the agent-facing boundary.
- `gmail.compose` and `gmail.modify` can authorize sending at Google's OAuth layer. The application boundary is defense in depth, not a Gmail-scope guarantee.
- Incoming mail, attachments, quoted text, names, and URLs are untrusted data. Deterministic matching routes common prompt injection and credential phishing to review; these heuristics are not a complete classifier.
- Deterministic suspicious results across sender, subject and body take priority over model classifications. Detected sponsorship categories keep commercial policy checks even when a provider labels them as general inquiries. Classification output requires a numeric confidence and boolean review flag. Policy prices must be finite and nonnegative.
- Sponsorship processing requires an explicit enable flag, approved terms, and a configured price floor. Detected currency offers below the floor route to review; humans still inspect every draft.
- Human review is required before any real outbound email. The software never approves or sends its own drafts.
- Optional provider calls transmit selected email fields and, for drafting, approved terms and the price floor to the configured endpoint. Authenticated requests reject redirects with a request-local handler, preserve timeout and size limits, and use fixed fallback logs. HTTPS is required except for explicit loopback HTTP endpoints. Model draft checks do not establish semantic correctness or commercial approval; a person must inspect every draft. The price matcher recognizes dollar/USD amounts and can miss other representations.
- Logging records operation types and error classes, not message contents, tokens, OAuth credentials, or API keys.
- Each created draft carries an opaque SHA-256 operation marker derived from the Gmail message ID. Before creating another draft, the single worker scans Gmail drafts for that marker, so a restart after draft creation but before a label update can recover the existing draft. Gmail labels are not locks or transactional state. Concurrent workers are unsupported; API visibility delays, manual draft deletion, or unavailable draft listing can still require operator review. This is not exactly-once delivery.
- A processing failure returns `failed` even if recording `AI/Failed` also fails. Logs record only the error class. A draft may already have persisted, so operators should inspect recovery results before further action. Draft-marker recovery reads metadata across existing drafts while processing the one selected Inbox message.
- Live mode requires an explicit single Gmail message ID. It does not list the inbox. Label mutation is disabled by default; enabling it requests `gmail.modify`, which Google documents as able to read, compose, and send mail. The code still exposes no send operation.
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

