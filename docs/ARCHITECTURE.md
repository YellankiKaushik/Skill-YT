# Architecture

The pipeline separates mailbox access (`gmail_client.py`), categorization (`classifier.py`), policy-constrained draft generation (`drafting.py`), and orchestration (`agent.py`). Data contracts live in `models.py`; offline fixtures are synthetic.

```text
Gmail read adapter -> untrusted message data -> deterministic checks / classifier
                                            -> business policy -> draft adapter
                                            -> human reviews in Gmail
```

The agent only receives a `DraftOnlyBoundary`; the Google service object remains private inside the adapter. The interface allows message retrieval, inbox listing, draft creation, and explicitly configured workflow-label transitions. It rejects sending, arbitrary API calls, and destructive mailbox actions.

The offline deterministic classifier is the fallback when provider credentials, model IDs, parsing, or network calls fail. A low-confidence classification is routed for review. Sponsorship drafting is disabled unless both a policy enable flag and approved terms are present; no minimum rate or acceptance is invented. Never put confidential mailbox contents in model prompts without a deliberate data-processing review.

The live runner requires one explicitly selected message and is single-worker. Each draft stores an opaque marker derived from that Gmail message ID. On retry, the adapter scans paginated Gmail drafts and recovers the existing draft before attempting creation. Labels are optional and are not locks or transactional state. If draft listing is unavailable, the adapter fails closed; concurrent workers, Gmail visibility delays, or a user deleting the marked draft remain outside the exactly-once guarantee. See [gmail-workflow.md](../.agents/skills/secure-inbox-agent/references/gmail-workflow.md).

## Research provenance

The supplied `VIDEO_RESEARCH.md` is treated as a design brief. Tutorial-specific statements and timestamps were not independently verified from a transcript in this implementation session. Official Google API behaviors cited in setup docs were checked against current Google documentation. Commercial policy, single-worker semantics, and offline-only HTML handling are engineering choices made here.

