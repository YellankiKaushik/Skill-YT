"""Environment configuration. Live services remain opt-in."""

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"
    classifier_model: str = ""
    drafter_model: str = ""
    classifier_max_tokens: int = 180
    drafter_max_tokens: int = 500
    timeout_seconds: int = 20
    gmail_credentials_path: str = "credentials.json"
    gmail_token_path: str = "token.json"
    enable_label_mutation: bool = False

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            openai_api_key=os.getenv("OPENAI_API_KEY", ""),
            openai_base_url=os.getenv("OPENAI_BASE_URL", cls.openai_base_url),
            classifier_model=os.getenv("CLASSIFIER_MODEL", ""),
            drafter_model=os.getenv("DRAFTER_MODEL", ""),
            classifier_max_tokens=_positive_int("CLASSIFIER_MAX_TOKENS", 180),
            drafter_max_tokens=_positive_int("DRAFTER_MAX_TOKENS", 500),
            timeout_seconds=_positive_int("AI_TIMEOUT_SECONDS", 20),
            gmail_credentials_path=os.getenv("GMAIL_CREDENTIALS_PATH", "credentials.json"),
            gmail_token_path=os.getenv("GMAIL_TOKEN_PATH", "token.json"),
            enable_label_mutation=os.getenv("GMAIL_ENABLE_LABEL_MUTATION", "false").lower()
            == "true",
        )


def _positive_int(name: str, default: int) -> int:
    try:
        value = int(os.getenv(name, str(default)))
    except ValueError as exc:
        raise ValueError(f"{name} must be an integer") from exc
    if value <= 0:
        raise ValueError(f"{name} must be positive")
    return value

