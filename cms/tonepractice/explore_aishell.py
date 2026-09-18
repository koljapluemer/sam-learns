"""Exploration script for AISHELL-1, the Mandarin speech corpus we're
evaluating as a `mandarintonepractice` content source.

AISHELL-1 (https://huggingface.co/datasets/AISHELL/AISHELL-1) has no HF
loading script and no parquet auto-conversion (dataset viewer is disabled
upstream), so `datasets.load_dataset(...)` doesn't work for it. Instead we
pull individual files straight from the HF Hub repo: the transcript file and
speaker registry (both small, cover the whole corpus) plus one speaker's wav
archive as an audio sample.

Run with:
    uv run python tonepractice/explore_aishell.py
"""

import argparse
import io
import tarfile
import wave
from collections import Counter
from dataclasses import dataclass

from huggingface_hub import hf_hub_download

DATASET_ID = "AISHELL/AISHELL-1"
TRANSCRIPT_PATH = "data_aishell/transcript/aishell_transcript_v0.8.txt"
SPEAKER_INFO_PATH = "resource_aishell/speaker.info"


@dataclass
class Utterance:
    utterance_id: str
    speaker_id: str
    transcript: str


def download(filename: str) -> str:
    return hf_hub_download(repo_id=DATASET_ID, repo_type="dataset", filename=filename)


def load_transcripts() -> list[Utterance]:
    with open(download(TRANSCRIPT_PATH), encoding="utf-8") as f:
        lines = [line.strip() for line in f if line.strip()]

    utterances = []
    for line in lines:
        utterance_id, transcript = line.split(" ", 1)
        speaker_id = utterance_id[7:11]
        utterances.append(Utterance(utterance_id, speaker_id, transcript.replace(" ", "")))
    return utterances


def load_speaker_genders() -> dict[str, str]:
    with open(download(SPEAKER_INFO_PATH), encoding="utf-8") as f:
        rows = [line.split() for line in f if line.strip()]
    return {speaker_id: gender for speaker_id, gender in rows}


def print_corpus_stats(utterances: list[Utterance], genders: dict[str, str]) -> None:
    speaker_ids = {u.speaker_id for u in utterances}
    gender_counts = Counter(genders[s] for s in speaker_ids if s in genders)

    print("--- corpus-wide stats (from transcript + speaker.info) ---")
    print(f"utterances: {len(utterances)}")
    print(f"speakers: {len(speaker_ids)} (female={gender_counts['F']}, male={gender_counts['M']})")
    print(f"avg transcript length: {sum(len(u.transcript) for u in utterances) / len(utterances):.1f} chars")
    print()
    print("sample transcripts:")
    for u in utterances[:5]:
        print(f"  {u.utterance_id} [{genders.get(u.speaker_id, '?')}]  {u.transcript}")
    print()


def wav_duration_seconds(wav_bytes: bytes) -> float:
    with wave.open(io.BytesIO(wav_bytes)) as w:
        return w.getnframes() / w.getframerate()


def print_sample_speaker_stats(speaker_id: str, utterances: list[Utterance]) -> None:
    archive_path = download(f"data_aishell/wav/S{speaker_id}.tar.gz")
    transcript_by_id = {u.utterance_id: u.transcript for u in utterances}

    with tarfile.open(archive_path) as tf:
        wav_members = [m for m in tf.getmembers() if m.name.endswith(".wav")]
        durations = []
        for member in wav_members:
            wav_bytes = tf.extractfile(member).read()
            durations.append(wav_duration_seconds(wav_bytes))

    total_seconds = sum(durations)
    print(f"--- sample speaker S{speaker_id} ({len(wav_members)} clips) ---")
    print(f"total audio: {total_seconds / 60:.1f} min, avg clip: {total_seconds / len(durations):.2f}s")
    print()
    print("sample clips:")
    for member, duration in list(zip(wav_members, durations))[:5]:
        utterance_id = member.name.rsplit("/", 1)[-1].removesuffix(".wav")
        print(f"  {utterance_id}  {duration:.2f}s  {transcript_by_id.get(utterance_id, '?')}")
    print()

    estimated_hours = total_seconds / len(durations) * len(utterances) / 3600
    print(f"corpus size estimate (sample avg clip length x total utterances): ~{estimated_hours:.0f}h")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--speaker",
        default="0002",
        help="4-digit speaker id to download as an audio sample (default: 0002)",
    )
    args = parser.parse_args()

    utterances = load_transcripts()
    genders = load_speaker_genders()
    print_corpus_stats(utterances, genders)
    print_sample_speaker_stats(args.speaker, utterances)


if __name__ == "__main__":
    main()
