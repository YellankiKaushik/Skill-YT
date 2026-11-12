"""Single-worker orchestration with idempotency and no network send operation."""

import logging

from .drafting import create_reply
from .models import Category, EmailMessage, Policy, WorkflowState
from .security import (
    DraftOnlyBoundary,
    deterministic_classification,
    has_prompt_injection,
    offer_below_floor,
)

logger = logging.getLogger(__name__)


class InMemoryState:
    """Demo state only; live label state remains best-effort and not a lock."""
    def __init__(self):
        self.processed: set[str] = set()


class InboxAgent:
    def __init__(self, mailbox, classifier, settings, policy: Policy | None = None, state=None):
        self.mailbox = DraftOnlyBoundary(mailbox)
        self.classifier = classifier
        self.settings = settings
        self.policy = policy or Policy()
        self.state = state or InMemoryState()

    def run_once(self):
        outcomes = []
        for message in self.mailbox.invoke("list_inbox"):
            if message.id in self.state.processed or _already_terminal(message):
                outcomes.append((message.id, "duplicate_skipped"))
                continue
            self.state.processed.add(message.id)
            try:
                self._transition(message.id, WorkflowState.PROCESSING)
                classification = self.classifier.classify(message)
                if has_prompt_injection(message.body):
                    classification = deterministic_classification(message)
                if classification.category == Category.SPONSORSHIP and (
                    not self.policy.sponsorship_enabled
                    or not self.policy.approved_terms.strip()
                    or self.policy.minimum_price is None
                    or offer_below_floor(message.body, self.policy.minimum_price)
                ):
                    self._transition(message.id, WorkflowState.NEEDS_REVIEW)
                    outcomes.append((message.id, "needs_review"))
                    continue
                if classification.category in {Category.SUSPICIOUS, Category.REVIEW} or classification.requires_review:
                    self._transition(message.id, WorkflowState.NEEDS_REVIEW)
                    outcomes.append((message.id, "needs_review"))
                    continue
                if classification.category == Category.SPAM:
                    self._transition(message.id, WorkflowState.NEEDS_REVIEW)
                    outcomes.append((message.id, "spam_review"))
                    continue
                draft = create_reply(message, classification, self.policy, self.settings)
                if draft is None:
                    self._transition(message.id, WorkflowState.NEEDS_REVIEW)
                    outcomes.append((message.id, "needs_review"))
                    continue
                self.mailbox.invoke("create_draft", draft=draft, thread_id=message.thread_id)
                self._transition(message.id, WorkflowState.DRAFTED)
                outcomes.append((message.id, "drafted"))
            except Exception as exc:
                logger.warning("message processing failed (%s); message content omitted", type(exc).__name__)
                self.state.processed.discard(message.id)
                self._transition(message.id, WorkflowState.FAILED)
                outcomes.append((message.id, "failed"))
        return outcomes

    def _transition(self, message_id: str, state: WorkflowState):
        try:
            self.mailbox.invoke("transition", message_id=message_id, state=state)
        except AttributeError:
            pass


def _already_terminal(message: EmailMessage) -> bool:
    return bool({WorkflowState.DRAFTED.value, WorkflowState.NEEDS_REVIEW.value} & message.label_ids)

