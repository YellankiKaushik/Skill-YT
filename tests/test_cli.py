import pytest

from secure_inbox.cli import SelectedMessageMailbox, main
from secure_inbox.models import EmailMessage


def test_live_mode_requires_exactly_one_explicit_message_before_oauth():
    with pytest.raises(SystemExit) as exc:
        main(["--live"])
    assert exc.value.code == 2


def test_single_message_mailbox_does_not_list_the_inbox():
    selected = EmailMessage(
        "synthetic-id", "thread", "sender@example.test", "Question", "hello", frozenset({"INBOX"})
    )

    class Client:
        allow_label_mutation = False

        def get_message(self, message_id):
            assert message_id == "synthetic-id"
            return selected

        def list_inbox(self):
            raise AssertionError("bounded live flow must not list the inbox")

    assert SelectedMessageMailbox(Client(), "synthetic-id").list_inbox() == [selected]


def test_single_message_mailbox_rejects_archived_or_non_inbox_messages():
    selected = EmailMessage("synthetic-id", "thread", "sender@example.test", "Question", "hello")

    class Client:
        allow_label_mutation = False

        def get_message(self, message_id):
            return selected

    with pytest.raises(ValueError, match="not in the Inbox"):
        SelectedMessageMailbox(Client(), "synthetic-id").list_inbox()


def test_live_message_id_rejects_control_characters_before_oauth():
    with pytest.raises(SystemExit) as exc:
        main(["--live", "--message-id", "message\nid"])
    assert exc.value.code == 2
