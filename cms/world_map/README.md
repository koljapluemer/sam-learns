# world_map CMS

Curates `public/data/world-map/neighborhood-exercises.json`, the config the
`world-map` frontend app fetches to know which countries have the
"find in its neighborhood" exercise enabled, and at what zoom level.

## First-time setup

Requires a sibling checkout of `learn-worldmap` (used as the source of the
geojson map data and initial zoom values):

```
uv run python world_map/scripts/import_seed_data.py
```

This copies `map.geo.json` into `public/data/world-map/` and creates
`neighborhood-exercises.json` with every country disabled by default.
Re-running is safe — it won't overwrite curation decisions already saved
for countries that already have a config entry.

## Curating

```
uv run streamlit run world_map/app.py
```

Pick a country, adjust zoom, toggle it enabled, and flip through the 9 pan
crops (0-8) to eyeball quality before deciding. Changes save immediately.
Requires `npm run dev` running (repo root) so the preview iframes can load
the actual exercise at `/world-map?preview=1&country=...&zoom=...&panIndex=...`.
