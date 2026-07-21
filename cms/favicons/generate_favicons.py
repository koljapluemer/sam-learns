"""Generate per-app favicons from each app's meta/logo.webp.

Run via: uv run python favicons/generate_favicons.py

Reads src/apps/<slug>/meta/logo.webp for every app and writes a multi-size
.ico favicon to public/favicons/<slug>.ico. The frontend swaps the page's
favicon to match the current app route (see src/router.ts), falling back to
the default favicon on non-app routes.

Idempotent - safe to re-run any time a logo.webp changes.
"""

from pathlib import Path

from PIL import Image

REPO_ROOT = Path(__file__).resolve().parents[2]
APPS_DIR = REPO_ROOT / "src" / "apps"
OUTPUT_DIR = REPO_ROOT / "public" / "favicons"
ICO_SIZES = [(16, 16), (32, 32), (48, 48)]


def generate_favicons() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for logo_path in sorted(APPS_DIR.glob("*/meta/logo.webp")):
        slug = logo_path.parent.parent.name
        output_path = OUTPUT_DIR / f"{slug}.ico"

        with Image.open(logo_path) as logo:
            logo = logo.convert("RGBA")
            logo.save(output_path, format="ICO", sizes=ICO_SIZES)

        print(f"{slug}: {logo_path.relative_to(REPO_ROOT)} -> {output_path.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    generate_favicons()
