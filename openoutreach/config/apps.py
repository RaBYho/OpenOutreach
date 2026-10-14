# openoutreach/config/apps.py
from django.apps import AppConfig


class ConfigAppConfig(AppConfig):
    name = "openoutreach.config"
    # Namespaced like the children's, for the same reason: three app sets share one
    # registry and a bare `config` is exactly the label somebody else will want.
    label = "openoutreach_config"
    default_auto_field = "django.db.models.BigAutoField"

    def ready(self):
        super().ready()
        try:
            import openoutfind.core.llm as f_llm
            import openoutsend.core.llm as s_llm

            def _build_ollama(model, api_key, api_base):
                if not api_base:
                    api_base = "http://localhost:11434/v1"
                if not api_key:
                    api_key = "ollama"
                return f_llm._build_openai_compatible(model, api_key, api_base)

            f_llm._PROVIDER_BUILDERS.setdefault("ollama", _build_ollama)
            s_llm._PROVIDER_BUILDERS.setdefault("ollama", _build_ollama)
        except (ImportError, AttributeError):
            pass
