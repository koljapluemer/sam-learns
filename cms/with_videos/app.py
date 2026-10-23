"""Streamlit CMS for discovering, reviewing, and publishing short videos."""

import sys
from collections import Counter
from pathlib import Path

import pycountry
import streamlit as st
from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).resolve().parent))
load_dotenv()

from common import OUTPUT_DIR, VIDEOS_PATH, read_json
from config import (
    ChannelPolicy, LanguageProfile, load_channel_policies, load_profiles,
    remove_channel_policy, save_channel_policy, save_profiles,
)
from discovery import run_discovery
from ollama_client import EMBEDDING_MODEL, ESCALATION_MODEL, SCREENING_MODEL, OllamaError, installed_models, structured_chat
from pipeline import invalidate, process_video
from publish import unpublish
from store import candidate, candidates, set_status, upsert_candidate
from youtube import YouTubeError, video_details

st.set_page_config(page_title="With Videos CMS", layout="wide")


def video_embed(youtube_id: str) -> None:
    st.iframe(f"https://www.youtube.com/embed/{youtube_id}", height=420)


def profile_by_code(code: str) -> LanguageProfile:
    return next(profile for profile in load_profiles() if profile.languageCode == code)


def render_health() -> None:
    missing = []
    try:
        models = installed_models()
        for model in (EMBEDDING_MODEL, SCREENING_MODEL, ESCALATION_MODEL):
            if model not in models:
                missing.append(model)
    except OllamaError as exc:
        st.warning(str(exc))
        return
    if missing:
        st.warning("Missing Ollama models: " + ", ".join(missing))
        st.code("\n".join(f"ollama pull {model}" for model in missing))


def render_discover() -> None:
    st.header("Discover")
    profiles = [profile for profile in load_profiles() if profile.enabled]
    if not profiles:
        st.info("Add or enable a language profile first.")
        return
    selected = st.selectbox("Language", profiles, format_func=lambda item: item.languageName)
    st.caption(f"{len(selected.queries)} queries · {selected.minDurationSeconds}–{selected.maxDurationSeconds}s · up to {selected.queueSize} candidates")
    render_health()
    if st.button("Run discovery", type="primary"):
        status = st.status("Discovering videos", expanded=True)
        try:
            result = run_discovery(selected, status.write)
            status.update(label="Discovery complete", state="complete")
            st.success(f"{result['queued']} ready to review · {result['rejected']} rejected · {result['found']} found")
            if result["rate_limited"]:
                st.warning("YouTube rate limit hit, so the remaining videos were skipped. Run again later to continue.")
        except (YouTubeError, RuntimeError) as exc:
            status.update(label="Discovery failed", state="error")
            st.error(str(exc))


def channel_counts(language_code: str) -> dict[str, int]:
    if not VIDEOS_PATH.exists():
        return {}
    counts: dict[str, int] = {}
    for item in candidates(language_code, ("published",)):
        counts[item["channel_id"]] = counts.get(item["channel_id"], 0) + 1
    return counts


def render_review() -> None:
    st.header("Review")
    queue = candidates(statuses=("review", "processing_failed"))
    if not queue:
        st.info("Nothing waiting for review.")
        return
    labels = {item["youtube_id"]: f"{item['title']} — {item['channel_name']}" for item in queue}
    youtube_id = st.selectbox("Candidate", list(labels), format_func=labels.get)
    item = candidate(youtube_id)
    profile = profile_by_code(item["language_code"])
    info, preview = st.columns([1, 2])
    with info:
        st.subheader(item["title"])
        st.caption(f"{item['channel_name']} · {item['duration_seconds']}s · {profile.languageName}")
        for reason in item["decision_reasons"]:
            st.warning(reason)
        if item.get("error"):
            st.error(item["error"])
        with st.expander("Transcript", expanded=True):
            st.write(item["transcript"])
        with st.expander("Screening details"):
            st.json(item.get("screen_result") or {})
    with preview:
        video_embed(youtube_id)

    published_from_channel = channel_counts(item["language_code"]).get(item["channel_id"], 0)
    if published_from_channel >= 2:
        st.warning(f"This channel already has {published_from_channel} published videos. Approval is an explicit diversity override.")

    approve_col, reject_col, trust_col, block_col = st.columns(4)
    if approve_col.button("Approve and publish", type="primary", use_container_width=True):
        language = pycountry.languages.get(alpha_3=item["language_code"])
        set_status(youtube_id, "processing")
        status = st.status("Processing", expanded=True)
        try:
            process_video(youtube_id, language, status.write)
            set_status(youtube_id, "published")
            status.update(label="Published", state="complete")
            st.rerun()
        except Exception as exc:
            set_status(youtube_id, "processing_failed", error=str(exc))
            status.update(label="Processing failed", state="error")
            st.error(str(exc))
    if reject_col.button("Reject", use_container_width=True):
        set_status(youtube_id, "rejected", ["rejected in review"])
        st.rerun()
    if trust_col.button("Trust channel", use_container_width=True):
        save_channel_policy(ChannelPolicy(item["channel_id"], item["channel_name"], "trusted", [item["language_code"]]))
        st.success("Channel trusted")
    if block_col.button("Block and reject", use_container_width=True):
        save_channel_policy(ChannelPolicy(item["channel_id"], item["channel_name"], "blocked", [item["language_code"]]))
        set_status(youtube_id, "rejected", ["blocked channel"])
        st.rerun()


