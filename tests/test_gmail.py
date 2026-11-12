import base64
from email import message_from_bytes

import pytest

from secure_inbox.gmail_client import GmailClient
from secure_inbox.models import Draft


class Request:
    def __init__(self, value): self.value = value
    def execute(self): return self.value


class Drafts:
    def __init__(self): self.body = None
    def create(self, **kwargs): self.body = kwargs["body"]; return Request({"id": "draft-1"})


class Users:
    def __init__(self): self.drafts_adapter = Drafts()
    def drafts(self): return self.drafts_adapter


class Service:
    def __init__(self): self.user_adapter = Users()
    def users(self): return self.user_adapter


def test_draft_adapter_creates_only_draft():
    service = Service(); client = GmailClient(service)
    draft = Draft("a@example.test", "Re: Hi", "Thanks", "<original@example.test>", "<older@example.test> <original@example.test>")
    assert client.create_draft(draft, "t1")["id"] == "draft-1"
    assert service.user_adapter.drafts_adapter.body["message"]["threadId"] == "t1"
    raw = service.user_adapter.drafts_adapter.body["message"]["raw"]
    mime = message_from_bytes(base64.urlsafe_b64decode(raw + "=" * (-len(raw) % 4)))
    assert mime["In-Reply-To"] == "<original@example.test>"
    assert mime["References"] == "<older@example.test> <original@example.test>"
    with pytest.raises(AttributeError):
        client.send_email()


def test_missing_oauth_credentials_fail_without_prompting():
    with pytest.raises(FileNotFoundError, match="OAuth client file"):
        GmailClient.from_oauth("missing-credentials.json", "missing-token.json")

