"""Extract vocabulary (with English translations) from snippets via the OpenAI Responses API.
Each item is rated as core (needed to understand the snippet) or not.
Idempotent: snippets already in the output (same id + text) are skipped; results are saved after each call.

Output: data/<id>/vocab.json ([{id, start, end, text, vocab: [{term, translation, core}]}])
"""

import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

from common import read_json, video_dir, write_json

API_URL = "https://api.openai.com/v1/responses"
MODEL = "gpt-5.6-sol"
SYSTEM_PROMPT = """You help a learner understand {language} video snippets.
Extract the vocabulary from the given {language} transcript snippet and translate each item to English.

Rules:
- Cover the snippet's words and multi-word expressions (treat expressions that function as a unit as one item).
- "term" is exactly as used in the snippet, in {language}; "translation" is a concise English gloss fitting this context.
- "core": true if understanding this item is essential to grasp the meaning of the snippet,
  false if it is peripheral (fillers, function words, details the gist does not depend on).
- No duplicates, no explanations, no pronunciations.
- Transcripts may be auto-generated and contain errors; gloss what is most plausibly meant.
"""

VOCAB_SCHEMA = {
    "type": "object",
    "properties": {
        "vocab": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "term": {"type": "string"},
                    "translation": {"type": "string"},
                    "core": {"type": "boolean"},
                },
                "required": ["term", "translation", "core"],
                "additionalProperties": False,
            },
        },
    },
    "required": ["vocab"],
    "additionalProperties": False,
}


def extract_output_text(response_json: dict) -> str:
    chunks: list[str] = []
    for item in response_json.get("output", []):
        if item.get("type") != "message":
            continue
        for content in item.get("content", []):
            if content.get("type") == "output_text" and isinstance(content.get("text"), str):
                chunks.append(content["text"])
    text = "".join(chunks).strip()
    if not text:
        raise ValueError("API response did not contain output text")
    return text


def build_request_body(snippet_text: str, language: str) -> dict:
    return {
        "model": MODEL,
        "reasoning": {"effort": "low"},
        "input": [
            {"role": "developer", "content": SYSTEM_PROMPT.format(language=language)},
            {"role": "user", "content": snippet_text},
        ],
        "text": {"format": {"type": "json_schema", "name": "vocab", "strict": True, "schema": VOCAB_SCHEMA}},
    }


def request_vocab(snippet_text: str, language: str, api_key: str, attempts: int = 3) -> list[dict]:
    payload = json.dumps(build_request_body(snippet_text, language)).encode("utf-8")
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    for attempt in range(1, attempts + 1):
        request = urllib.request.Request(API_URL, data=payload, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(request, timeout=180) as response:
                response_json = json.loads(response.read().decode("utf-8"))
            return json.loads(extract_output_text(response_json))["vocab"]
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            if attempt == attempts or (exc.code < 500 and exc.code != 429):
                raise RuntimeError(f"OpenAI API error {exc.code}: {detail}") from exc
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, KeyError, ValueError) as exc:
            if attempt == attempts:
                raise RuntimeError(f"Failed to extract vocab: {exc}") from exc

        time.sleep(min(2 ** attempt, 16))

    raise RuntimeError("OpenAI API call failed after retries")


def load_existing(path: Path) -> dict[tuple[str, str], dict]:
    if not path.exists():
        return {}
    return {(item["id"], item["text"]): item for item in read_json(path)}


def extract_vocab(youtube_id: str, snippets: list[dict], language: str) -> list[dict]:
    """Returns every snippet with its vocab; snippets without text get an empty vocab list."""
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise SystemExit("OPENAI_API_KEY not found in environment or cms/.env")

    out_path = video_dir(youtube_id) / "vocab.json"
    # entries for snippets that changed (re-split, new subs) are dropped
    saved = load_existing(out_path)
    results = []
    for idx, snippet in enumerate(snippets, start=1):
        key = (snippet["id"], snippet["text"])
        if key in saved:
            results.append(saved[key])
            continue
        if snippet["text"].strip():
            print(f"  [{idx}/{len(snippets)}] {snippet['start']:.1f}s", file=sys.stderr)
            vocab = request_vocab(snippet["text"], language, api_key)
        else:
            vocab = []
        results.append({**snippet, "vocab": vocab})
        write_json(out_path, results)

    write_json(out_path, results)
    return results
