"""Narrow Gmail adapter. No general API object escapes this module."""

import base64
import logging
import os
from email.message import EmailMessage as MimeMessage
from pathlib import Path

from .models import Draft, EmailMessage, WorkflowState
from .retry import retry_call

logger = logging.getLogger(__name__)
READ_SCOPE = "https://www.googleapis.com/auth/gmail.readonly"
COMPOSE_SCOPE = "https://www.googleapis.com/auth/gmail.compose"
MODIFY_SCOPE = "https://www.googleapis.com/auth/gmail.modify"


class GmailClient:
    """Explicitly whitelisted Gmail operations around a Google service object."""

    ALLOWED_METHODS = frozenset({"list_inbox", "get_message", "create_draft", "list_labels", "ensure_labels", "transition"})
    FORBIDDEN_METHODS = frozenset({"send_email", "send", "messages.send", "drafts.send", "delete", "trash"})

    def __init__(self, service, allow_label_mutation: bool = False):
        self.__service = service
        self.allow_label_mutation = allow_label_mutation
        self._labels: dict[str, str] = {}

    @classmethod
    def from_oauth(cls, credentials_path: str, token_path: str, allow_label_mutation=False):
        credentials = Path(credentials_path)
        token = Path(token_path)
        if not credentials.is_file():
            raise FileNotFoundError("Gmail OAuth client file is missing")
        if token.exists() and os.name != "nt" and token.stat().st_mode & 0o077:
            raise PermissionError("Gmail token file permissions are too broad")
        try:
            from google.auth.transport.requests import Request
            from google.oauth2.credentials import Credentials
            from google_auth_oauthlib.flow import InstalledAppFlow
            from googleapiclient.discovery import build
        except ImportError as exc:
            raise RuntimeError("install the optional gmail dependencies to enable live Gmail") from exc
        scopes = [READ_SCOPE, COMPOSE_SCOPE]
        if allow_label_mutation:
            scopes.append(MODIFY_SCOPE)
        creds = Credentials.from_authorized_user_file(str(token), scopes) if token.exists() else None
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        if not creds or not creds.valid:
            flow = InstalledAppFlow.from_client_secrets_file(str(credentials), scopes)
            creds = flow.run_local_server(port=0)
        token.parent.mkdir(parents=True, exist_ok=True)
        token.write_text(creds.to_json(), encoding="utf-8")
        if os.name != "nt":
            token.chmod(0o600)
        service = build("gmail", "v1", credentials=creds, cache_discovery=False)
        return cls(service, allow_label_mutation)

    def __getattr__(self, name):
        if name in self.FORBIDDEN_METHODS or name not in self.ALLOWED_METHODS:
            raise AttributeError(f"Gmail operation is not exposed: {name}")
        raise AttributeError(name)

    def list_inbox(self, max_results=50):
        response = _execute(self.__service.users().messages().list(userId="me", labelIds=["INBOX"], maxResults=max_results))
        messages = []
        for item in response.get("messages", []):
            messages.append(self.get_message(item["id"]))
        return messages

    def get_message(self, message_id: str) -> EmailMessage:
        raw = _execute(self.__service.users().messages().get(userId="me", id=message_id, format="full"))
        headers = {h["name"].lower(): h["value"] for h in raw.get("payload", {}).get("headers", [])}
        body = _extract_text(raw.get("payload", {}))
        return EmailMessage(
            id=raw["id"], thread_id=raw.get("threadId", ""), sender=headers.get("from", ""),
            subject=headers.get("subject", ""), body=body[:30000],
            label_ids=frozenset(raw.get("labelIds", [])), internal_date=raw.get("internalDate", ""),
        )

    def create_draft(self, draft: Draft, thread_id: str = ""):
        mime = MimeMessage()
        mime["To"] = draft.to
        mime["Subject"] = draft.subject
        mime.set_content(draft.body)
        raw = base64.urlsafe_b64encode(mime.as_bytes()).decode().rstrip("=")
        body = {"message": {"raw": raw}}
        if thread_id:
            body["message"]["threadId"] = thread_id
        result = _execute(self.__service.users().drafts().create(userId="me", body=body))
        logger.info("draft created; message id omitted")
        return {"id": result.get("id"), "threadId": thread_id}

    def list_labels(self):
        response = _execute(self.__service.users().labels().list(userId="me"))
        self._labels = {x["name"]: x["id"] for x in response.get("labels", [])}
        return dict(self._labels)

    def ensure_labels(self):
        if not self.allow_label_mutation:
            raise PermissionError("label mutation is disabled; enable explicitly with gmail.modify risk")
        self.list_labels()
        for state in WorkflowState:
            if state.value not in self._labels:
                created = _execute(self.__service.users().labels().create(
                    userId="me", body={"name": state.value, "labelListVisibility": "labelShow", "messageListVisibility": "show"}
                ))
                self._labels[state.value] = created["id"]
        return dict(self._labels)

    def transition(self, message_id: str, state: WorkflowState):
        if not self.allow_label_mutation:
            raise PermissionError("label mutation is disabled")
        labels = self._labels or self.ensure_labels()
        target = labels[state.value]
        remove = [labels[s.value] for s in WorkflowState if s.value != state.value and s.value in labels]
        _execute(self.__service.users().messages().modify(
            userId="me", id=message_id, body={"addLabelIds": [target], "removeLabelIds": remove}
        ))


def _extract_text(payload: dict) -> str:
    parts = payload.get("parts") or [payload]
    chunks = []
    for part in parts:
        if part.get("mimeType") == "text/plain" and part.get("body", {}).get("data"):
            try:
                data = part["body"]["data"]
                chunks.append(base64.urlsafe_b64decode(data + "=" * (-len(data) % 4)).decode("utf-8", "replace"))
            except (ValueError, UnicodeError, KeyError):
                continue
        elif part.get("mimeType", "").startswith("multipart/"):
            chunks.append(_extract_text(part))
    return "\n".join(chunks)


def _execute(request):
    def retryable(exc):
        status = getattr(getattr(exc, "resp", None), "status", None)
        return status in {429, 500, 502, 503, 504} or isinstance(exc, OSError)
    return retry_call(request.execute, attempts=3, retryable=retryable, delay_seconds=0.2)