def render_rejection(item: dict) -> None:
    with st.expander(f"{item['title']} — {', '.join(item['decision_reasons'])}"):
        st.caption(f"{item['channel_name']} · {item['duration_seconds']}s · {item['status']} · "
                   f"[YouTube](https://www.youtube.com/watch?v={item['youtube_id']})")
        if item["transcript"]:
            st.write(item["transcript"])
        if item.get("screen_result"):
            st.json(item["screen_result"], expanded=False)
        if st.button("Restore", key=f"restore-{item['youtube_id']}"):
            set_status(item["youtube_id"], "review")
            st.rerun()


def render_rejected() -> None:
    st.header("Rejected")
    rejected = candidates(statuses=("rejected", "auto_rejected"))
    if not rejected:
        st.info("Nothing rejected.")
        return
    counts = Counter(reason for item in rejected for reason in item["decision_reasons"])
    st.caption(" · ".join(f"{count}× {reason}" for reason, count in counts.most_common()))
    for item in rejected:
        render_rejection(item)


def render_library() -> None:
    st.header("Library")
    videos = read_json(VIDEOS_PATH) if VIDEOS_PATH.exists() else []
    if not videos:
        st.info("No published videos.")
        return
    labels = {item["youtubeId"]: f"{item['title']} — {item['languageName']}" for item in videos}
    youtube_id = st.selectbox("Published video", list(labels), format_func=labels.get)
    video = next(item for item in videos if item["youtubeId"] == youtube_id)
    video_embed(youtube_id)
    snippet_path = OUTPUT_DIR / "snippets" / f"{youtube_id}.json"
    snippets = read_json(snippet_path) if snippet_path.exists() else []
    st.caption(f"{len(snippets)} snippets")
    with st.expander("Snippets and vocabulary"):
        for snippet in snippets:
            terms = ", ".join(f"{item['term']} — {item['translation']}" for item in snippet.get("vocab", []))
            st.write(f"**{snippet['start']:.1f}–{snippet['end']:.1f}s** {snippet['text']}")
            st.caption(terms or "No vocabulary")

    availability_col, reprocess_col, unpublish_col = st.columns(3)
    if availability_col.button("Check availability", use_container_width=True):
        try:
            details = video_details([youtube_id])
            st.success("Available and embeddable" if details and details[0]["embeddable"] else "Unavailable or not embeddable")
        except YouTubeError as exc:
            st.error(str(exc))
    stage = reprocess_col.selectbox("Reprocess from", ["vocabulary", "snippets", "audio", "subtitles"], label_visibility="collapsed")
    if reprocess_col.button("Reprocess", use_container_width=True):
        language = pycountry.languages.get(alpha_3=video["languageCode"])
        status = st.status("Reprocessing", expanded=True)
        try:
            invalidate(youtube_id, stage)
            process_video(youtube_id, language, status.write)
            status.update(label="Republished", state="complete")
        except Exception as exc:
            status.update(label="Reprocessing failed; published data retained", state="error")
            st.error(str(exc))
    if unpublish_col.button("Unpublish", use_container_width=True):
        unpublish(youtube_id)
        existing = candidate(youtube_id)
        if existing:
            set_status(youtube_id, "review", ["unpublished"])
        else:
            upsert_candidate({
                "youtube_id": youtube_id, "language_code": video["languageCode"], "title": video["title"],
                "description": "", "channel_id": "", "channel_name": "Unknown channel",
                "duration_seconds": 0, "thumbnail_url": "", "transcript": "", "status": "review",
                "decision_reasons": ["unpublished legacy entry"],
            })
        st.rerun()


