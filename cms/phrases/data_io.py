"""Load/save the phrases content directly under public/data/phrases/.

Unlike world_map, there's no separate CMS source-of-truth + export step:
these JSON files ARE the frontend-facing files, so load_*/save_* read and
write them in place.

Per language:
- <iso3>.json (public/data/phrases/<iso3>.json): every communication goal
  for that language (e.g. "Excuse me") -> {"expressions": {target-language
  phrase: {"note": optional str}}}
- <iso3>/audio/: mp3s for target-language phrases, named by
  audio.audio_filename (see that module) - a plain slug of the phrase
  text, shared across every goal in the language, since the same phrase
  may appear under multiple goals.
"""

import json
from pathlib import Path
from typing import TypedDict


class ExpressionEntry(TypedDict, total=False):
    note: str


class GoalEntry(TypedDict):
    expressions: dict[str, ExpressionEntry]


LanguageContent = dict[str, GoalEntry]


def find_repo_root() -> Path:
    current = Path(__file__).resolve()
    for candidate in current.parents:
        if (candidate / "package.json").exists():
            return candidate
    raise FileNotFoundError("no package.json found above cms/phrases")


def phrases_dir() -> Path:
    return find_repo_root() / "public" / "data" / "phrases"


def content_path(iso3: str) -> Path:
    return phrases_dir() / f"{iso3}.json"


def audio_dir(iso3: str) -> Path:
    return phrases_dir() / iso3 / "audio"


def list_languages() -> list[str]:
    if not phrases_dir().exists():
        return []
    return sorted(p.stem for p in phrases_dir().glob("*.json") if p.stem != "languages")


def create_language(iso3: str) -> None:
    audio_dir(iso3).mkdir(parents=True, exist_ok=True)
    if not content_path(iso3).exists():
        save_content(iso3, {})


def load_content(iso3: str) -> LanguageContent:
    path = content_path(iso3)
    if not path.exists():
        return {}
    return json.loads(path.read_text())


def save_content(iso3: str, content: LanguageContent) -> None:
    path = content_path(iso3)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(content, ensure_ascii=False, indent=2) + "\n")


def rename_key(d: dict, old_key: str, new_key: str) -> dict:
    """Rename a dict key, preserving insertion order (goal/expression order is meaningful content order)."""
    return {new_key if k == old_key else k: v for k, v in d.items()}
