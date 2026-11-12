"""Small bounded retry helper for transient network/API failures."""

import time
from collections.abc import Callable
from typing import TypeVar

T = TypeVar("T")


def retry_call(
    operation: Callable[[], T],
    attempts: int = 3,
    retryable: Callable[[Exception], bool] | None = None,
    delay_seconds: float = 0.1,
) -> T:
    if attempts < 1:
        raise ValueError("attempts must be at least one")
    retryable = retryable or (lambda exc: isinstance(exc, OSError))
    for attempt in range(attempts):
        try:
            return operation()
        except Exception as exc:
            if attempt + 1 == attempts or not retryable(exc):
                raise
            time.sleep(delay_seconds * (2**attempt))
    raise AssertionError("unreachable")

