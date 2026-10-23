"""End-to-end discovery orchestration used by Streamlit."""

import hashlib

from config import LanguageProfile, load_channel_policies
from download import RateLimited, download_transcript
from ollama_client import EMBEDDING_MODEL, OllamaError, embed
from screening import diverse_selection, metadata_reasons, normalized_text, screen, transcript_reasons
from split_snippets import load_subtitle_words
from store import candidates, finish_discovery_run, start_discovery_run, upsert_candidate
from youtube import discover
from common import VIDEOS_PATH, read_json


def published_ids() -> set[str]:
    if not VIDEOS_PATH.exists():
        return set()
    return {item["youtubeId"] for item in read_json(VIDEOS_PATH)}


def subtitle_text(path) -> str:
    return " ".join(text for _, text in load_subtitle_words(path)).strip()


def run_discovery(profile: LanguageProfile, on_progress=lambda _message: None) -> dict:
    run_id = start_discovery_run(profile.languageCode)
    policy = load_channel_policies()
    blocked = {channel_id for channel_id, item in policy.items() if item.state == "blocked"}
    trusted = {channel_id for channel_id, item in policy.items() if item.state == "trusted"}
    known = published_ids() | {item["youtube_id"] for item in candidates()}
    raw = discover(profile)
    prepared: list[dict] = []
    seen_channels: set[str] = set()
    rejected = 0
    rate_limited = False

    for index, item in enumerate(raw, start=1):
        on_progress(f"Checking {index}/{len(raw)}: {item['title']}")
        if item["youtube_id"] in known or item["channel_id"] in blocked or item["channel_id"] in seen_channels:
            continue
        reasons = metadata_reasons(item, profile.minDurationSeconds, profile.maxDurationSeconds)
        if reasons:
            upsert_candidate({
                **item, "language_code": profile.languageCode, "transcript": "",
                "status": "auto_rejected", "decision_reasons": reasons,
            })
            rejected += 1
            continue
        try:
            subtitle = download_transcript(item["youtube_id"], profile.youtubeLanguage)
        except RateLimited:
            # Leave the rest unsaved so the next run picks them up.
            on_progress("YouTube rate limit hit; stopping subtitle downloads")
            rate_limited = True
            break
        except Exception as exc:
            upsert_candidate({
                **item, "language_code": profile.languageCode, "transcript": "", "status": "review",
                "error": f"Subtitle download failed: {exc}", "decision_reasons": ["screening incomplete"],
            })
            continue
        item["transcript"] = subtitle_text(subtitle) if subtitle else ""
        reasons = transcript_reasons(item["transcript"]) if subtitle else [f"no original {profile.languageName} subtitles"]
        candidate = {**item, "language_code": profile.languageCode, "trusted_channel": item["channel_id"] in trusted}
        if reasons:
            upsert_candidate({**candidate, "status": "auto_rejected", "decision_reasons": reasons})
            rejected += 1
            continue
        seen_channels.add(item["channel_id"])
        prepared.append(candidate)

    if prepared:
        texts = [normalized_text(item) for item in prepared]
        try:
            vectors = embed(texts)
            for item, text, vector in zip(prepared, texts, vectors):
                item["embedding"] = vector
                item["embedding_model"] = EMBEDDING_MODEL
                item["content_hash"] = hashlib.sha256(text.encode()).hexdigest()
            prepared = diverse_selection(prepared, profile.queueSize)
        except OllamaError as exc:
            on_progress(str(exc))
            prepared = prepared[:profile.queueSize]

    queued = 0
    for index, item in enumerate(prepared, start=1):
        on_progress(f"Screening {index}/{len(prepared)}: {item['title']}")
        try:
            result = screen(item, profile.languageName)
            status = "auto_rejected" if result["decision"] == "reject" else "review"
            reasons = result.get("escalation", result["primary"]).get("reasons", [])
            upsert_candidate({**item, "status": status, "screen_result": result, "decision_reasons": reasons})
            if status == "review":
                queued += 1
            else:
                rejected += 1
        except OllamaError as exc:
            upsert_candidate({**item, "status": "review", "error": str(exc), "decision_reasons": ["local screening unavailable"]})
            queued += 1
    result = {
        "found": len(raw), "prepared": len(prepared), "queued": queued, "rejected": rejected,
        "rate_limited": rate_limited,
    }
    finish_discovery_run(run_id, result, "rate limited" if rate_limited else None)
    return result
