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


def test_oversized_html_is_rejected_before_container_start(monkeypatch):
    def should_not_run(*args, **kwargs):
        raise AssertionError("Docker must not run for oversized input")

    monkeypatch.setattr(subprocess, "run", should_not_run)
    with pytest.raises(ValueError, match="1 MB"):
        OfflineHtmlInspector().inspect_html("x" * (1_000_000 + 1))


def test_container_timeout_fails_closed(monkeypatch):
    def timeout(*args, **kwargs):
        raise subprocess.TimeoutExpired(args[0], kwargs["timeout"])

    monkeypatch.setattr(subprocess, "run", timeout)
    with pytest.raises(SandboxUnavailable, match="time limit"):
        OfflineHtmlInspector(timeout=1).inspect_html("<p>safe</p>")

