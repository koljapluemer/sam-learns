import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).parents[1]))

from asr import collapse_repeats
from config import LanguageProfile
from download import RateLimited, pick_subtitle_track, yt_dlp
from extract_vocab import build_request_body, clean_vocab
from pipeline import invalidate
from screening import cosine, diverse_selection, metadata_reasons, transcript_reasons
from youtube import _seconds


class SubtitleTests(unittest.TestCase):
    def test_prefers_regional_manual_track(self):
        info = {"subtitles": {"es-419": {}}, "automatic_captions": {"es-orig": {}}}
        self.assertEqual(pick_subtitle_track(info, "es"), ("es-419", False))

    def test_prefers_original_auto_track(self):
        info = {"subtitles": {}, "automatic_captions": {"es": {}, "es-orig": {}}}
        self.assertEqual(pick_subtitle_track(info, "es"), ("es-orig", True))

    def test_discovery_skips_translated_track(self):
        info = {"subtitles": {"en": {}}, "automatic_captions": {"en-orig": {}, "it": {}}}
        self.assertEqual(pick_subtitle_track(info, "it"), ("it", True))
        self.assertIsNone(pick_subtitle_track(info, "it", allow_translated=False))

    def test_429_raises_rate_limited(self):
        failed = subprocess.CompletedProcess([], 1, "", "ERROR: HTTP Error 429: Too Many Requests")
        with patch("download.subprocess.run", return_value=failed), patch("download.sys.stderr"):
            with self.assertRaises(RateLimited):
                yt_dlp(["url"])


class ScreeningTests(unittest.TestCase):
    def candidate(self, **updates):
        return {
            "duration_seconds": 60, "captioned": True, "embeddable": True,
            "made_for_kids": False, "age_restricted": False, "live": False,
            **updates,
        }

    def test_metadata_rejections(self):
        reasons = metadata_reasons(self.candidate(made_for_kids=True), 20, 180)
        self.assertIn("made for children", reasons)

    def test_metadata_ignores_missing_transcript(self):
        self.assertEqual(metadata_reasons(self.candidate(), 20, 180), [])

    def test_transcript_rejections(self):
        self.assertEqual(transcript_reasons("ciao " * 20), ["highly repetitive transcript"])
        self.assertEqual(transcript_reasons(" ".join(f"word{index}" for index in range(13))), [])

    def test_mmr_removes_near_duplicate(self):
        items = [
            {"id": "a", "embedding": [1.0, 0.0]},
            {"id": "b", "embedding": [0.999, 0.001]},
            {"id": "c", "embedding": [0.0, 1.0]},
        ]
        self.assertEqual([item["id"] for item in diverse_selection(items, 3)], ["a", "c"])
        self.assertAlmostEqual(cosine([1, 0], [0, 1]), 0)


class VocabularyTests(unittest.TestCase):
    def test_filters_non_verbatim_duplicates_and_identical_translation(self):
        items = [
            {"term": "buongiorno", "translation": "good morning", "core": True},
            {"term": "Buongiorno", "translation": "hello", "core": False},
            {"term": "missing", "translation": "absent", "core": True},
            {"term": "pizza", "translation": "pizza", "core": True},
        ]
        result = clean_vocab("Buongiorno, pizza!", items)
        self.assertEqual(result, [{"term": "buongiorno", "translation": "good morning", "core": True}])

    def test_request_uses_strict_structured_output(self):
        body = build_request_body([{"id": "1", "current": "ciao"}], "Italian")
        self.assertTrue(body["text"]["format"]["strict"])
        self.assertEqual(body["text"]["format"]["type"], "json_schema")


class AsrTests(unittest.TestCase):
    def test_collapses_decoder_loops(self):
        looped = "e non " + "mon konn ni " * 20 + "mon ko"
        self.assertEqual(collapse_repeats(looped), "e non mon konn ni mon ko")

    def test_keeps_short_natural_repetition(self):
        self.assertEqual(collapse_repeats("oui oui oui korek"), "oui oui oui korek")


class UtilityTests(unittest.TestCase):
    def test_youtube_duration(self):
        self.assertEqual(_seconds("PT2M3S"), 123)

    def test_invalidation_respects_dependencies(self):
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            for name in ("audio.m4a", "silences.json", "snippets.json", "vocab.json", "vocab-cache.json"):
                (directory / name).write_text("x")
            with patch("pipeline.video_dir", return_value=directory):
                invalidate("video", "snippets")
            self.assertTrue((directory / "audio.m4a").exists())
            self.assertFalse((directory / "snippets.json").exists())
            self.assertFalse((directory / "vocab.json").exists())


class ConfigTests(unittest.TestCase):
    def test_profile_validation(self):
        profile = LanguageProfile("spa", "es", "Spanish", ["ES"], ["comida"], [], 20, 180, 30)
        profile.validate()
        with self.assertRaises(ValueError):
            LanguageProfile("es", "es", "Spanish", [], ["comida"], []).validate()


if __name__ == "__main__":
    unittest.main()
