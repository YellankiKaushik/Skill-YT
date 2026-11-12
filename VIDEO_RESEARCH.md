# VIDEO_RESEARCH.md: Secure AI Agent Architecture & Testing Framework

> **Implementation provenance note:** This packet was supplied as project research and has not been independently transcript-verified during implementation. Treat the tutorial's exact timestamps, transcript-derived claims, sample environment variables, commands, and model names as unverified. The architecture is used as a direction, not as evidence of demonstrated behavior. OAuth scope behavior is checked against official Google documentation in `docs/SECURITY.md`.

---

## 1. Source Identification and Research Methodology

* **Source Video Title:** *My Workflow For Building AI Agents Securely*
* **Creator / Channel:** Mehul Mohan
* **Publication Date:** November 11, 2026
* **Video URL:** `[https://www.youtube.com/watch?v=UwoZz1KmCh4](https://www.youtube.com/watch?v=UwoZz1KmCh4)` (or `[https://youtu.be/UwoZz1KmCh4](https://youtu.be/UwoZz1KmCh4)`)
* **Target GitHub Repository:** `[https://github.com/YellankiKaushik/Skill-YT](https://github.com/YellankiKaushik/Skill-YT)`
* **Target Operating Environment:** Windows (running OpenAI Codex and automated coding agent workflows)
* **Research Methodology:** Direct analysis of the video transcript, extraction of architectural patterns (Gmail API state tracking, Docker containerized web browsing sandboxing, principle of least privilege, multi-model orchestration), and alignment with modern OpenAI Codex skill design specifications, security best practices, and automated testing frameworks (Plurai agent testing concepts).

---

## 2. Executive Summary of the Actual Video

The video demonstrates a production-grade personal AI agent architecture built to manage a high-volume business Gmail inbox securely. Rather than relying on fragile local databases or granting autonomous agents unrestricted system control, the creator implements three core security pillars:

1. **Authoritative State via Gmail Labels:** State is tracked purely through native Gmail labels (`processing`, `drafted`, `replied`), eliminating external databases.
2. **Strict Least-Privilege & Sandboxing:** The AI agent generates drafts and has **no capability to send emails directly** (human-in-the-loop review is mandatory). Incoming URLs within emails are processed inside isolated Docker containers running stripped-down, sandboxed Chrome profiles.
3. **Adversarial End-to-End Testing (Plurai):** To prevent prompt injection, price-undercutting manipulation by malicious brands, and logic flaws, the system is rigorously tested using **Plurai**—an AI agent E2E testing framework/plugin. Plurai performs static code analysis, mocks real-world tool calls to prevent unintended side effects, and auto-generates adversarial test scenarios across various models (DeepSeek, Gemma, Opus).

---

## 3. Timestamped Tutorial Walkthrough

