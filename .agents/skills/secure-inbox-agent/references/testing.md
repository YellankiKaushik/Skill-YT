# Adversarial test matrix

Use synthetic fixtures and injected mock adapters. Assert observable decisions and side effects, not prompt wording.

| Threat or fault | Expected behavior |
| --- | --- |
| Prompt injection, phishing, credential exfiltration | Suspicious/manual-review state; no draft containing secrets |
| Offer pressure or price undercut | Policy cannot be overridden; missing terms require review |
| Send method or arbitrary Gmail method requested | Boundary raises a permission error |
| Duplicate message event | No second draft in the supported single-worker state model |
| Missing OAuth file | Offline mode still works; live mode fails clearly |
| Gmail/provider timeout or malformed JSON | Bounded retry or deterministic fallback, then review/failure state |
| Private IP, metadata hostname, unsafe redirect | Reject before fetch; live URL inspection remains disabled |
| Docker unavailable or HTML oversized | Fail safely without host browsing |
| Unexpected message shape or invalid UTF-8 | Do not crash the batch; log error class only |

Tests must not use live credentials, access real inbox data, or call any send endpoint.

