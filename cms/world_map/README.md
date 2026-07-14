# world_map CMS

Curates the four config files the `world-map` frontend app fetches to know
which countries have which exercise enabled:

- `public/data/world-map/neighborhood-exercises.json` — "find in its
  neighborhood" exercise: enabled + zoom level per country.
- `public/data/world-map/world-map-exercises.json` — "find on world map"
  exercise: enabled per country (no zoom — this exercise always starts at
  the full, un-zoomed world view).
- `public/data/world-map/identify-country-exercises.json` — "which country
  is this" exercise: enabled per country (no zoom — full world view with
  the target circled; the learner picks the name from two options).
- `public/data/world-map/distractor-choice-exercises.json` — zoomed "which
  country is this" exercise: enabled + zoom level + a curated list of
  plausible distractor countries per country (the learner picks the name
  from two options, but the wrong option always comes from that country's
  own curated list rather than a random country anywhere in the world).

## First-time setup

Requires a sibling checkout of `learn-worldmap` (used as the source of the
geojson map data and initial zoom values):

```
uv run python world_map/scripts/import_seed_data.py
```

This copies `map.geo.json` into `public/data/world-map/` and creates the
first three config files with every country disabled by default. Re-running
is safe — it won't overwrite curation decisions already saved for countries
that already have a config entry.

The fourth config file (`distractor-choice-exercises.json`) is seeded
separately from `world_map/countryInfo.txt` (a geonames.org country-info
dump — tooling input only, not shipped to the frontend):

```
uv run python world_map/scripts/import_distractor_seed_data.py
```

This derives each country's initial distractor list from its land
neighbours and a default zoom level from its land area (smaller countries
get a tighter default zoom). Also idempotent — safe to re-run without
clobbering existing curation.

## Curating

```
uv run streamlit run world_map/app.py
```

Four tabs, one per exercise type:

- **Find in neighborhood**: pick a country, adjust zoom, toggle it
  enabled, and flip through the 9 pan crops (0-8) to eyeball quality
  before deciding.
- **Find on world map**: pick a country and toggle it enabled — the
  preview always shows the full world view with the target highlighted,
  since this exercise has no zoom/pan crop to curate.
- **Identify country**: pick a country and toggle it enabled — the
  preview shows the full world view with the target highlighted and
  circled, matching what the "which country is this" multiple-choice
  exercise shows learners.
- **Distractor choice**: pick a country, adjust zoom, flip through the 9
  pan crops, toggle it enabled, and manage its distractor list (remove
  existing entries, add new ones via the searchable country dropdown). The
  preview highlights the target country in amber and every curated
  distractor in purple so you can eyeball whether the list is actually
  plausible/nearby.

Changes save immediately. Requires `npm run dev` running (repo root) so
the preview iframes can load the actual exercise at
`/world-map?preview=1&country=...&highlight=1` (neighborhood and
distractor-choice tabs also add `&zoom=...&panIndex=...`; identify-country
also adds `&marker=1`; distractor-choice also adds `&distractors=A,B,C` — no
circle marker, just the fill highlight).
