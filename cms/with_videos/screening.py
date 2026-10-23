"""Deterministic, embedding, and local-model candidate screening."""

import math
import re

from ollama_client import ESCALATION_MODEL, SCREENING_MODEL, structured_chat

SCREEN_SCHEMA = {
    "type": "object",
    "properties": {
        "decision": {"type": "string", "enum": ["accept", "reject", "uncertain"]},
        "detected_language": {"type": "string"},
        "reasons": {"type": "array", "items": {"type": "string"}},
        "flags": {
            "type": "array",
            "items": {"type": "string", "enum": [
                "wrong_language", "politics", "ragebait", "aggression", "children",
                "promotion", "synthetic", "repetitive", "weak_context", "poor_learning_value",
            ]},
        },
    },
    "required": ["decision", "detected_language", "reasons", "flags"],
    "additionalProperties": False,
}


def normalized_text(candidate: dict) -> str:
    text = f"{candidate['title']}\n{candidate.get('description', '')[:1000]}\n{candidate.get('transcript', '')[:5000]}"
    return re.sub(r"\s+", " ", text).strip()


def metadata_reasons(candidate: dict, min_seconds: int, max_seconds: int) -> list[str]:
    reasons = []
    duration = candidate["duration_seconds"]
    if duration < min_seconds or duration > max_seconds:
        reasons.append("outside duration range")
    if not candidate.get("captioned"):
        reasons.append("no captions")
    if not candidate.get("embeddable"):
        reasons.append("not embeddable")
    if candidate.get("made_for_kids"):
        reasons.append("made for children")
    if candidate.get("age_restricted"):
        reasons.append("age restricted")
    if candidate.get("live"):
        reasons.append("live or upcoming")
    return reasons


def transcript_reasons(transcript: str) -> list[str]:
    words = transcript.split()
    if len(words) < 12:
        return ["too little subtitle text"]
    if len(set(word.lower() for word in words)) / len(words) < 0.18:
        return ["highly repetitive transcript"]
    return []


def cosine(left: list[float], right: list[float]) -> float:
    numerator = sum(a * b for a, b in zip(left, right))
    denominator = math.sqrt(sum(a * a for a in left) * sum(b * b for b in right))
    return numerator / denominator if denominator else 0.0


def diverse_selection(candidates: list[dict], limit: int, duplicate_threshold: float = 0.96, diversity: float = 0.75) -> list[dict]:
    """Deduplicate then use maximal marginal relevance for a varied shortlist."""
    unique: list[dict] = []
    for item in candidates:
        vector = item.get("embedding")
        if vector and any(existing.get("embedding") and cosine(vector, existing["embedding"]) >= duplicate_threshold for existing in unique):
            continue
        unique.append(item)

    selected: list[dict] = []
    remaining = unique[:]
    while remaining and len(selected) < limit:
        def score(item: dict) -> float:
            relevance = 1.1 if item.get("trusted_channel") else 1.0
            similarity = max((cosine(item["embedding"], other["embedding"]) for other in selected), default=0.0)
            return diversity * relevance - (1 - diversity) * similarity
        winner = max(remaining, key=score)
        selected.append(winner)
        remaining.remove(winner)
    return selected


def _prompt(candidate: dict, language_name: str) -> str:
    return f"""Assess whether this short YouTube video is pleasant, useful authentic input for a learner of {language_name}.
Reject political content, outrage/ragebait, hostility, screaming-child content, advertising, obvious AI slop, repetitive filler,
wrong-language speech, or material without enough self-contained spoken meaning. Ordinary food, places, hobbies, animals,
culture, crafts, humour, and daily life are welcome. Be conservative about rejection: use uncertain when evidence is weak.

Title: {candidate['title']}
Channel: {candidate['channel_name']}
Description: {candidate.get('description', '')[:1200]}
Transcript: {candidate.get('transcript', '')[:6000]}"""


def screen(candidate: dict, language_name: str) -> dict:
    prompt = _prompt(candidate, language_name)
    first = structured_chat(SCREENING_MODEL, prompt, SCREEN_SCHEMA, candidate.get("thumbnail_url", ""))
    result = {"primary_model": SCREENING_MODEL, "primary": first}
    if first["decision"] in {"reject", "uncertain"}:
        second = structured_chat(ESCALATION_MODEL, prompt, SCREEN_SCHEMA, candidate.get("thumbnail_url", ""))
        result.update({"escalation_model": ESCALATION_MODEL, "escalation": second})
        if first["decision"] == second["decision"] == "reject":
            result["decision"] = "reject"
        else:
            result["decision"] = "uncertain"
    else:
        result["decision"] = "accept"
    return result
