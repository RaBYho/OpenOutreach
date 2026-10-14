#!/usr/bin/env python3
"""Test script to verify LLM connection (including Ollama Cloud / remote endpoints).

Usage:
    .venv/bin/python scripts/test_llm.py --model ollama:gemma4:31b --base https://mon-domaine:11434/v1 --key mon-token
"""
import argparse
import os
import sys
import time

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "openoutreach.settings")

try:
    import django
    django.setup()
except Exception as e:
    print(f"Warning during django setup: {e}", file=sys.stderr)

from openoutfind.core.llm import build_llm_model, run_agent_sync, verify_llm_credentials
from pydantic_ai import Agent


def main():
    parser = argparse.ArgumentParser(description="Test LLM connectivity and prompt response.")
    parser.add_argument(
        "--model",
        default="ollama:gemma4:31b",
        help="Model string (e.g. ollama:gemma4:31b, openai_compatible:gemma4:31b, etc.)",
    )
    parser.add_argument(
        "--base",
        default="",
        help="API Base URL (e.g. https://your-ollama-cloud-host/v1 or http://localhost:11434/v1)",
    )
    parser.add_argument(
        "--key",
        default="",
        help="API Key / Token (defaults to 'ollama' if empty for Ollama)",
    )
    parser.add_argument(
        "--prompt",
        default="Dis bonjour en une phrase courte et confirme ton nom de modèle.",
        help="Prompt to test generation",
    )
    args = parser.parse_args()

    model_id = args.model
    api_base = args.base
    api_key = args.key

    is_ollama = model_id.startswith("ollama:")
    if is_ollama:
        if not api_base:
            api_base = "http://localhost:11434/v1"
        if not api_key:
            api_key = "ollama"
        # Map to openai_compatible for openoutfind/pydantic-ai
        actual_model = f"openai_compatible:{model_id[len('ollama:'):]}"
    else:
        actual_model = model_id

    print(f"==> Test de connexion LLM")
    print(f"  • Modèle demandé : {model_id}")
    print(f"  • Modèle effectif : {actual_model}")
    print(f"  • Base URL        : {api_base or '(défaut provider)'}")
    print(f"  • Clé API         : {'*' * len(api_key) if api_key else '(vide)'}")
    print()

    print("Vérification des identifiants (ping)...", end=" ", flush=True)
    t0 = time.time()
    error = verify_llm_credentials(actual_model, api_key, api_base)
    t_ping = time.time() - t0

    if error:
        print(f"ÉCHEC ✗ ({t_ping:.2f}s)")
        print(f"Erreur retournée par le modèle / endpoint :")
        print(f"  {error}")
        sys.exit(1)

    print(f"SUCCÈS ✓ ({t_ping:.2f}s)")
    print()

    print(f"Envoi du prompt de test : '{args.prompt}'...")
    try:
        t0 = time.time()
        agent = Agent(build_llm_model(actual_model, api_key, api_base))
        response = run_agent_sync(agent.run(args.prompt))
        t_gen = time.time() - t0
        print(f"Réponse reçue en {t_gen:.2f}s :")
        print("--------------------------------------------------")
        print(response.output)
        print("--------------------------------------------------")
        print("✓ Test complet réussi avec succès !")
    except Exception as exc:
        print(f"✗ Erreur lors de la génération : {exc}")
        sys.exit(1)


if __name__ == "__main__":
    main()

