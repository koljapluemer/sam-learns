"""Shared download/parsing helpers for the AISHELL-1 dataset, used by the
tonepractice exploration scripts. See explore_aishell.py for why we pull
files directly from the HF Hub repo instead of `datasets.load_dataset(...)`.
"""

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
