"""What this host adds: one row of answers, and the environment both children read.

The questions themselves are this program's, but what they *mean* belongs to the children
and is tested there. What is tested here is only what neither child can do alone — hold a
person's answers between runs, and hand each child its own vocabulary of them.
"""
import pytest

from openoutreach import wizard
from openoutreach.config.models import SiteConfig

ANSWERS = dict(
    product_docs="A lead finder for small B2B teams.",
    campaign_target="Founders selling to other founders.",
    ai_model="anthropic:claude-sonnet-4-5-20250929",
    llm_api_key="sk-not-a-real-key",
    bettercontact_api_key="bc-not-a-real-key",
    operator_name="Ada Lovelace",
    operator_email="ada@example.com",
    operator_country_code="us",
    mailbox_address="ada@example.com",
    mailbox_password="app-password",
)


@pytest.fixture
def configured(db):
    config = SiteConfig.load()
    for field, value in ANSWERS.items():
        setattr(config, field, value)
    config.save()
    return config


@pytest.fixture(autouse=True)
def _no_inherited_variables(monkeypatch):
    """A developer's own exports must not decide what a test sees."""
    import os

    for name in [n for n in os.environ if n.startswith(("OPENOUTFIND_", "OUTSEND_"))]:
        monkeypatch.delenv(name)


class TestTheExport:
    """One answer, two vocabularies — the only thing that knows both names."""

    def test_a_shared_answer_reaches_both_children_under_their_own_names(self, configured):
        environment = configured.export()

        assert environment["OPENOUTFIND_PRODUCT_DOCS"] == ANSWERS["product_docs"]
        assert environment["OUTSEND_PRODUCT_DOCS"] == ANSWERS["product_docs"]
        assert environment["OPENOUTFIND_LLM_API_KEY"] == environment["OUTSEND_LLM_API_KEY"]

    def test_the_suffixes_are_not_assumed_to_match(self, configured):
        """`OPERATOR_NAME` against a finder that signs nothing, and a shared
        `OPERATOR_COUNTRY` name both children happen to spell alike."""
        environment = configured.export()

        assert environment["OPENOUTFIND_OPERATOR_COUNTRY"] == "us"
        assert environment["OUTSEND_OPERATOR_COUNTRY"] == "us"
        assert environment["OUTSEND_OPERATOR_NAME"] == "Ada Lovelace"
        assert "OPENOUTFIND_OPERATOR_NAME" not in environment

    def test_a_blank_field_exports_nothing_rather_than_an_empty_value(self, configured):
        """Unset means *use your default* to a child; blank would override it with
        nothing — the sender's SMTP host is the case that bites."""
        environment = configured.export()

        assert "OUTSEND_SMTP_HOST" not in environment
        assert "OUTSEND_BOOKING_LINK" not in environment

    def test_a_boolean_exports_as_a_word(self, configured):
        environment = configured.export()

        assert environment["OPENOUTFIND_NEWSLETTER"] == "false"

    def test_no_legal_notice_flag_is_exported(self, configured):
        assert "OPENOUTFIND_ACCEPT_LEGAL_NOTICE" not in configured.export()

    def test_ollama_model_exports_as_openai_compatible_with_cloud_settings(self, configured):
        configured.ai_model = "ollama:gemma4:31b"
        configured.llm_api_base = "https://ollama.my-cloud.com/v1"
        configured.llm_api_key = "secret-token"

        environment = configured.export()
        assert environment["OPENOUTFIND_AI_MODEL"] == "openai_compatible:gemma4:31b"
        assert environment["OUTSEND_AI_MODEL"] == "openai_compatible:gemma4:31b"
        assert environment["OPENOUTFIND_LLM_API_BASE"] == "https://ollama.my-cloud.com/v1"
        assert environment["OUTSEND_LLM_API_BASE"] == "https://ollama.my-cloud.com/v1"
        assert environment["OPENOUTFIND_LLM_API_KEY"] == "secret-token"
        assert environment["OUTSEND_LLM_API_KEY"] == "secret-token"

    def test_ollama_model_defaults_base_and_key_when_empty(self, configured):
        configured.ai_model = "ollama:llama3.3"
        configured.llm_api_base = ""
        configured.llm_api_key = ""

        environment = configured.export()
        assert environment["OPENOUTFIND_AI_MODEL"] == "openai_compatible:llama3.3"
        assert environment["OUTSEND_AI_MODEL"] == "openai_compatible:llama3.3"
        assert environment["OPENOUTFIND_LLM_API_BASE"] == "http://localhost:11434/v1"
        assert environment["OUTSEND_LLM_API_BASE"] == "http://localhost:11434/v1"
        assert environment["OPENOUTFIND_LLM_API_KEY"] == "ollama"
        assert environment["OUTSEND_LLM_API_KEY"] == "ollama"


class TestApplyingIt:
    def test_the_answers_land_in_the_environment(self, configured):
        wizard.apply_to_environment(configured)

        import os
        assert os.environ["OPENOUTFIND_BETTERCONTACT_API_KEY"] == "bc-not-a-real-key"
        assert os.environ["OUTSEND_MAILBOX_PASSWORD"] == "app-password"

    def test_an_explicit_export_beats_the_stored_answer(self, configured, monkeypatch):
        """A variable set for this run was set on purpose; a stored answer quietly
        reverting it is the failure the children's own seeding rule prevents."""
        monkeypatch.setenv("OUTSEND_PRODUCT_DOCS", "What the unit file says.")

        wizard.apply_to_environment(configured)

        import os
        assert os.environ["OUTSEND_PRODUCT_DOCS"] == "What the unit file says."
        assert os.environ["OPENOUTFIND_PRODUCT_DOCS"] == ANSWERS["product_docs"]


