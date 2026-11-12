# Gmail workflow reference

## Narrow adapter

The reference implementation requests read-only and compose OAuth scopes for a one-shot inbox read and draft creation. Google documents `gmail.compose` as permitting draft management and sending. Optional labels require `gmail.modify`, which also permits sending. Never describe either scope as draft-only.

## States and retries

Use labels such as `AI/Processing`, `AI/Drafted`, `AI/Needs-Review`, and `AI/Failed` as visible workflow markers. List labels once, reuse matches, and create only missing labels. A message ID is the dedupe key; process messages, not just threads, because new messages can arrive in an existing thread.

For one worker, skip IDs already in terminal states and retry old `AI/Processing` items according to an explicit stale-state policy. If a failure occurs before draft creation, mark failed and retry later. If draft creation succeeds but state update fails, check for an existing draft or accept that duplicate drafts are possible. Gmail labels do not provide atomic compare-and-set or a distributed lock. Prevent overlapping workers externally.

