import subprocess

import pytest

from secure_inbox.sandbox import OfflineHtmlInspector, SandboxUnavailable


def test_live_url_inspection_is_disabled():
    with pytest.raises(SandboxUnavailable, match="disabled"):
        OfflineHtmlInspector().inspect_url("https://example.com")


def test_unsafe_redirect_target_is_rejected_by_destination_validator():
    from secure_inbox.security import validate_public_http_url

    # A redirect handler must pass every Location through the same destination validator.
    assert not validate_public_http_url("http://127.0.0.1/admin")


def test_docker_absence_fails_safely(monkeypatch):
    def missing(*args, **kwargs): raise FileNotFoundError()
    monkeypatch.setattr(subprocess, "run", missing)
    with pytest.raises(SandboxUnavailable, match="unavailable"):
        OfflineHtmlInspector().inspect_html("<p>hello</p>")

