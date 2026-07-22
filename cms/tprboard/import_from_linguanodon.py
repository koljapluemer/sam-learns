"""One-time import of tprboard content from the linguanodon Django app.

Run via: uv run python tprboard/import_from_linguanodon.py

linguanodon curates this content via Django admin; this script just dumps
its sqlite3 tables (plus the 3D models/audio/explain image referenced by
them) to the files this repo's frontend fetches at runtime. Rerun by hand if
the upstream content changes - there is no sync, and no local curation UI
for this app.

Reads (stdlib sqlite3, no Django needed - it's just a sqlite file):
  ../linguanodon/tprboard.sqlite3 -> tables tprboard_locale, tprboard_boardobject,
    tprboard_objectrelationship, tprboard_sentenceformulation
  ../linguanodon/tprboard/static/tprboard/models/**  -> GLTF models + textures
  ../linguanodon/tprboard/static/tprboard/audio/<locale>/*.mp3 -> task audio
  ../linguanodon/tprboard/static/tprboard/img/explain.webp -> board explainer image

Writes:
  public/data/tprboard/languages.json      { code: displayName }
  public/data/tprboard/objects.json        [{ name, record: { model, hold?, relationships? } }]
  public/data/tprboard/tasks/<code>.json   { task_key: [formulation text, ...] }
  public/data/tprboard/models/**           copied verbatim (.glb + colormap.png)
  public/data/tprboard/audio/<code>/*.mp3  copied verbatim
  public/data/tprboard/img/explain.webp    copied verbatim

Mirrors linguanodon's tprboard/views.py api_languages/api_objects/api_locale_tasks
JSON shapes exactly, so the ported frontend data.ts fetch helpers stay a
near-verbatim port of the original app/data.js.
"""

import argparse
import json
import shutil
import sqlite3
from collections import defaultdict
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
LINGUANODON_ROOT = REPO_ROOT.parent / "linguanodon"
DEFAULT_SQLITE_PATH = LINGUANODON_ROOT / "tprboard.sqlite3"
DEFAULT_STATIC_DIR = LINGUANODON_ROOT / "tprboard" / "static" / "tprboard"
OUTPUT_DIR = REPO_ROOT / "public" / "data" / "tprboard"


def export_languages(connection: sqlite3.Connection) -> None:
    rows = connection.execute("SELECT code, name FROM tprboard_locale ORDER BY name").fetchall()
    languages = {row["code"]: row["name"] for row in rows}
    (OUTPUT_DIR / "languages.json").write_text(json.dumps(languages, indent=2, ensure_ascii=False))
    print(f"Wrote {len(languages)} languages to public/data/tprboard/languages.json")


def export_objects(connection: sqlite3.Connection) -> None:
    objects = connection.execute("SELECT slug, model_path, hold_anchor_x, hold_anchor_y, hold_anchor_z, hold_scale FROM tprboard_boardobject ORDER BY \"order\"").fetchall()
    relationships_by_source = defaultdict(dict)
    for rel in connection.execute(
        "SELECT source_id, target_id, verb, source_effect, target_effect FROM tprboard_objectrelationship"
    ).fetchall():
        relationships_by_source[rel["source_id"]][rel["target_id"]] = [
            rel["verb"],
            rel["source_effect"],
            rel["target_effect"],
        ]

    payload = []
    for obj in objects:
        record = {"model": obj["model_path"]}

        if obj["hold_scale"] is not None:
            record["hold"] = {
                "anchor": [obj["hold_anchor_x"], obj["hold_anchor_y"], obj["hold_anchor_z"]],
                "scale": obj["hold_scale"],
            }

        relationships = relationships_by_source.get(obj["slug"])
        if relationships:
            record["relationships"] = relationships

        payload.append({"name": obj["slug"], "record": record})

    (OUTPUT_DIR / "objects.json").write_text(json.dumps(payload, indent=2, ensure_ascii=False))
    print(f"Wrote {len(payload)} board objects to public/data/tprboard/objects.json")


def export_tasks(connection: sqlite3.Connection) -> None:
    locales = [row["code"] for row in connection.execute("SELECT code FROM tprboard_locale").fetchall()]
    tasks_dir = OUTPUT_DIR / "tasks"
    tasks_dir.mkdir(parents=True, exist_ok=True)

    for locale in locales:
        formulations = connection.execute(
            """
            SELECT r.task_key AS task_key, f."order" AS ord, f.text AS text
            FROM tprboard_sentenceformulation f
            JOIN tprboard_objectrelationship r ON r.id = f.relationship_id
            WHERE f.locale_id = ?
            ORDER BY r.task_key, f."order"
            """,
            (locale,),
        ).fetchall()

        task_map = defaultdict(list)
        for row in formulations:
            task_map[row["task_key"]].append(row["text"])

        (tasks_dir / f"{locale}.json").write_text(json.dumps(task_map, indent=2, ensure_ascii=False))
        print(f"Wrote {len(task_map)} tasks for '{locale}' to public/data/tprboard/tasks/{locale}.json")


def copy_assets(static_dir: Path) -> None:
    models_dest = OUTPUT_DIR / "models"
    if models_dest.exists():
        shutil.rmtree(models_dest)
    shutil.copytree(static_dir / "models", models_dest)
    print(f"Copied models to public/data/tprboard/models/")

    audio_dest = OUTPUT_DIR / "audio"
    if audio_dest.exists():
        shutil.rmtree(audio_dest)
    shutil.copytree(static_dir / "audio", audio_dest)
    print(f"Copied audio to public/data/tprboard/audio/")

    img_dest = OUTPUT_DIR / "img"
    img_dest.mkdir(parents=True, exist_ok=True)
    shutil.copy2(static_dir / "img" / "explain.webp", img_dest / "explain.webp")
    print(f"Copied explain.webp to public/data/tprboard/img/")


def export_all(sqlite_path: Path, static_dir: Path) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(sqlite_path)
    connection.row_factory = sqlite3.Row
    try:
        export_languages(connection)
        export_objects(connection)
        export_tasks(connection)
    finally:
        connection.close()
    copy_assets(static_dir)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sqlite-path", type=Path, default=DEFAULT_SQLITE_PATH)
    parser.add_argument("--static-dir", type=Path, default=DEFAULT_STATIC_DIR)
    args = parser.parse_args()
    export_all(args.sqlite_path, args.static_dir)
