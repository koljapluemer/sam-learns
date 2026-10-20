import json
from pathlib import Path

ROOT = Path(__file__).parent
WORK_DIR = ROOT / "data"
OUTPUT_DIR = ROOT.parents[1] / "public/data/with-videos"
VIDEOS_PATH = OUTPUT_DIR / "videos.json"


def video_dir(youtube_id: str) -> Path:
    path = WORK_DIR / youtube_id
    path.mkdir(parents=True, exist_ok=True)
    return path


def subtitle_path(directory: Path, lang: str) -> Path:
    return directory / f"audio.{lang}.json3"


def read_json(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_name(f"{path.name}.tmp")
    tmp_path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    tmp_path.replace(path)
