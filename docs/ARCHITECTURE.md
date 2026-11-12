# Architecture

The pipeline separates mailbox access (`gmail_client.py`), categorization (`classifier.py`), policy-constrained draft generation (`drafting.py`), and orchestration (`agent.py`). Data contracts live in `models.py`; offline fixtures are synthetic.

```text
Gmail read adapter -> untrusted message data -> deterministic checks / classifier
                                            -> business policy -> draft adapter
                                            -> human reviews in Gmail
```

The agent only receives a `DraftOnlyBoundary`; the Google service object remains private inside the adapter. The interface allows message retrieval, inbox listing, draft creation, and explicitly configured workflow-label transitions. It rejects sending, arbitrary API calls, and destructive mailbox actions.

The offline deterministic classifier is the fallback when provider credentials, model IDs, parsing, or network calls fail. A low-confidence classification is routed for review. Sponsorship drafting is disabled unless both a policy enable flag and approved terms are present; no minimum rate or acceptance is invented. Never put confidential mailbox contents in model prompts without a deliberate data-processing review.

The first live runner is single-worker and one-shot. Gmail labels aid recovery and visibility; they are not a lock or transactional state store. A process interruption after Gmail creates a draft but before the label changes can cause a duplicate on retry. Concurrent workers are unsupported. See [gmail-workflow.md](../.agents/skills/secure-inbox-agent/references/gmail-workflow.md).

## Research provenance

The supplied `VIDEO_RESEARCH.md` is treated as a design brief. Tutorial-specific statements and timestamps were not independently verified from a transcript in this implementation session. Official Google API behaviors cited in setup docs were checked against current Google documentation. Commercial policy, single-worker semantics, and offline-only HTML handling are engineering choices made here.

