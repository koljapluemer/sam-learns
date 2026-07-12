"""Curation UI for the "find country in its neighborhood" exercise.

Run via: uv run streamlit run world_map/app.py
Requires the frontend dev server running alongside (npm run dev, default
http://localhost:5173) since previews are the actual learner app rendered
in preview mode inside an iframe.
"""

import streamlit as st
import streamlit.components.v1 as components

from data_io import load_config, save_config

st.set_page_config(page_title="World Map CMS", layout="wide")

DEV_SERVER_URL = st.sidebar.text_input("Frontend dev server URL", value="http://localhost:5173")

config = load_config()
countries = sorted(config.keys())

if not countries:
    st.warning("No countries in the config yet. Run `uv run python world_map/scripts/import_seed_data.py` first.")
    st.stop()

st.sidebar.header("Country")
country = st.sidebar.selectbox("Country", countries)
entry = config[country]

zoom = st.sidebar.number_input("Zoom", min_value=100, max_value=200, value=entry["zoom"], step=1)
enabled = st.sidebar.checkbox("Enabled", value=entry["enabled"])
pan_index = st.sidebar.select_slider("Pan index (which of the 9 crops to preview)", options=list(range(9)), value=4)

if zoom != entry["zoom"] or enabled != entry["enabled"]:
    config[country] = {"enabled": enabled, "zoom": int(zoom)}
    save_config(config)
    st.sidebar.success("Saved")

st.title(f"{country} — neighborhood exercise preview")
st.caption(f"pan index {pan_index} of 0-8, zoom {zoom}")

preview_url = f"{DEV_SERVER_URL}/world-map?preview=1&country={country}&zoom={zoom}&panIndex={pan_index}"

mobile_col, desktop_col = st.columns([1, 2])

with mobile_col:
    st.subheader("Mobile (375px)")
    components.iframe(preview_url, width=375, height=700, scrolling=False)

with desktop_col:
    st.subheader("Desktop (1200px)")
    components.iframe(preview_url, width=1200, height=700, scrolling=False)

st.divider()
enabled_count = sum(1 for c in config.values() if c["enabled"])
st.caption(f"{enabled_count} of {len(config)} countries enabled")