class TestWhatItAsksFor:
    def test_a_configured_install_is_asked_nothing(self, configured, monkeypatch):
        monkeypatch.setattr("sys.stdin.isatty", lambda: True)
        monkeypatch.setattr(wizard, "_ask", _refuse)
        monkeypatch.setattr(wizard, "_ask_secret", _refuse)

        wizard._ask_what_is_missing(configured)  # must not prompt

    def test_a_headless_install_is_told_which_variables_would_answer(self, db, monkeypatch):
        monkeypatch.setattr("sys.stdin.isatty", lambda: False)

        with pytest.raises(SystemExit) as raised:
            wizard._ask_what_is_missing(SiteConfig.load())

        message = str(raised.value)
        assert "OPENOUTFIND_PRODUCT_DOCS" in message
        assert "OUTSEND_MAILBOX_ADDRESS" in message
        assert "OPENOUTFIND_ACCEPT_LEGAL_NOTICE" not in message

    def test_a_variable_already_exported_is_not_asked_for_again(self, db, monkeypatch):
        """Being told is being told, whichever way round it happened."""
        config = SiteConfig.load()
        for field, value in ANSWERS.items():
            if field != "bettercontact_api_key":
                setattr(config, field, value)
        monkeypatch.setenv("OPENOUTFIND_BETTERCONTACT_API_KEY", "from-the-unit-file")
        monkeypatch.setattr("sys.stdin.isatty", lambda: False)

        wizard._ask_what_is_missing(config)  # must not raise


class TestWritingEnvironmentAnswersBack:
    """An agent that answers by exporting, not typing, still gets remembered once."""

    def test_an_env_only_answer_is_present_on_the_saved_row(self, db, monkeypatch):
        config = SiteConfig.load()
        for field, value in ANSWERS.items():
            if field != "bettercontact_api_key":
                setattr(config, field, value)
        monkeypatch.setenv("OPENOUTFIND_BETTERCONTACT_API_KEY", "from-the-agent")

        wizard._write_back_from_environment(config)

        assert config.bettercontact_api_key == "from-the-agent"

    def test_the_newsletter_is_written_back_too(self, db, monkeypatch):
        config = SiteConfig.load()
        for field, value in ANSWERS.items():
            setattr(config, field, value)
        monkeypatch.setenv("OPENOUTFIND_NEWSLETTER", "true")

        wizard._write_back_from_environment(config)

        assert config.newsletter is True

    def test_a_second_onboard_with_the_export_removed_does_not_ask_again(
        self, db, monkeypatch
    ):
        config = SiteConfig.load()
        for field, value in ANSWERS.items():
            if field != "bettercontact_api_key":
                setattr(config, field, value)
        monkeypatch.setenv("OPENOUTFIND_BETTERCONTACT_API_KEY", "from-the-agent")
        wizard._write_back_from_environment(config)
        config.save()

        monkeypatch.delenv("OPENOUTFIND_BETTERCONTACT_API_KEY")
        monkeypatch.setattr("sys.stdin.isatty", lambda: True)
        monkeypatch.setattr(wizard, "_ask", _refuse)
        monkeypatch.setattr(wizard, "_ask_secret", _refuse)

        wizard._ask_what_is_missing(SiteConfig.load())  # must not prompt

    def test_write_back_never_overrules_a_value_already_on_the_row(self, db, monkeypatch):
        config = SiteConfig.load()
        for field, value in ANSWERS.items():
            setattr(config, field, value)
        monkeypatch.setenv("OPENOUTFIND_BETTERCONTACT_API_KEY", "different-from-the-row")

        wizard._write_back_from_environment(config)

        assert config.bettercontact_api_key == ANSWERS["bettercontact_api_key"]

    def test_apply_to_environment_still_lets_an_export_win_for_this_run(
        self, configured, monkeypatch
    ):
        """`apply_to_environment`'s `setdefault` is untouched by the write-back."""
        monkeypatch.setenv("OUTSEND_PRODUCT_DOCS", "What the unit file says.")

        wizard._write_back_from_environment(configured)
        wizard.apply_to_environment(configured)

        import os
        assert os.environ["OUTSEND_PRODUCT_DOCS"] == "What the unit file says."
        assert configured.product_docs == ANSWERS["product_docs"]


class TestTheNewsletterDefault:
    """Jurisdiction-aware: no opt-in-marketing law, no question."""

    def test_a_non_protected_country_auto_subscribes_without_asking(self, monkeypatch):
        monkeypatch.setattr(wizard, "_confirm", _refuse)

        assert wizard._newsletter_default(SiteConfig(operator_country_code="us")) is True

    def test_a_protected_country_still_asks(self, monkeypatch):
        monkeypatch.setattr(wizard, "_confirm", lambda question: True)

        assert wizard._newsletter_default(SiteConfig(operator_country_code="de")) is True


def _refuse(*args, **kwargs):
    raise AssertionError("asked a question this install had already answered")
