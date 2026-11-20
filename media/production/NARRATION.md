# Narration and scene timing

English voiceover. Timecodes are elapsed time.

## Cinematic Trailer

### 00:00–00:05 · Who gets to give orders?

Your inbox receives instructions. Should an AI trust them?

### 00:05–00:12 · Treat email as untrusted.

An email can try to override the assistant. Skill Y T flags suspicious language and routes the message to review.

### 00:12–00:22 · Read. Classify. Check policy.

Skill Y T reads a synthetic inbox, classifies messages, and applies rules in code. Eligible inquiries become acknowledgment drafts. Other messages wait for review.

### 00:22–00:30 · A draft is where it stops.

The agent can prepare a reply. A person decides what to do with it. There is no send operation in the agent interface.

### 00:30–00:38 · Test the boundary.

The offline run created one draft. Local checks passed forty-five Python tests and twelve Node tests. The dedicated Docker job passed in GitHub Actions.

### 00:38–00:45 · Secure Inbox AI Agent

Secure Inbox AI Agent. Explore the source and reproduce the demo on GitHub.

## How Skill-YT Works

### 00:00–00:11 · An inbox is untrusted input.

A message can be a customer question, a sponsorship offer, or text aimed at the assistant itself. The inbox cannot tell you which one to trust.

### 00:11–00:23 · An email cannot set policy.

If an assistant treats the email as instructions, the sender may steer it. A subject line, quoted reply, attachment, or link can all contain untrusted content.

### 00:23–00:35 · Constrain what AI can do.

An assistant with broad mailbox access could act on a bad decision. Skill Y T makes the permitted actions explicit and keeps the send operation outside the agent boundary.

### 00:35–00:47 · One idea, three entry points.

Skill Y T is an open-source reference project. It includes a Python application, a reusable Codex skill, and a separate Node example you can run on its own.

### 00:47–00:58 · Start with the Python app.

The Python application is the main reference. Run the command line demo and it builds a tiny synthetic inbox with three distinct messages. It prints the workflow results as JSON.

### 00:58–01:10 · Try the smaller Node example.

The Node acceptance example is separate from Python. Its fixtures illustrate the same safety goals using Node built-ins. The Codex skill takes those principles into another repository.

### 01:10–01:22 · Read. Classify. Check policy.

The agent reads a message, classifies it, and applies deterministic safeguards before it drafts. For example, a prompt injection match overrides the classifier’s decision. Policy stays in code.

### 01:22–01:34 · A routine question gets a draft.

The first message asks about the recipient’s work. The offline application creates a simple acknowledgment. That draft is stored in memory. A person still decides what to do with the reply.

### 01:34–01:47 · A sponsorship gets held.

The second message asks about a sponsorship. Sponsorship drafting requires approved terms, an explicit enable flag, and a price floor. The default Python demo has no configured terms or floor, so the message goes to review.

### 01:47–02:00 · Suspicious content goes to review.

The third fixture urges the reader to verify an account and attempts to override instructions. The demo detects the prompt injection and creates no draft for that message. Pattern checks help catch common cases.

### 02:00–02:13 · OAuth and the agent are separate.

The optional Gmail adapter is outside the offline demo. At the provider level, Compose and Modify scopes can authorize sending. Inside Skill Y T, the agent gets a narrower interface with no send method.

### 02:13–02:25 · A person decides.

The agent gets explicitly allowed operations, and the underlying Gmail client stays inside the adapter. Model instructions also treat email as data. Human review remains the last checkpoint before any real outbound mail.

### 02:25–02:38 · Recover a draft after restart.

The demo skips repeat message IDs. In the optional single worker Gmail flow, draft creation stores an opaque marker derived from the message ID. A retry can look up that marker and recover the existing draft.

### 02:38–02:50 · Recovery has limits.

Labels are workflow state. They provide no transactional lock. Multiple workers, delayed Gmail visibility, or a deleted draft can require manual handling. Prompt injection matching also remains one layer of defense.

### 02:50–03:05 · Take the workflow with you.

The repository includes a skill called Secure Inbox Agent. Its Skill dot M D file gives Codex a reusable workflow for building or auditing inbox assistants. It carries design guidance and links to testing references.

### 03:05–03:20 · Audit the capability boundary.

The skill directs a developer to trace mailbox operations, verify that policy decisions happen in code, and inspect recovery behavior. It calls for synthetic fixtures that exercise uncertainty, malicious input, duplicates, and prohibited actions.

### 03:20–03:35 · Try it in a separate project.

The installer can copy the skill into a disposable project. Open that project in Codex and invoke the skill by name. Installation was checked during the project closeout. A separate model-backed invocation remains unverified.

### 03:35–03:49 · Run the Python demo.

This excerpt is from the real Python demo. The first ID is drafted. The next two need review. The draft count is one and the send operation available flag is false.

### 03:49–04:02 · Repeat the run.

The demo runs the same inbox twice. On the second pass, all three IDs are marked duplicate skipped. The injection detected flag is true. These results come from synthetic data.

### 04:02–04:16 · Run the Node acceptance suite.

Run npm test and npm run demo in the independent Node example. Twelve tests passed. The Node demo creates two pending acknowledgments, holds the suspicious message without a draft, and skips the duplicate.

### 04:16–04:30 · Check GitHub Actions.

Local Python checks passed forty-five tests and skipped the dedicated Docker integration test. GitHub Actions passed Python on two versions, the actual Docker inspector job, and Node acceptance. These runs did not use a live Gmail mailbox.

### 04:30–04:40 · Clone and run it locally.

Clone Skill Y T, create a Python virtual environment, and install the test extra. Run the Python command shown here. The hands-on guide walks through the same sequence.

### 04:40–04:50 · Reproduce all three paths.

The testing guide connects the Python demo, the Node suite, and project-local skill installation. Use your own run output to check the documented behavior.

### 04:50–05:00 · Secure Inbox AI Agent

Skill Y T is open source. Start with the synthetic demo, inspect the boundaries, and adapt the workflow to your own project. The repository and version one point one release are on GitHub.

## Portrait Short

### 00:00–00:05 · Can AI trust your inbox?

An incoming email can contain instructions aimed at the assistant.

### 00:05–00:10 · Flag suspicious mail.

Skill Y T checks for suspicious language and holds the message for review.

### 00:10–00:16 · Read. Classify. Check policy.

Classification and fixed rules decide what gets an acknowledgment draft.

### 00:16–00:22 · The agent stops at draft.

People decide what happens next. The agent has no send operation.

### 00:22–00:27 · Secure Inbox AI Agent

Find Skill Y T on GitHub and run the offline demo.
