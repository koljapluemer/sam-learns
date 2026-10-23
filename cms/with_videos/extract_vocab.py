"""Extract a small, useful vocabulary set from subtitle snippets via OpenAI."""

import json
import os
import time
import urllib.error
import urllib.request
from pathlib import Path

from common import read_json, video_dir, write_json

API_URL = "https://api.openai.com/v1/responses"
MODEL = "gpt-5.6-sol"
PROMPT_VERSION = 2
BATCH_SIZE = 8
SYSTEM_PROMPT = """You help an English-speaking learner understand {language} video subtitles.
For each current snippet, extract only the words, short expressions, or constructions that materially help understand it.

Rules:
- Return at most five items per snippet; prefer fewer and return none when nothing is useful.
- Never return full sentences, guesses, uncertain interpretations, duplicates, or expressions identical to English.
- The term must occur verbatim in the current snippet, though surrounding context may disambiguate it.
- Prefer useful multi-word expressions over isolated function words.
- Translate with a concise English gloss that fits this context.
- core is true only when the item is essential to the snippet's meaning; otherwise false.
"""

VOCAB_ITEM_SCHEMA = {
    "type": "object",
    "properties": {
        "term": {"type": "string"}, "translation": {"type": "string"}, "core": {"type": "boolean"},
    },
    "required": ["term", "translation", "core"], "additionalProperties": False,
}
BATCH_SCHEMA = {
    "type": "object",
    "properties": {"snippets": {"type": "array", "items": {
        "type": "object",
        "properties": {"id": {"type": "string"}, "vocab": {"type": "array", "items": VOCAB_ITEM_SCHEMA}},
        "required": ["id", "vocab"], "additionalProperties": False,
    }}},
    "required": ["snippets"], "additionalProperties": False,
}


def extract_output_text(response_json: dict) -> str:
    chunks = []
    for item in response_json.get("output", []):
        if item.get("type") == "message":
            chunks.extend(content["text"] for content in item.get("content", []) if content.get("type") == "output_text")
    if not (text := "".join(chunks).strip()):
        raise ValueError("API response did not contain output text")
    return text


def build_request_body(items: list[dict], language: str) -> dict:
    return {
        "model": MODEL, "reasoning": {"effort": "low"},
        "input": [
            {"role": "developer", "content": SYSTEM_PROMPT.format(language=language)},
            {"role": "user", "content": json.dumps({"snippets": items}, ensure_ascii=False)},
        ],
        "text": {"format": {"type": "json_schema", "name": "video_vocab", "strict": True, "schema": BATCH_SCHEMA}},
    }


def request_vocab_batch(items: list[dict], language: str, api_key: str, attempts: int = 3) -> dict[str, list[dict]]:
    payload = json.dumps(build_request_body(items, language)).encode()
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    for attempt in range(1, attempts + 1):
        request = urllib.request.Request(API_URL, data=payload, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(request, timeout=180) as response:
                body = json.loads(response.read().decode())
            parsed = json.loads(extract_output_text(body))["snippets"]
            return {item["id"]: item["vocab"] for item in parsed}
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode(errors="replace")
            if attempt == attempts or (exc.code < 500 and exc.code != 429):
                raise RuntimeError(f"OpenAI API error {exc.code}: {detail}") from exc
        except (urllib.error.URLError, TimeoutError, KeyError, ValueError, json.JSONDecodeError) as exc:
            if attempt == attempts:
                raise RuntimeError(f"Failed to extract vocab: {exc}") from exc
        time.sleep(min(2 ** attempt, 16))
    raise RuntimeError("OpenAI API call failed after retries")


def _cache_key(snippet: dict, previous: str, following: str) -> str:
    return json.dumps([PROMPT_VERSION, MODEL, snippet["text"], previous, following], ensure_ascii=False)


def load_cache(path: Path) -> dict[str, list[dict]]:
    if not path.exists():
        return {}
    data = read_json(path)
    return data if isinstance(data, dict) else {}


def clean_vocab(text: str, items: list[dict]) -> list[dict]:
    cleaned = []
    seen = set()
    folded_text = text.casefold()
    for item in items:
        term = item.get("term", "").strip()
        translation = item.get("translation", "").strip()
        key = term.casefold()
        if not term or not translation or key in seen or key not in folded_text or key == translation.casefold():
            continue
        seen.add(key)
        cleaned.append({"term": term, "translation": translation, "core": bool(item.get("core"))})
    return cleaned[:5]


def extract_vocab(youtube_id: str, snippets: list[dict], language: str) -> list[dict]:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not found in environment or cms/.env")
    directory = video_dir(youtube_id)
    cache_path = directory / "vocab-cache.json"
    cache = load_cache(cache_path)
    contexts = []
    for index, snippet in enumerate(snippets):
        previous = snippets[index - 1]["text"] if index else ""
        following = snippets[index + 1]["text"] if index + 1 < len(snippets) else ""
        contexts.append((snippet, previous, following, _cache_key(snippet, previous, following)))

    pending = [item for item in contexts if item[0]["text"].strip() and item[3] not in cache]
    for offset in range(0, len(pending), BATCH_SIZE):
        batch = pending[offset:offset + BATCH_SIZE]
        request_items = [
            {"id": snippet["id"], "previous": previous, "current": snippet["text"], "following": following}
            for snippet, previous, following, _ in batch
        ]
        returned = request_vocab_batch(request_items, language, api_key)
        for snippet, _, _, key in batch:
            cache[key] = clean_vocab(snippet["text"], returned.get(snippet["id"], []))
        write_json(cache_path, cache)

    results = [{**snippet, "vocab": cache.get(key, []) if snippet["text"].strip() else []} for snippet, _, _, key in contexts]
    write_json(directory / "vocab.json", results)
    return results
