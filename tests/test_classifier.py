from secure_inbox.classifier import OpenAICompatibleClassifier, _chat_completion
from secure_inbox.config import Settings
from secure_inbox.models import Category, EmailMessage, parse_classification


def test_invalid_structured_output_is_rejected():
    try:
        parse_classification({"category": "not-a-category", "confidence": 0.5})
    except ValueError:
        pass
    else:
        raise AssertionError("invalid category must be rejected")


def test_provider_failure_uses_deterministic_fallback(monkeypatch):
    import secure_inbox.classifier as module

    def fail(*args, **kwargs):
        raise OSError("synthetic provider outage")

    monkeypatch.setattr(module, "_chat_completion", fail)
    message = EmailMessage("m", "t", "reader@example.test", "Question", "Could you tell me about this?")
    classifier = OpenAICompatibleClassifier(Settings(openai_api_key="test-only", classifier_model="fixture-model"))
    assert classifier.classify(message).category == Category.GENERAL


def test_corrupt_payload_type_is_rejected():
    for value in (None, [], "broken"):
        try:
            parse_classification(value)
        except ValueError:
            pass
        else:
            raise AssertionError("unexpected payload must be rejected")


def test_provider_url_rejects_cleartext_remote_and_embedded_credentials():
    for url in (
        "http://example.com/v1",
        "ftp://example.com/v1",
        "https://user:password@example.com/v1",
        "https://example.com/v1?token=secret",
    ):
        try:
            _chat_completion(Settings(openai_base_url=url), {})
        except ValueError as exc:
            assert "HTTPS" in str(exc)
        else:
            raise AssertionError(f"unsafe provider URL accepted: {url}")


def test_loopback_provider_url_is_allowed_for_local_testing(monkeypatch):
    class Response:
        def __enter__(self):
            return self

        def __exit__(self, *args):
            return None

        def read(self, limit):
            assert limit == 1_000_001
            return b'{"choices":[{"message":{"content":"ok"}}]}'

    from types import SimpleNamespace

    monkeypatch.setattr(
        "urllib.request.build_opener",
        lambda *handlers: SimpleNamespace(open=lambda request, timeout: Response()),
    )
    settings = Settings(openai_api_key="synthetic", openai_base_url="http://127.0.0.1:1234/v1")
    assert _chat_completion(settings, {}) == "ok"

