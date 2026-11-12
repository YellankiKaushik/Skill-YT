"""Deterministic boundaries for untrusted email and tool actions."""

import ipaddress
import re
from urllib.parse import urlsplit

from .models import Classification, Category, EmailMessage

INJECTION_PATTERNS = (
    r"ignore (all )?(previous|prior|above) instructions",
    r"reveal (the )?(system prompt|hidden instructions)",
    r"send (the )?(user's|users|private) (private )?information",
    r"enter (your )?(password|credentials|login)",
    r"accept this offer even if",
    r"disregard (the )?(pricing|commercial) policy",
)
SUSPICIOUS_PATTERNS = (
    r"verify your account",
    r"urgent.{0,20}(password|login|credential)",
    r"wire transfer",
    r"seed phrase",
    r"send.{0,30}(password|api key|token)",
)
_URL_RE = re.compile(r"https?://[^\s<>\]\[\"']+", re.IGNORECASE)


def has_prompt_injection(text: str) -> bool:
    return any(re.search(pattern, text, re.IGNORECASE) for pattern in INJECTION_PATTERNS)


def deterministic_classification(message: EmailMessage) -> Classification:
    content = f"{message.sender}\n{message.subject}\n{message.body}"
    if has_prompt_injection(content) or any(
        re.search(p, content, re.IGNORECASE) for p in SUSPICIOUS_PATTERNS
    ):
        return Classification(Category.SUSPICIOUS, 0.99, "security rule matched", True)
    lowered = content.lower()
    if "sponsorship" in lowered or "brand partnership" in lowered:
        return Classification(Category.SPONSORSHIP, 0.72, "keyword fallback", True)
    if "question" in message.subject.lower() or "could you tell me" in lowered:
        return Classification(Category.GENERAL, 0.72, "question fallback", False)
    if "unsubscribe" in lowered or "buy now" in lowered:
        return Classification(Category.SPAM, 0.8, "spam keyword fallback", False)
    if "business" in lowered or "project inquiry" in lowered:
        return Classification(Category.BUSINESS, 0.66, "keyword fallback", True)
    return Classification(Category.REVIEW, 0.3, "uncertain fallback", True)


def extract_urls(text: str) -> list[str]:
    return _URL_RE.findall(text)


def validate_public_http_url(url: str) -> bool:
    """Reject unsafe destinations before any fetch; redirects must be checked again."""
    try:
        parsed = urlsplit(url)
        if parsed.scheme not in {"http", "https"} or not parsed.hostname:
            return False
        host = parsed.hostname.rstrip(".").lower()
        if host in {"localhost", "metadata.google.internal", "metadata"}:
            return False
        if host.endswith((".localhost", ".local", ".internal", ".test")):
            return False
        try:
            address = ipaddress.ip_address(host)
        except ValueError:
            return True
        return address.is_global
    except (ValueError, UnicodeError):
        return False


class DraftOnlyBoundary:
    """Expose only explicit read/classify/draft methods to agent-facing code."""

    ALLOWED = frozenset({"get_message", "list_inbox", "create_draft", "transition"})
    FORBIDDEN = frozenset({"send_email", "send", "messages.send", "drafts.send"})
    __slots__ = ("__mailbox",)

    def __init__(self, mailbox: object):
        self.__mailbox = mailbox

    def invoke(self, method: str, **kwargs):
        if method in self.FORBIDDEN or method not in self.ALLOWED:
            raise PermissionError(f"mail operation is not allowed: {method}")
        return getattr(self.__mailbox, method)(**kwargs)

