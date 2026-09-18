"""Build the Mandarin minimal-pairs-practice content set from AISHELL-1.

Filters AISHELL-1 down to short (4-8 hanzi character), pure-hanzi utterances
(no digits/Latin/punctuation), selects ~3,000 of them favoring speakers with
the most candidates (to limit how many speaker archives need downloading),
extracts + transcodes the selected clips to mp3, computes each clip's pinyin
(diacritic style, one syllable per space-delimited token - same shape the
frontend's Vietnamese distractor generator already expects), and writes
`public/data/minimal-pairs-practice/cmn/clips.json` + `cmn/audio/*.mp3`.

No heteronym filtering: hard-excluding any transcript with a heteronym
character was tested and is far too strict (474 survivors, not 3,000) since
pypinyin's heteronym dictionary flags nearly every common function word. We
rely on pypinyin's default phrase-aware best-guess instead - documented,
accepted risk (occasional wrong tone on a rare heteronym).

The HF mirror of this dataset only actually ships wav archives for 100 of
the 400 speakers referenced in the transcript/speaker.info files (checked
via `list_repo_files` - the rest 404), so selection is restricted to those
100 up front. Downloads ~3.5GB of speaker archives into the local HF cache
(~/.cache/huggingface) - run `huggingface-cli delete-cache` afterward if you
want to reclaim that disk space; it's not part of the repo or the deploy.

Run with:
    uv run python tonepractice/build_mandarin_clips.py
"""

import json
import random
import re
import shutil
import subprocess
import tarfile
from collections import defaultdict
from pathlib import Path

from huggingface_hub import list_repo_files
from pypinyin import Style, pinyin

from aishell_data import DATASET_ID, Utterance, download, load_transcripts

REPO_ROOT = Path(__file__).resolve().parents[2]
OUTPUT_DIR = REPO_ROOT / "public" / "data" / "minimal-pairs-practice" / "cmn"
AUDIO_DIR = OUTPUT_DIR / "audio"

MIN_LENGTH = 4
MAX_LENGTH = 10
MAX_CLIPS_PER_SPEAKER = 30
TARGET_CLIP_COUNT = 3000
RANDOM_SEED = 42
MP3_BITRATE = "64k"

HANZI_ONLY_PATTERN = re.compile(r"^[一-鿿]+$")


def list_available_speaker_ids() -> set[str]:
    # The HF mirror only actually ships wav archives for a subset of the
    # 400 speakers referenced in the transcript/speaker.info files (100 at
    # last check) - selection must be restricted to speakers that actually
    # have downloadable audio, or extraction 404s partway through.
    files = list_repo_files(repo_id=DATASET_ID, repo_type="dataset")
    return {
        name.rsplit("/", 1)[-1].removeprefix("S").removesuffix(".tar.gz")
        for name in files
        if name.startswith("data_aishell/wav/S") and name.endswith(".tar.gz")
    }


def filter_candidates(utterances: list[Utterance], available_speaker_ids: set[str]) -> list[Utterance]:
    return [
        u
        for u in utterances
        if MIN_LENGTH <= len(u.transcript) <= MAX_LENGTH
        and HANZI_ONLY_PATTERN.match(u.transcript)
        and u.speaker_id in available_speaker_ids
    ]


def select_clips(candidates: list[Utterance]) -> list[Utterance]:
    by_speaker: dict[str, list[Utterance]] = defaultdict(list)
    for u in candidates:
        by_speaker[u.speaker_id].append(u)

    rng = random.Random(RANDOM_SEED)
    for items in by_speaker.values():
        rng.shuffle(items)

    # Densest speakers first, so we reach the target using as few distinct
    # speaker archives (each a ~36MB download) as possible, while still
    # capping per-speaker to keep voice variety.
    speakers_by_density = sorted(by_speaker.items(), key=lambda kv: -len(kv[1]))

    selected: list[Utterance] = []
    for _speaker_id, items in speakers_by_density:
        remaining = TARGET_CLIP_COUNT - len(selected)
        if remaining <= 0:
            break
        selected.extend(items[: min(MAX_CLIPS_PER_SPEAKER, remaining)])
    return selected


def to_pinyin(transcript: str) -> str:
    syllables = [reading[0] for reading in pinyin(transcript, style=Style.TONE)]
    return " ".join(syllables)


def transcode_to_mp3(wav_bytes: bytes, out_path: Path) -> None:
    process = subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", "pipe:0", "-codec:a", "libmp3lame", "-b:a", MP3_BITRATE, str(out_path)],
        input=wav_bytes,
        capture_output=True,
    )
    if process.returncode != 0:
        raise RuntimeError(f"ffmpeg failed for {out_path}: {process.stderr.decode()}")


def extract_selected_clips(selected: list[Utterance]) -> None:
    by_speaker: dict[str, list[Utterance]] = defaultdict(list)
    for u in selected:
        by_speaker[u.speaker_id].append(u)

    for index, (speaker_id, items) in enumerate(sorted(by_speaker.items()), start=1):
        print(f"[{index}/{len(by_speaker)}] speaker S{speaker_id}: extracting {len(items)} clips")
        archive_path = download(f"data_aishell/wav/S{speaker_id}.tar.gz")
        wanted_ids = {u.utterance_id for u in items}

        with tarfile.open(archive_path) as tf:
            for member in tf.getmembers():
                if not member.name.endswith(".wav"):
                    continue
                utterance_id = member.name.rsplit("/", 1)[-1].removesuffix(".wav")
                if utterance_id not in wanted_ids:
                    continue
                wav_bytes = tf.extractfile(member).read()
                transcode_to_mp3(wav_bytes, AUDIO_DIR / f"{utterance_id}.mp3")


def write_clips_json(selected: list[Utterance]) -> None:
    clips = [
        {"filename": f"{u.utterance_id}.mp3", "transcript": to_pinyin(u.transcript), "nativeScript": u.transcript}
        for u in selected
    ]
    (OUTPUT_DIR / "clips.json").write_text(json.dumps(clips, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    if shutil.which("ffmpeg") is None:
        raise SystemExit("ffmpeg not found on PATH - required to transcode wav clips to mp3")

    AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    available_speaker_ids = list_available_speaker_ids()
    print(f"{len(available_speaker_ids)} speakers have downloadable audio on the HF mirror")

    utterances = load_transcripts()
    candidates = filter_candidates(utterances, available_speaker_ids)
    print(f"{len(candidates)} candidates ({MIN_LENGTH}-{MAX_LENGTH} hanzi chars, pure hanzi, available speaker)")

    selected = select_clips(candidates)
    speaker_count = len({u.speaker_id for u in selected})
    print(f"selected {len(selected)} clips across {speaker_count} speakers")

    extract_selected_clips(selected)
    write_clips_json(selected)

    print(f"done - wrote {len(selected)} clips to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
