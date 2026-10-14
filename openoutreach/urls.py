# openoutreach/urls.py
"""URLconf for the OpenOutreach web server.

This module is loaded only when running `openoutreach serve` — the CLI verbs
(`find`, `send`, `run`, `status`) never touch it and continue to work exactly
as before. There is no Admin, no sessions, no templates — just the REST API
that the web interface calls, and static file serving for the built frontend.
"""
from django.urls import path
from django.views.generic import TemplateView

from openoutreach.api.router import api

# The React SPA is built into web/dist/ and served here. In development, the
# Vite dev server runs on its own port and proxies /api/ to Django.
urlpatterns = [
    path("api/v1/", api.urls),
    # Catch-all: let React Router handle client-side navigation.
    path("", TemplateView.as_view(template_name="index.html")),
    path("<path:path>", TemplateView.as_view(template_name="index.html")),
]

