"""Deterministic Gmail API fakes for restart and uncertain-create recovery."""

import base64
from email import message_from_bytes
from email.utils import formataddr
from types import SimpleNamespace

import pytest

from secure_inbox.agent import InboxAgent, InMemoryState
from secure_inbox.classifier import OpenAICompatibleClassifier
from secure_inbox.config import Settings
from secure_inbox.gmail_client import GmailClient
from secure_inbox.models import EmailMessage, Policy, WorkflowState


class ApiError(Exception):
    def __init__(self, status):
        super().__init__(f"HTTP {status}")
        self.resp = SimpleNamespace(status=status)


class Request:
    def __init__(self, operation):
        self.operation = operation

    def execute(self):
        return self.operation()


class FakeService:
    def __init__(self, messages):
        self.source_messages = {message.id: _gmail_message(message) for message in messages}
        self.draft_messages = {}
        self.drafts = {}
        self.labels = {}
        self.next_label = 1
        self.next_draft = 1
        self.fail_create_statuses = []
        self.lose_create_response = False
        self.fail_transition_once = None
        self.user_adapter = FakeUsers(self)

    def users(self):
        return self.user_adapter


class FakeUsers:
    def __init__(self, service):
        self.service = service
        self.message_adapter = FakeMessages(service)
        self.draft_adapter = FakeDrafts(service)
        self.label_adapter = FakeLabels(service)

    def messages(self):
        return self.message_adapter

    def drafts(self):
        return self.draft_adapter

    def labels(self):
        return self.label_adapter


class FakeMessages:
    def __init__(self, service):
        self.service = service

    def list(self, **kwargs):
        return Request(lambda: {"messages": [{"id": mid} for mid in self.service.source_messages]})

    def get(self, userId, id, **kwargs):
        def get_message():
            return self.service.source_messages.get(id) or self.service.draft_messages[id]

        return Request(get_message)

    def modify(self, userId, id, body):
        def modify_message():
            if self.service.fail_transition_once and self.service.fail_transition_once in body["addLabelIds"]:
                self.service.fail_transition_once = None
                raise ApiError(400)
            message = self.service.source_messages[id]
            labels = set(message["labelIds"])
            labels.update(body.get("addLabelIds", []))
            labels.difference_update(body.get("removeLabelIds", []))
            message["labelIds"] = list(labels)
            return {"id": id}

        return Request(modify_message)


class FakeDrafts:
    def __init__(self, service):
        self.service = service

    def list(self, **kwargs):
        return Request(
            lambda: {
                "drafts": [
                    {"id": draft_id, "message": {"id": message_id}}
                    for draft_id, message_id in self.service.drafts.items()
                ]
            }
        )

    def create(self, userId, body):
        def create_draft():
            if self.service.fail_create_statuses:
                raise ApiError(self.service.fail_create_statuses.pop(0))
            raw = body["message"]["raw"]
            mime = message_from_bytes(base64.urlsafe_b64decode(raw + "=" * (-len(raw) % 4)))
            draft_id = f"draft-{self.service.next_draft}"
            message_id = f"draft-message-{self.service.next_draft}"
            self.service.next_draft += 1
            self.service.drafts[draft_id] = message_id
            self.service.draft_messages[message_id] = {
                "id": message_id,
                "threadId": body["message"].get("threadId", ""),
                "payload": {
                    "headers": [
                        {"name": name, "value": value}
                        for name, value in mime.items()
                    ]
                },
            }
            if self.service.lose_create_response:
                self.service.lose_create_response = False
                raise OSError("synthetic lost response after server persisted draft")
            return {"id": draft_id}

        return Request(create_draft)


class FakeLabels:
    def __init__(self, service):
        self.service = service

    def list(self, **kwargs):
        return Request(
            lambda: {
                "labels": [
                    {"name": name, "id": label_id}
                    for name, label_id in self.service.labels.items()
                ]
            }
        )

    def create(self, userId, body):
        def create_label():
            name = body["name"]
            label_id = f"label-{self.service.next_label}"
            self.service.next_label += 1
            self.service.labels[name] = label_id
            return {"id": label_id}

        return Request(create_label)


