# world_map CMS

Curates the two config files the `world-map` frontend app fetches to know
which countries have which exercise enabled:

- `public/data/world-map/neighborhood-exercises.json` — "find in its
  neighborhood" exercise: enabled + zoom level per country.
- `public/data/world-map/world-map-exercises.json` — "find on world map"
  exercise: enabled per country (no zoom — this exercise always starts at
  the full, un-zoomed world view).

## First-time setup

Requires a sibling checkout of `learn-worldmap` (used as the source of the
geojson map data and initial zoom values):

```
uv run python world_map/scripts/import_seed_data.py
```

This copies `map.geo.json` into `public/data/world-map/` and creates both
config files with every country disabled by default. Re-running is safe —
it won't overwrite curation decisions already saved for countries that
already have a config entry.

## Curating

```
uv run streamlit run world_map/app.py
```

Two tabs, one per exercise type:

- **Find in neighborhood**: pick a country, adjust zoom, toggle it
  enabled, and flip through the 9 pan crops (0-8) to eyeball quality
  before deciding.
- **Find on world map**: pick a country and toggle it enabled — the
  preview always shows the full world view with the target highlighted,
  since this exercise has no zoom/pan crop to curate.

Changes save immediately. Requires `npm run dev` running (repo root) so
the preview iframes can load the actual exercise at
`/world-map?preview=1&country=...&highlight=1` (neighborhood tab also adds
`&zoom=...&panIndex=...`).
