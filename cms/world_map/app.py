"""Curation UI for the "find country in its neighborhood" exercise.

Run via: uv run streamlit run world_map/app.py
Requires the frontend dev server running alongside (npm run dev, default
http://localhost:5173) since previews are rendered inside an iframe via the
frontend's CMS preview view (?preview=1), a thin wrapper around the same
map renderer the learner app uses. The wrapper adds a target-country
highlight for curation purposes only — it does not affect the exercise
learners see.
"""

import random
from urllib.parse import urlencode

import streamlit as st
import streamlit.components.v1 as components

from data_io import CountryConfig, load_config, save_config

st.set_page_config(page_title="World Map CMS", layout="wide")


def widget_key(name: str, country: str) -> str:
    """Scope a per-country widget's session-state key to that country.

    Streamlit only applies a widget's `value=` kwarg the first time its key
    is created; on every later rerun it shows whatever is already in
    `st.session_state` for that key instead. Without per-country keys, the
    zoom/enabled/pan-index widgets would keep showing the previously edited
    country's values after switching countries.
    """
    return f"{name}__{country}"


def save_entry(config: dict[str, CountryConfig], country: str, zoom: int, enabled: bool, reviewed: bool) -> None:
    config[country] = {"enabled": enabled, "zoom": int(zoom), "reviewed": reviewed}
    save_config(config)


DEV_SERVER_URL = st.sidebar.text_input("Frontend dev server URL", value="http://localhost:5173")

config = load_config()
countries = sorted(config.keys())

if not countries:
    st.warning("No countries in the config yet. Run `uv run python world_map/scripts/import_seed_data.py` first.")
    st.stop()

# --- state: which country is currently loaded ---------------------------
# `current_country` is the single source of truth. `nav_generation` exists
# only to force the selectbox to a new value: Streamlit widgets ignore
# `index=`/`value=` on every rerun after the first one for a given key, so
# "jumping" the selectbox (e.g. after a decide-and-advance click) requires
# giving it a *key it has never seen before* rather than mutating its
# existing key from a callback (which Streamlit only half-supports and
# which was the actual cause of the "stuck preview" bug: the selectbox was
# silently snapping back to its default between reruns).
if "current_country" not in st.session_state:
    st.session_state.current_country = countries[0]
if "nav_generation" not in st.session_state:
    st.session_state.nav_generation = 0
if st.session_state.current_country not in countries:
    st.session_state.current_country = countries[0]

st.sidebar.header("Country")
country = st.sidebar.selectbox(
    "Country",
    countries,
    index=countries.index(st.session_state.current_country),
    key=f"country_picker_{st.session_state.nav_generation}",
)
st.session_state.current_country = country
entry = config[country]

zoom = st.sidebar.number_input(
    "Zoom", min_value=100, max_value=200, value=entry["zoom"], step=1, key=widget_key("zoom", country)
)
enabled = st.sidebar.checkbox("Enabled", value=entry["enabled"], key=widget_key("enabled", country))
pan_index = st.sidebar.select_slider(
    "Pan index (which of the 9 crops to preview)",
    options=list(range(9)),
    value=4,
    key=widget_key("pan_index", country),
)
highlight_target = st.sidebar.checkbox("Highlight target country", value=True, key="highlight_target")

if zoom != entry["zoom"] or enabled != entry["enabled"]:
    # toggling enabled is itself a decision; editing zoom alone doesn't change review status
    reviewed = entry["reviewed"] or enabled != entry["enabled"]
    save_entry(config, country, zoom, enabled, reviewed)
    st.sidebar.success("Saved")


def decide_and_advance(enabled_value: bool) -> None:
    save_entry(config, country, zoom, enabled_value, reviewed=True)
    pool = [c for c in countries if c != country and not config[c]["reviewed"]]
    if pool:
        st.session_state.current_country = random.choice(pool)
        st.session_state.nav_generation += 1
        st.rerun()
    else:
        st.sidebar.info("No countries left to review.")


st.sidebar.divider()
undecided = [c for c in countries if c != country and not config[c]["reviewed"]]
st.sidebar.caption(f"{len(undecided)} countries left to review")
enable_col, disable_col = st.sidebar.columns(2)
if enable_col.button("Enable and load random next", use_container_width=True):
    decide_and_advance(True)
if disable_col.button("Disable and load random next", use_container_width=True):
    decide_and_advance(False)

st.title(f"{country} — neighborhood exercise preview")
st.caption(f"pan index {pan_index} of 0-8, zoom {zoom}")

preview_query = urlencode(
    {
        "preview": 1,
        "country": country,
        "zoom": zoom,
        "panIndex": pan_index,
        "highlight": 1 if highlight_target else 0,
    }
)
preview_url = f"{DEV_SERVER_URL}/world-map?{preview_query}"

mobile_col, desktop_col = st.columns([1, 2])

with mobile_col:
    st.subheader("Mobile (375px)")
    components.iframe(preview_url, width=375, height=700, scrolling=False)

with desktop_col:
    st.subheader("Desktop (1200px)")
    components.iframe(preview_url, width=1200, height=700, scrolling=False)

st.divider()
enabled_count = sum(1 for c in config.values() if c["enabled"])
reviewed_count = sum(1 for c in config.values() if c["reviewed"])
st.caption(f"{enabled_count} of {len(config)} countries enabled · {reviewed_count} of {len(config)} reviewed")
