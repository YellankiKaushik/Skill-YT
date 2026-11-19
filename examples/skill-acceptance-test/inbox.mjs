import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// This policy is application-owned. No message field can change these replies or rules.
const POLICY = Object.freeze({
  businessAcknowledgment: 'Thanks for reaching out. A person will review your inquiry and follow up.',
  sponsorshipAcknowledgment: 'Thanks for the sponsorship inquiry. We will review the proposal and follow up if it is a fit.',
});

const INJECTION = /ignore\s+(?:all\s+|prior\s+|previous\s+)*(?:instructions|rules)|reveal\s+(?:the\s+)?(?:secret|credential|password)|send\s+(?:an\s+)?email|forward\s+(?:this|the)\s+(?:email|message)|\b(?:api[_ -]?key|password|oauth token)\b/i;
const COMMERCIAL = /\b(?:rate|price|budget|discount|payment|fee|terms|contract|deliverables|exclusivity)\b/i;
const SUSPICIOUS = /\b(?:urgent wire|verify your password|credential|login at|account suspended)\b/i;

function classify(message) {
  if (!message || typeof message !== 'object' || typeof message.id !== 'string' || !message.id.trim()) {
    return { kind: 'malformed', reason: 'invalid-message-shape' };
  }
  if (typeof message.body !== 'string' || message.body.length > 20_000 || typeof message.sender !== 'string') {
    return { kind: 'malformed', reason: 'invalid-message-fields' };
  }

  const data = `${message.subject ?? ''}\n${message.sender}\n${message.body}`;
  if (INJECTION.test(data) || SUSPICIOUS.test(data)) return { kind: 'suspicious', reason: 'untrusted-content' };
  if (/\b(?:sponsor|sponsorship|brand partnership)\b/i.test(data)) {
    return { kind: 'sponsorship', reason: COMMERCIAL.test(data) ? 'commercial-terms-need-review' : 'commercial-policy-not-configured' };
  }
  if (/\b(?:inquiry|interested|information|question|business|service|product|meeting|availability)\b/i.test(data)) {
    return { kind: 'business-inquiry', reason: 'routine-inquiry' };
  }
  return { kind: 'manual-review', reason: 'uncertain-content' };
}

// Idempotent test-only persistence. Draft records are local JSON-like objects, never sent.
function createDraftStore() {
  const bySource = new Map();
  return Object.freeze({
    getBySourceId: (id) => bySource.get(id),
    create: (draft) => {
      const existing = bySource.get(draft.sourceMessageId);
      if (existing) return existing;
      const stored = Object.freeze({ ...draft, id: `draft-${bySource.size + 1}`, review: 'pending' });
      bySource.set(draft.sourceMessageId, stored);
      return stored;
    },
    review: (sourceId, decision) => {
      const draft = bySource.get(sourceId);
      if (!draft) throw new Error('No draft exists for human review');
      if (draft.review !== 'pending') return draft;
      const updated = Object.freeze({ ...draft, review: decision });
      bySource.set(sourceId, updated);
      return updated;
    },
    list: () => [...bySource.values()],
  });
}

export function createOfflineAssistant({ draftStore = createDraftStore() } = {}) {
  const states = new Map();

  function process(message) {
    if (!message || typeof message !== 'object' || typeof message.id !== 'string' || !message.id.trim()) {
      return Object.freeze({ status: 'manual-review', reason: 'invalid-message-shape', draft: null });
    }
    const { id } = message;
    if (states.has(id)) return Object.freeze({ id, status: 'duplicate', draft: null });

    // Recover the crash window where persistence completed before the state update.
    const recovered = draftStore.getBySourceId(id);
    if (recovered) {
      states.set(id, 'needs-human-review');
      return Object.freeze({ id, category: recovered.category, status: 'draft-recovered', draft: recovered });
    }

    const result = classify(message);
    let draft = null;
    if (result.kind === 'business-inquiry') {
      draft = draftStore.create({ sourceMessageId: id, category: result.kind, body: POLICY.businessAcknowledgment });
    } else if (result.kind === 'sponsorship') {
      draft = draftStore.create({ sourceMessageId: id, category: result.kind, body: POLICY.sponsorshipAcknowledgment });
    }

    const status = draft ? 'needs-human-review' : 'manual-review';
    // State is committed after draft persistence; store create is idempotent by source ID.
    states.set(id, status);
    return Object.freeze({ id, category: result.kind, reason: result.reason, status, draft });
  }

  function review(sourceMessageId, decision) {
    if (!['approve', 'reject'].includes(decision)) throw new TypeError('Human decision must be approve or reject');
    const draft = draftStore.review(sourceMessageId, decision === 'approve' ? 'human-approved' : 'human-rejected');
    states.set(sourceMessageId, draft.review);
    return draft;
  }

  return Object.freeze({
    process,
    review,
    inspect: () => Object.freeze({ states: Object.fromEntries(states), drafts: draftStore.list() }),
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const messages = JSON.parse(readFileSync(new URL('./messages.json', import.meta.url), 'utf8'));
    const assistant = createOfflineAssistant();
    const results = messages.map((message) => assistant.process(message));
    console.log(JSON.stringify({ results, ...assistant.inspect() }, null, 2));
  } catch (error) {
    console.error(`Offline inbox demo failed (${error.name}).`);
    process.exitCode = 1;
  }
}