PROFILE_SCHEMA = {
    "type": "object",
    "properties": {
        "queries": {"type": "array", "items": {"type": "string"}, "minItems": 4, "maxItems": 10},
        "excludeTerms": {"type": "array", "items": {"type": "string"}, "minItems": 3, "maxItems": 10},
    },
    "required": ["queries", "excludeTerms"], "additionalProperties": False,
}


def render_settings() -> None:
    st.header("Profiles and channels")
    profiles = load_profiles()
    for index, profile in enumerate(profiles):
        with st.expander(profile.languageName):
            regions = st.text_input("Regions", ", ".join(profile.regionCodes), key=f"regions-{profile.languageCode}")
            queries = st.text_area("Queries", "\n".join(profile.queries), key=f"queries-{profile.languageCode}")
            exclusions = st.text_area("Exclusions", "\n".join(profile.excludeTerms), key=f"exclude-{profile.languageCode}")
            duration_col, queue_col = st.columns(2)
            minimum = duration_col.number_input(
                "Minimum seconds", min_value=5, max_value=120, value=profile.minDurationSeconds,
                key=f"min-{profile.languageCode}",
            )
            maximum = duration_col.number_input(
                "Maximum seconds", min_value=30, max_value=240, value=profile.maxDurationSeconds,
                key=f"max-{profile.languageCode}",
            )
            queue_size = queue_col.number_input(
                "Review queue size", min_value=1, max_value=100, value=profile.queueSize,
                key=f"queue-{profile.languageCode}",
            )
            enabled = st.checkbox("Enabled", profile.enabled, key=f"enabled-{profile.languageCode}")
            if st.button("Save profile", key=f"save-{profile.languageCode}"):
                profiles[index] = LanguageProfile(**{
                    **profile.__dict__, "queries": [line.strip() for line in queries.splitlines() if line.strip()],
                    "excludeTerms": [line.strip() for line in exclusions.splitlines() if line.strip()],
                    "regionCodes": [item.strip().upper() for item in regions.split(",") if item.strip()],
                    "minDurationSeconds": int(minimum), "maxDurationSeconds": int(maximum),
                    "queueSize": int(queue_size), "enabled": enabled,
                })
                try:
                    save_profiles(profiles)
                    st.success("Saved")
                except ValueError as exc:
                    st.error(str(exc))

    st.subheader("Add language")
    with st.form("new-profile"):
        code = st.text_input("ISO 639-3 code", max_chars=3)
        regions = st.text_input("Region codes", help="Comma-separated, for example ES, MX")
        submitted = st.form_submit_button("Generate profile")
    if submitted:
        language = pycountry.languages.get(alpha_3=code.lower())
        if not language or not hasattr(language, "alpha_2"):
            st.error("Unknown language or no ISO 639-1 code")
        else:
            prompt = f"Generate native-language YouTube search queries for pleasant short videos about everyday life, food, places, hobbies, animals, culture, crafts, and mini stories in {language.name}. Also give native-language exclusion terms for politics, news, ragebait, reaction compilations, and children's compilations."
            try:
                generated = structured_chat(ESCALATION_MODEL, prompt, PROFILE_SCHEMA)
                profiles.append(LanguageProfile(
                    code.lower(), language.alpha_2, language.name,
                    [item.strip().upper() for item in regions.split(",") if item.strip()],
                    generated["queries"], generated["excludeTerms"],
                ))
                save_profiles(profiles)
                st.success("Profile generated. Review its queries above.")
                st.rerun()
            except OllamaError as exc:
                st.error(str(exc))

    st.subheader("Channel policy")
    for policy in load_channel_policies().values():
        left, middle, right = st.columns([3, 1, 1])
        left.write(policy.channelName)
        middle.write(policy.state)
        if right.button("Remove", key=f"remove-policy-{policy.channelId}"):
            remove_channel_policy(policy.channelId)
            st.rerun()


discover_tab, review_tab, rejected_tab, library_tab, settings_tab = st.tabs(
    ["Discover", "Review", "Rejected", "Library", "Profiles and channels"]
)
with discover_tab:
    render_discover()
with review_tab:
    render_review()
with rejected_tab:
    render_rejected()
with library_tab:
    render_library()
with settings_tab:
    render_settings()
