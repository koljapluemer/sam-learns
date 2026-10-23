"""Ollama HTTP client with structured output and embedding support."""

import os

import requests

BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
EMBEDDING_MODEL = os.environ.get("WITH_VIDEOS_EMBEDDING_MODEL", "qwen3-embedding:0.6b")
SCREENING_MODEL = os.environ.get("WITH_VIDEOS_SCREENING_MODEL", "qwen3.5:4b")
ESCALATION_MODEL = os.environ.get("WITH_VIDEOS_ESCALATION_MODEL", "qwen3.5:9b")


class OllamaError(RuntimeError):
    pass


def installed_models() -> set[str]:
    try:
        response = requests.get(f"{BASE_URL}/api/tags", timeout=3)
        response.raise_for_status()
        return {item["name"] for item in response.json().get("models", [])}
    except requests.RequestException as exc:
        raise OllamaError(f"Ollama is unavailable at {BASE_URL}: {exc}") from exc


def embed(texts: list[str], model: str = EMBEDDING_MODEL) -> list[list[float]]:
    try:
        response = requests.post(f"{BASE_URL}/api/embed", json={"model": model, "input": texts, "keep_alive": 0}, timeout=300)
        response.raise_for_status()
        return response.json()["embeddings"]
    except (requests.RequestException, KeyError) as exc:
        raise OllamaError(f"Ollama embedding failed: {exc}") from exc


def structured_chat(model: str, prompt: str, schema: dict, image_url: str = "") -> dict:
    content: dict = {"role": "user", "content": prompt}
    if image_url:
        try:
            image = requests.get(image_url, timeout=20)
            image.raise_for_status()
            import base64
            content["images"] = [base64.b64encode(image.content).decode("ascii")]
        except requests.RequestException:
            pass
    payload = {
        "model": model, "messages": [content], "stream": False, "format": schema,
        "think": False, "keep_alive": 0, "options": {"temperature": 0, "num_ctx": 8192},
    }
    try:
        response = requests.post(f"{BASE_URL}/api/chat", json=payload, timeout=300)
        response.raise_for_status()
        import json
        return json.loads(response.json()["message"]["content"])
    except (requests.RequestException, KeyError, ValueError) as exc:
        raise OllamaError(f"Ollama screening failed with {model}: {exc}") from exc
