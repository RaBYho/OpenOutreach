# openoutreach/api/router.py
"""Django Ninja API router — the web interface's backend contract.

All endpoints are under /api/v1/. CORS is handled by corsheaders middleware
configured in settings. Authentication is not required for a self-hosted single-
operator install; add Django session auth here if multi-user support is needed.
"""
from __future__ import annotations

import io
import sys
from typing import Any

from django.http import StreamingHttpResponse
from ninja import NinjaAPI

from openoutreach.api.schemas import (
    PROVIDERS,
    ConfigIn,
    ConfigOut,
    LLMTestIn,
    LLMTestOut,
    MessageOut,
    ProviderOut,
    RunIn,
    StatusOut,
)

api = NinjaAPI(
    title="OpenOutreach API",
    version="1.0",
    description="REST API for the OpenOutreach web interface.",
    urls_namespace="openoutreach_api",
)


# ── Providers ────────────────────────────────────────────────────────

@api.get("/providers", response=list[ProviderOut], tags=["providers"])
def list_providers(request):
    """Return all supported AI provider definitions."""
    return PROVIDERS


# ── Configuration ────────────────────────────────────────────────────

def _load_config() -> Any:
    from openoutreach.config.models import SiteConfig
    return SiteConfig.load()


def _is_fully_configured(config) -> bool:
    """Quick check: all required fields present."""
    required = ["product_docs", "ai_model", "llm_api_key", "bettercontact_api_key",
                "operator_email", "mailbox_address", "mailbox_password"]
    return all(getattr(config, f, "") for f in required)


@api.get("/config", response=ConfigOut, tags=["config"])
def get_config(request):
    """Return the current site configuration (secrets redacted)."""
    config = _load_config()
    return ConfigOut(
        is_configured=_is_fully_configured(config),
        product_docs=config.product_docs,
        campaign_target=config.campaign_target,
        booking_link=config.booking_link,
        ai_model=config.ai_model,
        llm_api_base=config.llm_api_base,
        has_llm_api_key=bool(config.llm_api_key),
        bettercontact_api_key=config.bettercontact_api_key,
        apollo_api_key=config.apollo_api_key,
        email_finder=config.email_finder,
        operator_name=config.operator_name,
        operator_email=config.operator_email,
        operator_country_code=config.operator_country_code,
        newsletter=config.newsletter,
        mailbox_address=config.mailbox_address,
        smtp_host=config.smtp_host,
        smtp_port=config.smtp_port,
        imap_host=config.imap_host,
        imap_port=config.imap_port,
        signature=config.signature,
        has_mailbox_password=bool(config.mailbox_password),
        has_bettercontact_api_key=bool(config.bettercontact_api_key),
    )


@api.patch("/config", response=ConfigOut, tags=["config"])
def update_config(request, payload: ConfigIn):
    """Update stored configuration fields."""
    config = _load_config()
    for field, value in payload.model_dump(exclude_none=True).items():
        if value != "" or field in {"newsletter"}:
            setattr(config, field, value)
    config.save()
    return get_config(request)


# ── LLM Test ─────────────────────────────────────────────────────────

@api.post("/config/test-llm", response=LLMTestOut, tags=["config"])
def test_llm(request, payload: LLMTestIn):
    """Ping an LLM endpoint and return success/error."""
    from openoutfind.core.llm import verify_llm_credentials

    ai_model = payload.ai_model
    api_key = payload.llm_api_key
    api_base = payload.llm_api_base

    # Normalise ollama prefix
    if ai_model.startswith("ollama:"):
        ai_model = f"openai_compatible:{ai_model[7:]}"
        if not api_base:
            api_base = "http://localhost:11434/v1"
        if not api_key:
            api_key = "ollama"

    error = verify_llm_credentials(ai_model, api_key, api_base)
    if error is None:
        return LLMTestOut(success=True)
    return LLMTestOut(success=False, error=error)


# ── Status ────────────────────────────────────────────────────────────

@api.get("/status", response=StatusOut, tags=["status"])
def get_status(request):
    """Return lead counts and readiness checks for both children."""
    from django.db import DatabaseError

    finder_issues: list[str] = []
    sender_issues: list[str] = []
    leads_found = leads_with_email = emails_sent = emails_opened = 0
    finder_ready = sender_ready = False

    try:
        from openoutfind.crm.models import Lead  # type: ignore
        leads_found = Lead.objects.count()
        leads_with_email = Lead.objects.exclude(email="").count()
    except (DatabaseError, Exception):
        finder_issues.append("CRM unavailable")

    try:
        from openoutsend.emails.models import Message  # type: ignore
        emails_sent = Message.objects.filter(sent_at__isnull=False).count()
        emails_opened = Message.objects.filter(opened_at__isnull=False).count()
    except (DatabaseError, Exception):
        sender_issues.append("Mail log unavailable")

    try:
        from openoutfind.core import readiness as r
        r.check_ready()
        finder_ready = True
    except Exception as exc:
        finder_issues.append(str(exc))

    try:
        from openoutsend import first_run as fr
        fr.check_ready()
        sender_ready = True
    except Exception as exc:
        sender_issues.append(str(exc))

    config = _load_config()
    return StatusOut(
        leads_found=leads_found,
        leads_with_email=leads_with_email,
        emails_sent=emails_sent,
        emails_opened=emails_opened,
        is_configured=_is_fully_configured(config),
        finder_ready=finder_ready,
        sender_ready=sender_ready,
        finder_issues=finder_issues,
        sender_issues=sender_issues,
    )