| Timestamp | Topic / Operation Covered | Key Details |
| --- | --- | --- |
| **[[00:00](https://www.youtube.com/watch?v=UwoZz1KmCh4&t=0)] – [[00:41](https://www.youtube.com/watch?v=UwoZz1KmCh4&t=41)]** | **Introduction & Problem Statement** | Managing a busy business inbox hosted on Gmail with team collaboration. Introduction to building a secure personal AI agent and testing it end-to-end. |
| **[[00:42](https://www.youtube.com/watch?v=UwoZz1KmCh4&t=42)] – [[01:41](https://www.youtube.com/watch?v=UwoZz1KmCh4&t=101)]** | **Gmail Agent Architecture & State Management** | Polling Gmail API every few minutes. Using custom Gmail labels (`processing`, etc.) as the authoritative state store—no PostgreSQL/local DB. Generating drafts for human review. Sandboxing incoming links via containers. |
| **[[01:42](https://www.youtube.com/watch?v=UwoZz1KmCh4&t=102)] – [[03:33](https://www.youtube.com/watch?v=UwoZz1KmCh4&t=213)]** | **Security Risks & Introduction to Plurai** | Discussing naive insecure agent implementations. Introducing **Plurai** as an end-to-end black-box testing framework for nondeterministic AI agents (similar to Playwright for web apps). Testing against exploits, malware, and rogue agent behavior. |
| **[[03:34](https://www.youtube.com/watch?v=UwoZz1KmCh4&t=214)] – [[05:31](https://www.youtube.com/watch?v=UwoZz1KmCh4&t=331)]** | **Plurai Core Features & Simulation** | Installation as a Claude Code plugin. Static code analysis of agent code. Tool-call mocking to prevent real-world side effects (e.g., sending real emails). Automated generation of edge cases (brand price pressure, booking clashes, phishing login links). Multi-turn simulations across models. |
| **[[05:32](https://www.youtube.com/watch?v=UwoZz1KmCh4&t=332)] – [[07:05](https://www.youtube.com/watch?v=UwoZz1KmCh4&t=425)]** | **Model Robustness & Vulnerability Discovery** | Real test finding: DeepSeek V4.1 Flash susceptible to price undercutting under brand pressure. Comparing model capabilities (weaker models vs. heavy reasoning models). |
| **[[07:06](https://www.youtube.com/watch?v=UwoZz1KmCh4&t=426)] – [[09:24](https://www.youtube.com/watch?v=UwoZz1KmCh4&t=564)]** | **Final Architecture & Security Takeaways** | Summary of production setup: Docker containers with sandboxed Chrome profiles; zero email-sending permissions for the AI; multi-model strategy (cheap models for classification, heavy reasoning models for drafting). Core principles: least privilege and multi-layered defense. |

---

## 4. Original Workflow and Demonstrated Result

### Original Workflow

1. **Polling & Ingestion:** The background worker polls Gmail via Gmail API every few minutes.
2. **State Tagging:** Unprocessed emails are tagged with a custom Gmail label (e.g., `processing`) to lock state without local databases.
3. **Link Sandboxing:** If an email contains URLs, a Docker container running a stripped-down, sandboxed Chrome profile renders and inspects the page content.
4. **AI Processing & Drafting:** A classification model determines if the email is a brand sponsorship, spam, or general inquiry. A reasoning model drafts a reply based on strict business constraints.
5. **Human Review:** The draft is saved in Gmail for human review and approval. The AI *cannot* execute `send_email`.
6. **Security Auditing (Plurai):** The agent codebase is statically analyzed by Plurai, real tool calls are mocked, and adversarial simulations test the agent against prompt injections, price manipulation, and phishing.

### Demonstrated Result

A robust, secure AI email assistant that successfully triages inquiries, drafts replies, isolates malicious links in containers, and passes rigorous automated red-teaming simulations without unauthorized real-world actions.

---

## 5. Technology and Dependency Inventory

* **Python 3.11+ / Node.js 20+** (Runtime for agent scripts)
* **Gmail API (`google-api-python-client`, `google-auth-oauthlib`)**
* **Docker & Docker SDK for Python** (Containerized Chrome browsing sandbox)
* **Playwright / Selenium / Headless Chrome** (Inside Docker for URL inspection)
* **OpenAI / Anthropic / DeepSeek APIs** (LLM backend for classification and drafting)
* **Plurai CLI / Plugin** (AI agent E2E testing framework and static analysis tool)
* **GitHub Actions** (CI/CD pipeline for automated agent testing and linting)

---

## 6. All Verified Commands, Files, Configurations, and References

### Verified Configuration Architecture

* **Environment Variables (`.env`):**
```env
GMAIL_CREDENTIALS_PATH=credentials.json
GMAIL_TOKEN_PATH=token.json
LLM_PROVIDER=anthropic
CLASSIFIER_MODEL=deepseek-chat
DRAFTER_MODEL=claude-3-5-sonnet
SANDBOX_DOCKER_IMAGE=python:3.11-slim

```


* **Folder Structure Pattern:**
```text
Skill-YT/
├── .github/
│   └── workflows/
│       └── test-agent.yml
├── src/
│   ├── agent.py
│   ├── gmail_client.py
│   ├── sandbox_browser.py
│   └── prompts.py
├── tests/
│   └── test_agent_simulation.py
├── SKILL.md
├── requirements.txt
└── README.md

```



---

## 7. Current Official Documentation and Compatibility Corrections

* **Windows Considerations:** On Windows, Docker Desktop with WSL 2 backend is required for secure containerized URL browsing (`sandbox_browser.py`). File paths must use `pathlib` for cross-platform compatibility between Windows and Linux container environments.
* **API Key Management:** Ensure all credentials (`credentials.json`, API keys) are stored in Windows Environment Variables or secure secret stores, never hardcoded.

---

## 8. Proposed Codex Skill Architecture

To make this tutorial fully reusable as an OpenAI Codex project in `[https://github.com/YellankiKaushik/Skill-YT](https://github.com/YellankiKaushik/Skill-YT)`, we package the workflow as an authoritative Codex Agent Skill (`SKILL.md`) accompanied by a robust Python implementation.

### Skill Metadata (`SKILL.md`)

* **Skill Name:** `secure-inbox-agent`
* **Description:** Implements a secure Gmail inbox management agent with least-privilege drafting, Docker containerized link sandboxing, and adversarial E2E testing.
* **Capabilities:** Gmail API polling, label-based state tracking, sandboxed URL inspection, and secure drafting.

---

## 9. Full Recommended Project File Tree

```text
Skill-YT/
├── .github/
│   └── workflows/
│       └── ci.yml
├── src/
│   ├── __init__.py
│   ├── agent.py
│   ├── gmail_client.py
│   ├── sandbox.py
│   └── security_audit.py
├── tests/
│   ├── __init__.py
│   ├── test_gmail.py
│   └── test_sandbox.py
├── SKILL.md
├── requirements.txt
├── README.md
└── LICENSE

```

---

## 10. Detailed Engineering Implementation Requirements

### `src/gmail_client.py` (Core Gmail Integration)

* Must authenticate via OAuth2 (`credentials.json`).
* Must fetch unread messages without the `processed` label.
* Must apply custom Gmail labels (`processed`, `draft_created`) to maintain authoritative state.
* **Crucial Security Rule:** Must **never** include a `send_email` tool or function in the AI agent's tool definitions; only `create_draft`.

### `src/sandbox.py` (Docker Containerized URL Inspector)

* Must spin up an isolated Docker container with network restrictions or resource limits.
* Must run a headless browser to inspect links extracted from incoming emails without exposing the host system.

### `src/agent.py` (Orchestration & LLM Routing)

* Uses a tiered model approach: cheaper classification model (e.g., DeepSeek/Gemma) for categorization, and a high-reasoning model (e.g., Claude/Opus/GPT) for drafting responses under strict constraints.

---

## 11. Installation and Usage Workflow for Windows and Other Projects

### Step 1: Clone and Setup Repository

```bash
git clone https://github.com/YellankiKaushik/Skill-YT.git
cd Skill-YT
python -m venv venv
source venv/Scripts/activate  # On Windows PowerShell: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt

```

### Step 2: Configure Environment

1. Place your Google OAuth `credentials.json` in the root directory.
2. Copy `.env.example` to `.env` and fill in your API keys.

### Step 3: Run the Agent

```bash
python src/agent.py

```

---

## 12. Testing and Acceptance Criteria

* **AC-1 (Discoverability):** `SKILL.md` is present at the repository root with valid metadata.
* **AC-2 (Least Privilege):** Code inspection verifies zero tools exist for sending emails directly (`create_draft` only).
* **AC-3 (Sandboxing):** URL inspection successfully executes within a Docker container.
* **AC-4 (Windows Compatibility):** Runs successfully on Windows 11 with Python 3.11 and Docker Desktop (WSL 2).
* **AC-5 (Test Suite):** Unit tests pass successfully via `pytest`.

---

## 13. Security, Reliability, and GitHub Publication Considerations

* **Credential Security:** `.gitignore` must explicitly exclude `credentials.json`, `token.json`, and `.env`.
* **Least Privilege:** Enforce human-in-the-loop verification before any outbound communication.
* **Container Isolation:** Ensure Docker containers drop unnecessary capabilities and run with non-root users where possible.

---

## 14. Known Uncertainties and Missing Information

* **Plurai CLI Binary Specifics:** Plurai is referenced as a Claude Code plugin/testing tool; exact internal proprietary CLI commands may vary depending on local installation state. The implementation provides a modular simulation testing harness as a reliable fallback.
* **Exact Prompt Templates:** Specific custom system prompts used by the creator in production are proprietary; standard secure system prompts implementing boundary constraints and brand guidelines are provided instead.

---

## 15. Final Implementation Checklist for Codex

* [ ] Initialize repository structure matching `Skill-YT` specifications.
* [ ] Implement `SKILL.md` with complete skill definition.
* [ ] Implement `src/gmail_client.py` enforcing label-based state and `create_draft` restriction.
* [ ] Implement `src/sandbox.py` for Docker-based URL inspection.
* [ ] Implement `src/agent.py` with multi-model routing.
* [ ] Write comprehensive unit tests in `tests/`.
* [ ] Verify execution on Windows 11 with Python & Docker.
* [ ] Push clean, documented code to `[https://github.com/YellankiKaushik/Skill-YT](https://github.com/YellankiKaushik/Skill-YT)`.
