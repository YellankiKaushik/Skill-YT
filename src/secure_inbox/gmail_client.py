"""Narrow Gmail adapter. No general API object escapes this module."""

import base64
import hashlib
import logging
import os
import subprocess
import tempfile
import time
from binascii import Error as Base64Error
from email.message import EmailMessage as MimeMessage
from pathlib import Path

from .models import Draft, EmailMessage, WorkflowState
from .retry import retry_call

logger = logging.getLogger(__name__)
READ_SCOPE = "https://www.googleapis.com/auth/gmail.readonly"
COMPOSE_SCOPE = "https://www.googleapis.com/auth/gmail.compose"
MODIFY_SCOPE = "https://www.googleapis.com/auth/gmail.modify"
IDEMPOTENCY_HEADER = "X-Secure-Inbox-Operation-ID"
MAX_MESSAGE_BODY_CHARS = 30_000


class GmailClient:
    """Explicitly whitelisted Gmail operations around a Google service object."""

    ALLOWED_METHODS = frozenset({"list_inbox", "get_message", "create_draft", "list_labels", "ensure_labels", "transition"})
    FORBIDDEN_METHODS = frozenset({"send_email", "send", "messages.send", "drafts.send", "delete", "trash"})

    def __init__(self, service, allow_label_mutation: bool = False):
        self.__service = service
        self.allow_label_mutation = allow_label_mutation
        self._labels: dict[str, str] = {}
        self._labels_loaded = False
        self._draft_index: dict[str, dict] | None = None

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
        scopes = _oauth_scopes(allow_label_mutation)
        creds = Credentials.from_authorized_user_file(str(token), scopes) if token.exists() else None
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        if creds and creds.valid and not creds.has_scopes(scopes):
            creds = None
        if not creds or not creds.valid:
            flow = InstalledAppFlow.from_client_secrets_file(str(credentials), scopes)
            creds = flow.run_local_server(port=0)
        _write_token_safely(token, creds.to_json())
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
        if not self._labels_loaded:
            self.list_labels()
        raw = _execute(self.__service.users().messages().get(userId="me", id=message_id, format="full"))
        headers = {}
        for header in raw.get("payload", {}).get("headers", []):
            if not isinstance(header, dict):
                continue
            name, value = header.get("name"), header.get("value")
            if isinstance(name, str) and isinstance(value, str):
                headers[name.lower()] = value
        body = _extract_text(raw.get("payload", {}))
        label_names = {label_id: name for name, label_id in self._labels.items()}
        return EmailMessage(
            id=raw["id"], thread_id=raw.get("threadId", ""), sender=headers.get("from", "")[:1000],
            subject=headers.get("subject", "")[:1000], body=body,
            label_ids=frozenset(label_names.get(label_id, label_id) for label_id in raw.get("labelIds", [])),
            internal_date=raw.get("internalDate", ""),
            rfc822_message_id=headers.get("message-id", ""), references=headers.get("references", ""),
        )

    def create_draft(self, draft: Draft, thread_id: str = ""):
        marker = _operation_marker(draft.source_message_id) if draft.source_message_id else ""
        if marker:
            if self._draft_index is None:
                self._draft_index = self._load_draft_index()
            existing = self._draft_index.get(marker)
            if existing:
                return {**existing, "already_exists": True}

        mime = MimeMessage()
        mime["To"] = draft.to
        mime["Subject"] = draft.subject
        if draft.in_reply_to:
            mime["In-Reply-To"] = draft.in_reply_to
        if draft.references:
            mime["References"] = draft.references
        if marker:
            mime[IDEMPOTENCY_HEADER] = marker
        mime.set_content(draft.body)
        raw = base64.urlsafe_b64encode(mime.as_bytes()).decode().rstrip("=")
        body = {"message": {"raw": raw}}
        if thread_id:
            body["message"]["threadId"] = thread_id

        # A successful create whose response is lost is ambiguous. Do not blindly
        # retry it: look for the durable marker before deciding whether to fail.
        for attempt in range(3):
            try:
                result = self.__service.users().drafts().create(userId="me", body=body).execute()
                saved = {"id": result.get("id"), "threadId": thread_id}
                if marker:
                    self._draft_index[marker] = saved
                logger.info("draft created; message id omitted")
                return {**saved, "already_exists": False}
            except Exception as exc:
                status = getattr(getattr(exc, "resp", None), "status", None)
                if status == 429 and attempt < 2:
                    time.sleep(0.2 * (2**attempt))
                    continue
                if marker:
                    self._draft_index = None
                    try:
                        self._draft_index = self._load_draft_index()
                        existing = self._draft_index.get(marker)
                        if existing:
                            return {**existing, "already_exists": True}
                    except Exception as recovery_error:
                        logger.warning(
                            "draft recovery lookup failed (%s); content omitted",
                            type(recovery_error).__name__,
                        )
                raise

    def _load_draft_index(self) -> dict[str, dict]:
        index = {}
        page_token = None
        drafts = self.__service.users().drafts()
        messages = self.__service.users().messages()
        while True:
            kwargs = {"userId": "me", "maxResults": 500}
            if page_token:
                kwargs["pageToken"] = page_token
            page = _execute(drafts.list(**kwargs))
            for item in page.get("drafts", []):
                draft_id = item.get("id")
                message_id = item.get("message", {}).get("id")
                if not draft_id or not message_id:
                    continue
                message = _execute(
                    messages.get(
                        userId="me",
                        id=message_id,
                        format="metadata",
                        metadataHeaders=[IDEMPOTENCY_HEADER],
                    )
                )
                headers = message.get("payload", {}).get("headers", [])
                for header in headers:
                    if header.get("name", "").lower() == IDEMPOTENCY_HEADER.lower():
                        raw_marker = header.get("value", "")
                        marker = raw_marker.strip() if isinstance(raw_marker, str) else ""
                        if marker:
                            index[marker] = {
                                "id": draft_id,
                                "threadId": message.get("threadId", ""),
                            }
            page_token = page.get("nextPageToken")
            if not page_token:
                return index

    def list_labels(self):
        response = _execute(self.__service.users().labels().list(userId="me"))
        self._labels = {x["name"]: x["id"] for x in response.get("labels", [])}
        self._labels_loaded = True
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