# ── Leads ─────────────────────────────────────────────────────────────

@api.get("/leads", tags=["leads"])
def list_leads(request, page: int = 1, per_page: int = 50, with_email: bool | None = None):
    """Return paginated leads from the CRM."""
    from django.db import DatabaseError

    try:
        from openoutfind.crm.models import Lead  # type: ignore
        qs = Lead.objects.order_by("-qualified_at")
        if with_email is True:
            qs = qs.exclude(email="")
        elif with_email is False:
            qs = qs.filter(email="")
        total = qs.count()
        offset = (page - 1) * per_page
        items = list(qs[offset: offset + per_page].values(
            "id", "first_name", "last_name", "company", "title",
            "email", "linkedin_url", "website", "reason", "qualified_at",
        ))
        return {"total": total, "page": page, "per_page": per_page, "items": items}
    except (DatabaseError, Exception) as exc:
        return {"total": 0, "page": 1, "per_page": per_page, "items": [], "error": str(exc)}


@api.get("/leads/export", tags=["leads"])
def export_leads_csv(request):
    """Stream all qualified leads with emails as CSV."""
    def _generate():
        import csv
        import io as _io
        from openoutfind.crm.models import Lead  # type: ignore
        buf = _io.StringIO()
        writer = csv.writer(buf)
        writer.writerow([
            "email", "first_name", "last_name", "company", "title",
            "website", "linkedin_url", "reason", "lead_id", "qualified_at",
        ])
        for lead in Lead.objects.exclude(email="").order_by("-qualified_at").iterator():
            writer.writerow([
                lead.email, lead.first_name, lead.last_name,
                lead.company, lead.title, lead.website,
                lead.linkedin_url, lead.reason,
                lead.id, lead.qualified_at,
            ])
            yield buf.getvalue()
            buf.seek(0)
            buf.truncate(0)

    response = StreamingHttpResponse(_generate(), content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="leads.csv"'
    return response


# ── Campaign actions ──────────────────────────────────────────────────

@api.post("/campaign/find", response=MessageOut, tags=["campaign"])
def campaign_find(request, goal: int = 10, with_emails: bool = False):
    """Trigger a find pass in the background."""
    import threading

    from openoutreach.config.models import SiteConfig
    from openoutreach import wizard

    config = SiteConfig.load()
    wizard.apply_to_environment(config)

    def _run():
        from django.core.management import call_command
        args = [str(goal)]
        if with_emails:
            args.append("emails")
        try:
            call_command("find", *args)
        except Exception:
            pass

    threading.Thread(target=_run, daemon=True).start()
    unit = "leads avec email" if with_emails else "leads"
    return MessageOut(detail=f"Recherche de {goal} {unit} lancée en arrière-plan.")


@api.post("/campaign/send", response=MessageOut, tags=["campaign"])
def campaign_send(request, goal: int | None = None):
    """Trigger a send pass in the background."""
    import threading

    from openoutreach.config.models import SiteConfig
    from openoutreach import wizard

    config = SiteConfig.load()
    wizard.apply_to_environment(config)

    def _run():
        try:
            from openoutsend.__main__ import main as outsend_main
            args = ["send"]
            if goal:
                args.append(str(goal))
            outsend_main(args)
        except Exception:
            pass

    threading.Thread(target=_run, daemon=True).start()
    return MessageOut(detail="Envoi des emails lancé en arrière-plan.")


@api.post("/campaign/run", response=MessageOut, tags=["campaign"])
def campaign_run(request, payload: RunIn):
    """Run the full find-then-send pipeline in the background."""
    import threading

    from openoutreach.config.models import SiteConfig
    from openoutreach import wizard

    config = SiteConfig.load()
    wizard.apply_to_environment(config)

    def _run():
        try:
            from django.core.management import call_command
            from openoutsend.leads.ingest import ingest

            buf = io.StringIO()
            call_command("find", str(payload.goal), "emails", "--json", stdout=buf)
            buf.seek(0)
            ingest(buf)
            from openoutsend.__main__ import main as outsend_main
            outsend_main(["send"])
        except Exception:
            pass

    threading.Thread(target=_run, daemon=True).start()
    return MessageOut(detail=f"Pipeline complet ({payload.goal} leads) lancé en arrière-plan.")

