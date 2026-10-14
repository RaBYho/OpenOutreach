# openoutreach/api/schemas.py
"""Pydantic schemas for the REST API — inputs and outputs, not Django models."""
from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


# ── AI Provider ──────────────────────────────────────────────────────

PROVIDERS = [
    {
        "id": "openrouter",
        "name": "OpenRouter",
        "description": "Accès unifié à tous les modèles IA (Claude, Gemini, GPT, Llama…)",
        "logo": "openrouter",
        "requires_key": True,
        "requires_base": False,
        "default_base": "https://openrouter.ai/api/v1",
        "models": [
            {"id": "anthropic/claude-sonnet-4-5", "name": "Claude Sonnet 4.5"},
            {"id": "google/gemini-2.5-pro", "name": "Gemini 2.5 Pro"},
            {"id": "google/gemini-2.5-flash", "name": "Gemini 2.5 Flash"},
            {"id": "openai/gpt-4o", "name": "GPT-4o"},
            {"id": "meta-llama/llama-3.3-70b-instruct", "name": "Llama 3.3 70B"},
        ],
        "prefix": "openai_compatible",
    },
    {
        "id": "anthropic",
        "name": "Anthropic Claude",
        "description": "Modèles Claude — excellence en raisonnement et rédaction",
        "logo": "anthropic",
        "requires_key": True,
        "requires_base": False,
        "default_base": "",
        "models": [
            {"id": "claude-sonnet-4-5-20250929", "name": "Claude Sonnet 4.5"},
            {"id": "claude-haiku-3-5-20241022", "name": "Claude Haiku 3.5"},
            {"id": "claude-opus-4-5-20250929", "name": "Claude Opus 4.5"},
        ],
        "prefix": "anthropic",
    },
    {
        "id": "google",
        "name": "Google Gemini",
        "description": "Modèles Gemini — multimodaux et ultra-rapides",
        "logo": "google",
        "requires_key": True,
        "requires_base": False,
        "default_base": "",
        "models": [
            {"id": "gemini-2.5-pro", "name": "Gemini 2.5 Pro"},
            {"id": "gemini-2.5-flash", "name": "Gemini 2.5 Flash"},
            {"id": "gemini-2.0-flash", "name": "Gemini 2.0 Flash"},
        ],
        "prefix": "google",
    },
    {
        "id": "openai",
        "name": "OpenAI",
        "description": "GPT-4o et les modèles OpenAI les plus populaires",
        "logo": "openai",
        "requires_key": True,
        "requires_base": False,
        "default_base": "",
        "models": [
            {"id": "gpt-4o", "name": "GPT-4o"},
            {"id": "gpt-4o-mini", "name": "GPT-4o Mini"},
            {"id": "o3-mini", "name": "o3 Mini"},
        ],
        "prefix": "openai",
    },
    {
        "id": "groq",
        "name": "Groq",
        "description": "Inférence ultra-rapide sur du matériel LPU dédié",
        "logo": "groq",
        "requires_key": True,
        "requires_base": False,
        "default_base": "",
        "models": [
            {"id": "llama-3.3-70b-versatile", "name": "Llama 3.3 70B"},
            {"id": "llama-3.1-8b-instant", "name": "Llama 3.1 8B Instant"},
            {"id": "mixtral-8x7b-32768", "name": "Mixtral 8x7B"},
        ],
        "prefix": "groq",
    },
    {
        "id": "mistral",
        "name": "Mistral AI",
        "description": "Modèles open-weight européens hautes performances",
        "logo": "mistral",
        "requires_key": True,
        "requires_base": False,
        "default_base": "",
        "models": [
            {"id": "mistral-large-latest", "name": "Mistral Large"},
            {"id": "mistral-medium-latest", "name": "Mistral Medium"},
            {"id": "open-mixtral-8x22b", "name": "Mixtral 8x22B"},
        ],
        "prefix": "mistral",
    },
    {
        "id": "ollama",
        "name": "Ollama",
        "description": "Modèles locaux ou sur votre propre serveur cloud",
        "logo": "ollama",
        "requires_key": False,
        "requires_base": True,
        "default_base": "http://localhost:11434/v1",
        "models": [
            {"id": "gemma4:31b", "name": "Gemma 4 31B"},
            {"id": "llama3.3", "name": "Llama 3.3"},
            {"id": "qwen2.5:72b", "name": "Qwen 2.5 72B"},
            {"id": "mistral", "name": "Mistral 7B"},
            {"id": "deepseek-r1:32b", "name": "DeepSeek R1 32B"},
        ],
        "prefix": "ollama",
    },
]


class ProviderOut(BaseModel):
    id: str
    name: str
    description: str
    logo: str
    requires_key: bool
    requires_base: bool
    default_base: str
    models: list[dict[str, str]]
    prefix: str


class ConfigOut(BaseModel):
    is_configured: bool
    product_docs: str
    campaign_target: str
    booking_link: str
    ai_model: str
    llm_api_base: str
    has_llm_api_key: bool
    bettercontact_api_key: str
    apollo_api_key: str
    email_finder: str
    operator_name: str
    operator_email: str
    operator_country_code: str
    newsletter: bool
    mailbox_address: str
    smtp_host: str
    smtp_port: str
    imap_host: str
    imap_port: str
    signature: str
    has_mailbox_password: bool
    has_bettercontact_api_key: bool


class ConfigIn(BaseModel):
    product_docs: str | None = None
    campaign_target: str | None = None
    booking_link: str | None = None
    ai_model: str | None = None
    llm_api_key: str | None = None
    llm_api_base: str | None = None
    bettercontact_api_key: str | None = None
    apollo_api_key: str | None = None
    email_finder: str | None = None
    operator_name: str | None = None
    operator_email: str | None = None
    operator_country_code: str | None = None
    newsletter: bool | None = None
    mailbox_address: str | None = None
    mailbox_password: str | None = None
    smtp_host: str | None = None
    smtp_port: str | None = None
    imap_host: str | None = None
    imap_port: str | None = None
    signature: str | None = None


class LLMTestIn(BaseModel):
    ai_model: str
    llm_api_key: str = ""
    llm_api_base: str = ""


class LLMTestOut(BaseModel):
    success: bool
    error: str | None = None


class StatusOut(BaseModel):
    leads_found: int
    leads_with_email: int
    emails_sent: int
    emails_opened: int
    is_configured: bool
    finder_ready: bool
    sender_ready: bool
    finder_issues: list[str]
    sender_issues: list[str]


class LeadOut(BaseModel):
    id: Any
    first_name: str
    last_name: str
    company: str
    title: str
    email: str
    linkedin_url: str
    website: str
    reason: str
    qualified_at: str | None


class MessageOut(BaseModel):
    detail: str


class RunIn(BaseModel):
    goal: int = Field(default=5, ge=1, le=100)

