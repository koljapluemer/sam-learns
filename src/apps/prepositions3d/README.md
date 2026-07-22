# Prepositions 3D

A 3D scene (WebXR or desktop) where you act out spatial prepositions with
objects - dragging a mug around a table and chair - to learn them in
context, with audio in your chosen language.

Imported from [linguanodon](https://github.com/koljapluemer/linguanodon)'s
`prepositions3d` Django app - see `docs/linguanodon-import.md` at the repo
root for how that import works and how to replicate it for other apps.

Content (`public/data/prepositions3d/{languages,glossary}.json` plus the
`models/`, `sound/`, and `audio/` static asset folders) is a one-time export
from linguanodon's sqlite3 database and static files via
`cms/prepositions3d/import_from_linguanodon.py`. Rerun that script by hand if
the upstream content changes - there's no ongoing sync.

Unlike this repo's other imports, this one keeps the original's imperative
scene-construction approach almost verbatim (`app/scene/scene.ts`'s
`buildScene()` assigns a raw HTML string of `<a-scene>`/`<a-entity>` markup
into a container ref, same as the original's `#app.innerHTML = ...`) rather
than declarative Vue template markup, since the scene includes
dynamically-generated drop zones and an entirely code-built in-world UI
panel (`app/ui/scene-ui.ts`). A-Frame is registered globally by importing
`aframe` as a side effect (`app/aframeGlobal.ts`), matching how the original
loaded it from a CDN `<script>` tag; `vite.config.ts` treats all `a-*` tags
as custom elements so Vue doesn't try to resolve them as components.

THREE/A-Frame internals throughout `app/` are typed as `any` rather than
against the `three` npm package (installed separately for `tprboard`) -
A-Frame bundles its own three.js instance on the global `AFRAME.THREE` at
runtime, and neither ships installable `.d.ts` files in the versions used
here, so there's no real type source to check field-by-field against.

No accounts/sync: the original's `queueEvent`/`queueState`/
`mergeRemoteLearningEvents`/`trackActiveTime` calls are dropped entirely.
Per-gloss completion state stays in `localStorage` exactly as the original
tracked it locally (this app has no per-item Dexie state, just a flat
completed-gloss-keys log used to bias which prompts repeat); each completed
task also logs to this repo's shared cross-app activity log via
`logActivity('prepositions3d')`.

This is a WebGL/3D app that can't be meaningfully verified without a
browser - `npm run dev` was not run as part of this import (per standing
instruction), so the drag/VR interaction logic and 3D layout numbers are
ported faithfully from the original but not visually confirmed here.
