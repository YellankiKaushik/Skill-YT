from secure_inbox.classifier import OpenAICompatibleClassifier
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

