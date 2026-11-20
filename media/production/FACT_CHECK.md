# Skill-YT video fact check

Local verification repeated on 2026-11-20 from checkout commit `d11e78c41db068f476d1b12db35e0f0ea6cbf32f`. The existing production records [main CI run 44531721205](https://github.com/YellankiKaushik/Skill-YT/actions/runs/44531721205) as successful for Python 3.11, Python 3.12, Docker inspector, and Node acceptance. This is previously recorded CI evidence: the resume session could not refresh GitHub Actions or establish the latest remote main because network access failed and the GitHub connector returned no installed accounts.

| Check | Observed |
| --- | --- |
| Python 3.11.9 fresh virtual environment | Editable install with `.[test]` succeeded. |
| `python -m pytest -q -rs` | 45 passed, 1 skipped. The skip belongs to the dedicated Docker integration job. |
| `python -m ruff check src tests scripts` | All checks passed. |
| Node 24.16.0 with npm 11.9.0 | `npm test` passed all 12, with zero failures and zero skips. `npm run demo` exited successfully. |
| Local demonstrations | Synthetic fixture data only. No Gmail credentials or mailbox use. |

## Python CLI

During resume, the checkout's `.venv` launcher could not access its base interpreter. The previously created, separate Python 3.11.9 media verification environment was recovered and used without rebuilding the app. The CLI again returned the JSON below; pytest again reported `45 passed, 1 skipped in 0.39s`; Ruff returned `All checks passed!`. The Node suite again reported 12 passes, zero failures and zero skips. Its demo returned the two pending drafts, one manual-review outcome, and one duplicate outcome described below. No live-mode command was used.

These values are from `python -m secure_inbox.cli`. The video reformats excerpts for readability.

```json
{
  "outcomes": [
    ["demo-1", "drafted"],
    ["demo-2", "needs_review"],
    ["demo-3", "needs_review"]
  ],
  "second_run": [
    ["demo-1", "duplicate_skipped"],
    ["demo-2", "duplicate_skipped"],
    ["demo-3", "duplicate_skipped"]
  ],
  "draft_count": 1,
  "labels": {
    "demo-1": "AI/Drafted",
    "demo-2": "AI/Needs-Review",
    "demo-3": "AI/Needs-Review"
  },
  "injection_detected": true,
  "send_operation_available": false
}
```

`demo-1` asks a routine question and receives a generic acknowledgment in memory. `demo-2` needs approved terms and a configured price floor before any Python sponsorship draft. `demo-3` matches the synthetic injection pattern and routes for review. These checks illustrate specific cases. See the [CLI fixtures](../../src/secure_inbox/cli.py), [orchestration](../../src/secure_inbox/agent.py), and [security model](../../docs/SECURITY.md).

## Independent Node example

The sample creates two generic acknowledgment drafts with `review: "pending"`, one for a business inquiry and one for a sponsorship inquiry. The latter contains no rates or contractual commitments. The suspicious fixture has `status: "manual-review"` and `draft: null`. The repeated business ID returns `status: "duplicate"` and `draft: null`. These outcomes belong to the [independent acceptance example](../../examples/skill-acceptance-test/README.md).

## Limits shown in the video

- The pipeline diagram groups the deterministic pre-draft safeguards with policy checks. The Python agent calls its classifier and then applies its explicit injection override and business policy.
- Gmail's optional provider scopes and the application's narrower agent interface are distinct. The interface exposes no send operation. The Gmail recovery diagram illustrates documented marker-based lookup for one worker. It does not depict a real Gmail run.
- Test coverage includes defined synthetic cases and dedicated CI jobs. It does not establish complete prompt-injection protection or distributed exactly-once processing.
- The documented project-local Skill-YT installation passed during closeout. A separate model-backed execution of the inbox skill in another project remains unverified. The Remotion production session is separate from that acceptance check.
- The original [v1.1.0 release](https://github.com/YellankiKaushik/Skill-YT/releases/tag/v1.1.0) contains the skill ZIP.
