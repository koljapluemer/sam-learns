# CMS

uv-managed Python tooling for curating content in the learning apps in this
repo. One Streamlit app per app-slug folder (e.g. `world_map/` for the
`world-map` app). All tools share this single uv project/venv; add new
per-app folders as siblings of `world_map/` rather than starting new uv
projects.

Setup once:

```
uv sync
```

Run an app's CMS, e.g. world-map:

```
uv run streamlit run world_map/app.py
```

Most per-app CMS tools preview content by embedding the actual frontend
app (for pixel-accurate mobile/desktop previews), so run the frontend dev
server alongside:

```
npm run dev   # from the repo root, in another terminal
```

See each app folder's own README for specifics (seed scripts, config file
locations, etc).
