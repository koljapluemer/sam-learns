"""Small YouTube Data API client for discovery and availability checks."""

import os
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import requests

from config import LanguageProfile

API_ROOT = "https://www.googleapis.com/youtube/v3"


class YouTubeError(RuntimeError):
    pass


def _get(path: str, params: dict) -> dict:
    key = os.environ.get("YOUTUBE_API_KEY")
    if not key:
        raise YouTubeError("YOUTUBE_API_KEY not found in environment or cms/.env")
    response = requests.get(f"{API_ROOT}/{path}?{urlencode({**params, 'key': key})}", timeout=45)
    if not response.ok:
        raise YouTubeError(f"YouTube API error {response.status_code}: {response.text[:500]}")
    return response.json()


def _seconds(duration: str) -> int:
    # YouTube video durations here are comfortably below a day.
    import re
    match = re.fullmatch(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", duration)
    if not match:
        return 0
    hours, minutes, seconds = (int(value or 0) for value in match.groups())
    return hours * 3600 + minutes * 60 + seconds


def discover(profile: LanguageProfile, max_raw: int = 180) -> list[dict]:
    ids: list[str] = []
    seen: set[str] = set()
    regions = profile.regionCodes or [""]
    for index, query in enumerate(profile.queries):
        region = regions[index % len(regions)]
        negative = " ".join(f"-{term}" for term in profile.excludeTerms)
        params = {
            "part": "id", "type": "video", "q": f"{query} {negative}".strip(),
            "maxResults": 25, "order": "relevance", "safeSearch": "strict",
            "relevanceLanguage": profile.youtubeLanguage, "videoCaption": "closedCaption",
            "videoDuration": "short", "videoEmbeddable": "true", "videoSyndicated": "true",
            "publishedAfter": (datetime.now(timezone.utc) - timedelta(days=3650)).isoformat().replace("+00:00", "Z"),
        }
        if region:
            params["regionCode"] = region
        for item in _get("search", params).get("items", []):
            video_id = item.get("id", {}).get("videoId")
            if video_id and video_id not in seen:
                seen.add(video_id)
                ids.append(video_id)
        if len(ids) >= max_raw:
            break
    return video_details(ids[:max_raw])


def video_details(ids: list[str]) -> list[dict]:
    results: list[dict] = []
    for offset in range(0, len(ids), 50):
        data = _get("videos", {
            "part": "snippet,contentDetails,status", "id": ",".join(ids[offset:offset + 50]), "maxResults": 50,
        })
        for item in data.get("items", []):
            snippet = item.get("snippet", {})
            details = item.get("contentDetails", {})
            status = item.get("status", {})
            results.append({
                "youtube_id": item["id"], "title": snippet.get("title", ""),
                "description": snippet.get("description", ""), "channel_id": snippet.get("channelId", ""),
                "channel_name": snippet.get("channelTitle", ""), "duration_seconds": _seconds(details.get("duration", "")),
                "thumbnail_url": snippet.get("thumbnails", {}).get("high", {}).get("url", ""),
                "captioned": details.get("caption") == "true", "embeddable": status.get("embeddable", False),
                "made_for_kids": status.get("madeForKids", False),
                "age_restricted": details.get("contentRating", {}).get("ytRating") == "ytAgeRestricted",
                "live": snippet.get("liveBroadcastContent", "none") != "none",
            })
    return results
