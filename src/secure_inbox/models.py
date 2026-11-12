"""Data contracts shared across the inbox pipeline."""

from dataclasses import dataclass, field
from enum import StrEnum
from typing import Any


class Category(StrEnum):
    BUSINESS = "business_inquiry"
    SPONSORSHIP = "brand_sponsorship"
    GENERAL = "general_question"
    SPAM = "spam"
    SUSPICIOUS = "suspicious"
    REVIEW = "needs_manual_review"


class WorkflowState(StrEnum):
    PROCESSING = "AI/Processing"
    DRAFTED = "AI/Drafted"
    NEEDS_REVIEW = "AI/Needs-Review"
    FAILED = "AI/Failed"


@dataclass(frozen=True)
class EmailMessage:
    id: str
    thread_id: str
    sender: str
    subject: str
    body: str
    label_ids: frozenset[str] = field(default_factory=frozenset)
    internal_date: str = ""


@dataclass(frozen=True)
class Classification:
    category: Category
    confidence: float
    rationale: str = ""
    requires_review: bool = False


@dataclass(frozen=True)
class Draft:
    to: str
    subject: str
    body: str


@dataclass(frozen=True)
class Policy:
    sponsorship_enabled: bool = False
    approved_terms: str = ""
    minimum_price: float | None = None


def parse_classification(payload: Any) -> Classification:
    if not isinstance(payload, dict):
        raise ValueError("classification response must be an object")
    try:
        category = Category(payload["category"])
        confidence = float(payload["confidence"])
    except (KeyError, TypeError, ValueError) as exc:
        raise ValueError("classification response has invalid fields") from exc
    if not 0 <= confidence <= 1:
        raise ValueError("confidence must be between zero and one")
    review = bool(payload.get("requires_review", False)) or confidence < 0.65
    return Classification(category, confidence, "", review)

