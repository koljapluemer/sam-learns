"""Compare local screening models against accumulated human review decisions."""

import argparse
import time

from dotenv import load_dotenv

load_dotenv()

from config import load_profiles
from ollama_client import structured_chat
from screening import SCREEN_SCHEMA, _prompt
from store import candidates


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("models", nargs="+", help="Ollama models to compare")
    args = parser.parse_args()
    names = {profile.languageCode: profile.languageName for profile in load_profiles()}
    labelled = candidates(statuses=("published", "rejected"))
    if not labelled:
        raise SystemExit("No human-labelled published/rejected candidates yet")
    for model in args.models:
        correct = failures = false_accepts = false_rejects = 0
        started = time.monotonic()
        for item in labelled:
            expected = "accept" if item["status"] == "published" else "reject"
            try:
                result = structured_chat(model, _prompt(item, names[item["language_code"]]), SCREEN_SCHEMA, item["thumbnail_url"])
                predicted = result["decision"]
                if predicted == expected:
                    correct += 1
                elif expected == "reject" and predicted == "accept":
                    false_accepts += 1
                elif expected == "accept" and predicted == "reject":
                    false_rejects += 1
            except Exception:
                failures += 1
        elapsed = time.monotonic() - started
        print(
            f"{model}: {correct}/{len(labelled)} exact, {false_accepts} false accepts, "
            f"{false_rejects} false rejects, {failures} failures, {elapsed:.1f}s"
        )


if __name__ == "__main__":
    main()
