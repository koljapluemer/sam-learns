# /// script
# requires-python = ">=3.10,<3.13"
# dependencies = [
#     "omnilingual-asr==0.2.0",
#     "fairseq2==0.6",
#     "torch==2.8.0",
#     "torchaudio==2.8.0",
#     "pyarrow>=20,<23",  # newer pyarrow needs NumPy 2, fairseq2 pins NumPy 1
# ]
#
# [tool.uv]
# index-strategy = "unsafe-best-match"
#
# [[tool.uv.index]]
# name = "pytorch-cu128"
# url = "https://download.pytorch.org/whl/cu128"
# explicit = true
#
# [[tool.uv.index]]
# name = "fairseq2-pt280-cu128"
# url = "https://fair.pkg.atmeta.com/fairseq2/whl/pt2.8.0/cu128"
# explicit = true
#
# [tool.uv.sources]
# torch = { index = "pytorch-cu128" }
# torchaudio = { index = "pytorch-cu128" }
# fairseq2 = { index = "fairseq2-pt280-cu128" }
# fairseq2n = { index = "fairseq2-pt280-cu128" }
# ///
"""Transcribe short audio clips (< 40s) with Meta's Omnilingual ASR.

Runs in its own environment: fairseq2 needs Python <= 3.12 and the exact torch build it was compiled against.
Run via: uv run --script with_videos/omni_asr.py <lang, e.g. mfe_Latn> <out.json> <clip.wav> [<clip.wav> ...]
Output: out.json, a list of transcripts in clip order.
"""

import json
import sys
from pathlib import Path

from omnilingual_asr.models.inference.pipeline import ASRInferencePipeline

MODEL = "omniASR_LLM_1B_v2"


def main() -> None:
    lang, out_path, *clips = sys.argv[1:]
    pipeline = ASRInferencePipeline(model_card=MODEL)
    texts = pipeline.transcribe(clips, lang=[lang] * len(clips), batch_size=1)
    Path(out_path).write_text(json.dumps(texts, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    main()