def _extract_text(payload: dict, remaining: int = MAX_MESSAGE_BODY_CHARS) -> str:
    if not isinstance(payload, dict):
        return ""
    if remaining <= 0:
        return ""
    parts = payload.get("parts") or [payload]
    chunks = []
    used = 0
    for part in parts:
        if not isinstance(part, dict):
            continue
        separator = 1 if chunks else 0
        available = remaining - used - separator
        if available <= 0:
            break
        if part.get("mimeType") == "text/plain" and part.get("body", {}).get("data"):
            try:
                data = part["body"]["data"][: available * 4]
                if not isinstance(data, str):
                    continue
                decoded = base64.b64decode(data + "=" * (-len(data) % 4), altchars=b"-_", validate=True)
                chunk = decoded.decode("utf-8", "replace")[:available]
                chunks.append(chunk)
                used += separator + len(chunk)
            except (ValueError, UnicodeError, KeyError, TypeError, Base64Error):
                continue
        elif part.get("mimeType", "").startswith("multipart/"):
            chunk = _extract_text(part, available)
            chunks.append(chunk)
            used += separator + len(chunk)
    return "\n".join(chunks)[:remaining]


def _execute(request):
    def retryable(exc):
        status = getattr(getattr(exc, "resp", None), "status", None)
        return status in {429, 500, 502, 503, 504} or isinstance(exc, OSError)
    return retry_call(request.execute, attempts=3, retryable=retryable, delay_seconds=0.2)


def _operation_marker(message_id: str) -> str:
    digest = hashlib.sha256(f"secure-inbox-agent:v1:{message_id}".encode("utf-8")).hexdigest()
    return f"v1-{digest}"


def _oauth_scopes(allow_label_mutation: bool) -> list[str]:
    scopes = [READ_SCOPE, COMPOSE_SCOPE]
    if allow_label_mutation:
        scopes.append(MODIFY_SCOPE)
    return scopes


def _write_token_safely(token_path: Path, content: str) -> None:
    token_path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary_name = tempfile.mkstemp(
        prefix=f".{token_path.name}.", suffix=".tmp", dir=token_path.parent
    )
    os.close(descriptor)
    temporary = Path(temporary_name)
    try:
        if os.name == "nt":
            identity = subprocess.run(
                ["whoami"], capture_output=True, text=True, check=True
            ).stdout.strip()
            if not identity:
                raise RuntimeError("could not determine current Windows account for token ACL")
            subprocess.run(
                ["icacls", str(temporary), "/inheritance:r", "/grant:r", f"{identity}:(R,W)"],
                capture_output=True,
                text=True,
                check=True,
            )
        else:
            temporary.chmod(0o600)
        temporary.write_text(content, encoding="utf-8")
        os.replace(temporary, token_path)
    except Exception:
        temporary.unlink(missing_ok=True)
        raise