def _gmail_message(message):
    encoded = base64.urlsafe_b64encode(message.body.encode()).decode().rstrip("=")
    headers = [
        {"name": "From", "value": formataddr(("Synthetic sender", message.sender))},
        {"name": "Subject", "value": message.subject},
        {"name": "Message-ID", "value": message.rfc822_message_id},
        {"name": "References", "value": message.references},
    ]
    return {
        "id": message.id,
        "threadId": message.thread_id,
        "labelIds": list(message.label_ids),
        "payload": {
            "mimeType": "text/plain",
            "headers": headers,
            "body": {"data": encoded},
        },
    }


def _agent(service):
    client = GmailClient(service, allow_label_mutation=True)
    client.ensure_labels()
    settings = Settings()
    return InboxAgent(client, OpenAICompatibleClassifier(settings), settings, Policy(), InMemoryState())


def _message(message_id="m1", thread_id="t1"):
    return EmailMessage(
        message_id,
        thread_id,
        "sender@example.test",
        "Question",
        "Could you tell me more about the project?",
        rfc822_message_id=f"<{message_id}@example.test>",
    )


def test_restart_recovers_draft_after_label_update_failure():
    service = FakeService([_message()])
    first = _agent(service)
    drafted_label = service.labels[WorkflowState.DRAFTED.value]
    service.fail_transition_once = drafted_label

    assert first.run_once() == [("m1", "failed")]
    assert len(service.drafts) == 1

    restarted = _agent(service)
    assert restarted.run_once() == [("m1", "draft_recovered")]
    assert len(service.drafts) == 1
    assert WorkflowState.DRAFTED.value in {
        name for name, label_id in service.labels.items()
        if label_id in service.source_messages["m1"]["labelIds"]
    }


def test_restart_after_failure_before_draft_creation_retries_safely():
    service = FakeService([_message()])

    class FailsOnce:
        def __init__(self):
            self.failed = False

        def classify(self, message):
            if not self.failed:
                self.failed = True
                raise OSError("synthetic pre-draft failure")
            return OpenAICompatibleClassifier(Settings()).classify(message)

    first = _agent(service)
    first.classifier = FailsOnce()
    assert first.run_once() == [("m1", "failed")]
    assert not service.drafts

    restarted = _agent(service)
    assert restarted.run_once() == [("m1", "drafted")]
    assert len(service.drafts) == 1


def test_lost_create_response_recovers_persisted_draft_without_retry_duplicate():
    service = FakeService([_message()])
    service.lose_create_response = True

    assert _agent(service).run_once() == [("m1", "draft_recovered")]
    assert len(service.drafts) == 1


def test_temporary_429_retries_draft_creation():
    service = FakeService([_message()])
    service.fail_create_statuses = [429]
    agent = _agent(service)
    assert agent.run_once() == [("m1", "drafted")]
    assert len(service.drafts) == 1


def test_messages_in_same_thread_get_distinct_drafts():
    service = FakeService([_message("m1", "same-thread"), _message("m2", "same-thread")])

    assert _agent(service).run_once() == [("m1", "drafted"), ("m2", "drafted")]
    assert len(service.drafts) == 2
    markers = [
        header["value"]
        for message in service.draft_messages.values()
        for header in message["payload"]["headers"]
        if header["name"].lower() == "x-secure-inbox-operation-id"
    ]
    assert len(set(markers)) == 2


def test_gmail_message_headers_and_body_are_bounded():
    message = EmailMessage(
        "large",
        "thread",
        f'"{"x" * 1100}" <sender@example.test>',
        "Q" * 1100,
        "synthetic body " * 3000,
    )
    parsed = GmailClient(FakeService([message])).get_message("large")
    assert len(parsed.sender) <= 1000
    assert len(parsed.subject) <= 1000
    assert len(parsed.body) <= 30_000


def test_draft_marker_survives_restart_with_fresh_gmail_adapter():
    service = FakeService([_message()])
    assert _agent(service).run_once() == [("m1", "drafted")]
    assert _agent(service).run_once() == [("m1", "duplicate_skipped")]
    assert len(service.drafts) == 1


@pytest.mark.parametrize("sender", ["", "bad\r\nBcc: victim@example.test", "a@example.test, b@example.test"])
def test_malformed_or_multiple_sender_addresses_do_not_create_reply_drafts(sender):
    from secure_inbox.drafting import create_reply
    from secure_inbox.models import Category, Classification

    message = EmailMessage("m", "t", sender, "Question", "Could you tell me more?")
    classification = Classification(Category.GENERAL, 0.9)
    assert create_reply(message, classification, Policy(), Settings()) is None
