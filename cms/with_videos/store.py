"""SQLite-backed ephemeral discovery and review state."""

import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Iterator

from common import STATE_DB_PATH


SCHEMA = """
CREATE TABLE IF NOT EXISTS candidates (
    youtube_id TEXT PRIMARY KEY,
    language_code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    channel_id TEXT NOT NULL,
    channel_name TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL,
    thumbnail_url TEXT NOT NULL DEFAULT '',
    transcript TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL,
    decision_reasons TEXT NOT NULL DEFAULT '[]',
    screen_result TEXT,
    error TEXT,
    embedding TEXT,
    embedding_model TEXT,
    content_hash TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS candidates_language_status
ON candidates(language_code, status, updated_at);
CREATE TABLE IF NOT EXISTS discovery_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    language_code TEXT NOT NULL,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    discovered INTEGER NOT NULL DEFAULT 0,
    queued INTEGER NOT NULL DEFAULT 0,
    rejected INTEGER NOT NULL DEFAULT 0,
    error TEXT
);
"""


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@contextmanager
def connect() -> Iterator[sqlite3.Connection]:
    STATE_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(STATE_DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.executescript(SCHEMA)
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


def upsert_candidate(candidate: dict) -> None:
    timestamp = now_iso()
    values = {
        "description": "", "thumbnail_url": "", "transcript": "",
        "status": "discovered", "decision_reasons": [], "screen_result": None,
        "error": None, "embedding": None, "embedding_model": None, "content_hash": None,
        **candidate,
    }
    with connect() as db:
        db.execute(
            """INSERT INTO candidates (
                youtube_id, language_code, title, description, channel_id, channel_name,
                duration_seconds, thumbnail_url, transcript, status, decision_reasons,
                screen_result, error, embedding, embedding_model, content_hash, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(youtube_id) DO UPDATE SET
                title=excluded.title, description=excluded.description,
                channel_id=excluded.channel_id, channel_name=excluded.channel_name,
                duration_seconds=excluded.duration_seconds, thumbnail_url=excluded.thumbnail_url,
                transcript=excluded.transcript, status=excluded.status,
                decision_reasons=excluded.decision_reasons, screen_result=excluded.screen_result,
                error=excluded.error, embedding=COALESCE(excluded.embedding, candidates.embedding),
                embedding_model=COALESCE(excluded.embedding_model, candidates.embedding_model),
                content_hash=COALESCE(excluded.content_hash, candidates.content_hash),
                updated_at=excluded.updated_at""",
            (
                values["youtube_id"], values["language_code"], values["title"], values["description"],
                values["channel_id"], values["channel_name"], values["duration_seconds"],
                values["thumbnail_url"], values["transcript"], values["status"],
                json.dumps(values["decision_reasons"]),
                json.dumps(values["screen_result"]) if values["screen_result"] is not None else None,
                values["error"], json.dumps(values["embedding"]) if values["embedding"] else None,
                values["embedding_model"], values["content_hash"], timestamp, timestamp,
            ),
        )


def candidates(language_code: str | None = None, statuses: tuple[str, ...] = ()) -> list[dict]:
    clauses, params = [], []
    if language_code:
        clauses.append("language_code = ?")
        params.append(language_code)
    if statuses:
        clauses.append(f"status IN ({','.join('?' for _ in statuses)})")
        params.extend(statuses)
    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    with connect() as db:
        rows = db.execute(f"SELECT * FROM candidates {where} ORDER BY updated_at DESC", params).fetchall()
    return [_decode(row) for row in rows]


def candidate(youtube_id: str) -> dict | None:
    with connect() as db:
        row = db.execute("SELECT * FROM candidates WHERE youtube_id = ?", (youtube_id,)).fetchone()
    return _decode(row) if row else None


def set_status(youtube_id: str, status: str, reasons: list[str] | None = None, error: str | None = None) -> None:
    with connect() as db:
        db.execute(
            "UPDATE candidates SET status=?, decision_reasons=?, error=?, updated_at=? WHERE youtube_id=?",
            (status, json.dumps(reasons or []), error, now_iso(), youtube_id),
        )


def start_discovery_run(language_code: str) -> int:
    with connect() as db:
        cursor = db.execute(
            "INSERT INTO discovery_runs (language_code, started_at) VALUES (?, ?)",
            (language_code, now_iso()),
        )
        return cursor.lastrowid


def finish_discovery_run(run_id: int, result: dict, error: str | None = None) -> None:
    with connect() as db:
        db.execute(
            """UPDATE discovery_runs SET completed_at=?, discovered=?, queued=?, rejected=?, error=? WHERE id=?""",
            (now_iso(), result.get("found", 0), result.get("queued", 0), result.get("rejected", 0), error, run_id),
        )


def _decode(row: sqlite3.Row) -> dict:
    result = dict(row)
    for key in ("decision_reasons", "screen_result", "embedding"):
        result[key] = json.loads(result[key]) if result.get(key) else ([] if key == "decision_reasons" else None)
    return result
