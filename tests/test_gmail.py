import base64
import os
from email import message_from_bytes

import pytest

from secure_inbox.gmail_client import (
    COMPOSE_SCOPE,
    MODIFY_SCOPE,
    READ_SCOPE,
    GmailClient,
    MAX_MESSAGE_BODY_CHARS,
    _extract_text,
    _oauth_scopes,
    _write_token_safely,
)
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


def test_message_body_extraction_is_bounded_across_mime_parts():
    def part(text):
        value = base64.urlsafe_b64encode(text.encode()).decode().rstrip("=")
        return {"mimeType": "text/plain", "body": {"data": value}}

    payload = {"mimeType": "multipart/mixed", "parts": [part("a" * 25_000), part("b" * 25_000)]}
    body = _extract_text(payload)
    assert len(body) == MAX_MESSAGE_BODY_CHARS
    assert body.startswith("a" * 25_000)


def test_malformed_body_encoding_is_skipped_without_crashing():
    assert _extract_text({"mimeType": "text/plain", "body": {"data": "%%%bad%%%"}}) == ""
    assert _extract_text({"mimeType": "text/plain", "body": {"data": 123}}) == ""


def test_default_gmail_scopes_omit_label_mutation_scope():
    assert _oauth_scopes(False) == [READ_SCOPE, COMPOSE_SCOPE]
    assert _oauth_scopes(True) == [READ_SCOPE, COMPOSE_SCOPE, MODIFY_SCOPE]


def test_token_writer_uses_private_temporary_file(tmp_path):
    token = tmp_path / "token.json"
    _write_token_safely(token, '{"access_token":"synthetic"}')
    assert token.read_text(encoding="utf-8") == '{"access_token":"synthetic"}'
    assert not list(tmp_path.glob("*.tmp"))
    if os.name != "nt":
        assert token.stat().st_mode & 0o077 == 0

