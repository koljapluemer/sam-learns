"""Curation UI for the world-map exercises.

Run via: uv run streamlit run world_map/app.py
Requires the frontend dev server running alongside (npm run dev, default
http://localhost:5173) since previews are rendered inside an iframe via the
frontend's CMS preview view (?preview=1), a thin wrapper around the same
map renderer the learner app uses. The wrapper adds a target-country
highlight for curation purposes only — it does not affect the exercise
learners see.

Four tabs, one per exercise type:
- "Find in neighborhood": curate enabled/zoom/pan-crop per country.
- "Find on world map": curate enabled per country (no zoom/pan — the
  exercise always starts at the full, un-zoomed world view).
- "Identify country": curate enabled per country for the "which country
  is this" multiple-choice exercise (full world view, target circled).
- "Distractor choice": curate enabled/zoom/pan-crop plus a curated list of
  plausible distractor countries per country for the zoomed "which country
  is this" exercise.

Controls live inside each tab's content area (not `st.sidebar`, which is
global and would otherwise mix both tabs' widgets together).
"""

import random
from urllib.parse import urlencode

import streamlit as st
import streamlit.components.v1 as components

from data_io import (
    DistractorChoiceConfig,
    IdentifyCountryConfig,
    NeighborhoodConfig,
    WorldMapConfig,
    load_distractor_choice_config,
    load_identify_country_config,
    load_neighborhood_config,
    load_world_map_config,
    save_distractor_choice_config,
    save_identify_country_config,
    save_neighborhood_config,
    save_world_map_config,
)

st.set_page_config(page_title="World Map CMS", layout="wide")


def widget_key(prefix: str, name: str, country: str) -> str:
    """Scope a per-country, per-tab widget's session-state key.

    Streamlit only applies a widget's `value=` kwarg the first time its key
    is created; on every later rerun it shows whatever is already in
    `st.session_state` for that key instead. Without per-country keys, the
    zoom/enabled/pan-index widgets would keep showing the previously edited
    country's values after switching countries. The tab prefix keeps the
    two tabs' widgets from colliding on shared field names like "enabled".
    """
    return f"{prefix}__{name}__{country}"


def render_preview(dev_server_url: str, preview_query: dict[str, int | str]) -> None:
    preview_url = f"{dev_server_url}/world-map?{urlencode(preview_query)}"
    mobile_col, desktop_col = st.columns([1, 2])
    with mobile_col:
        st.subheader("Mobile (375px)")
        components.iframe(preview_url, width=375, height=700, scrolling=False)
    with desktop_col:
        st.subheader("Desktop (1200px)")
        components.iframe(preview_url, width=1200, height=700, scrolling=False)


def render_neighborhood_tab(dev_server_url: str) -> None:
    config = load_neighborhood_config()
    countries = sorted(config.keys())

    if not countries:
        st.warning("No countries in the config yet. Run `uv run python world_map/scripts/import_seed_data.py` first.")
        return

    if "n_current_country" not in st.session_state:
        st.session_state.n_current_country = countries[0]
    if "n_nav_generation" not in st.session_state:
        st.session_state.n_nav_generation = 0
    if st.session_state.n_current_country not in countries:
        st.session_state.n_current_country = countries[0]

    def save_entry(country: str, zoom: int, enabled: bool, reviewed: bool) -> None:
        config[country] = {"enabled": enabled, "zoom": int(zoom), "reviewed": reviewed}
        save_neighborhood_config(config)

    controls_col, preview_col = st.columns([1, 3])

    with controls_col:
        st.subheader("Country")
        country = st.selectbox(
            "Country",
            countries,
            index=countries.index(st.session_state.n_current_country),
            key=f"n_country_picker_{st.session_state.n_nav_generation}",
        )
        st.session_state.n_current_country = country
        entry: NeighborhoodConfig = config[country]

        zoom = st.number_input(
            "Zoom", min_value=100, max_value=200, value=entry["zoom"], step=1, key=widget_key("n", "zoom", country)
        )
        enabled = st.checkbox("Enabled", value=entry["enabled"], key=widget_key("n", "enabled", country))
        pan_index = st.select_slider(
            "Pan index (which of the 9 crops to preview)",
            options=list(range(9)),
            value=4,
            key=widget_key("n", "pan_index", country),
        )
        highlight_target = st.checkbox("Highlight target country", value=True, key="n_highlight_target")

        if zoom != entry["zoom"] or enabled != entry["enabled"]:
            # toggling enabled is itself a decision; editing zoom alone doesn't change review status
            reviewed = entry["reviewed"] or enabled != entry["enabled"]
            save_entry(country, zoom, enabled, reviewed)
            st.success("Saved")

        def decide_and_advance(enabled_value: bool) -> None:
            save_entry(country, zoom, enabled_value, reviewed=True)
            pool = [c for c in countries if c != country and not config[c]["reviewed"]]
            if pool:
                st.session_state.n_current_country = random.choice(pool)
                st.session_state.n_nav_generation += 1
                st.rerun()
            else:
                st.info("No countries left to review.")

        st.divider()
        undecided = [c for c in countries if c != country and not config[c]["reviewed"]]
        st.caption(f"{len(undecided)} countries left to review")
        enable_col, disable_col = st.columns(2)
        if enable_col.button("Enable and load random next", use_container_width=True, key="n_enable_next"):
            decide_and_advance(True)
        if disable_col.button("Disable and load random next", use_container_width=True, key="n_disable_next"):
            decide_and_advance(False)

    with preview_col:
        st.title(f"{country} — neighborhood exercise preview")
        st.caption(f"pan index {pan_index} of 0-8, zoom {zoom}")
        render_preview(
            dev_server_url,
            {"preview": 1, "country": country, "zoom": zoom, "panIndex": pan_index, "highlight": 1 if highlight_target else 0},
        )
        st.divider()
        enabled_count = sum(1 for c in config.values() if c["enabled"])
        reviewed_count = sum(1 for c in config.values() if c["reviewed"])
        st.caption(f"{enabled_count} of {len(config)} countries enabled · {reviewed_count} of {len(config)} reviewed")


def render_world_map_tab(dev_server_url: str) -> None:
    config = load_world_map_config()
    countries = sorted(config.keys())

    if not countries:
        st.warning("No countries in the config yet. Run `uv run python world_map/scripts/import_seed_data.py` first.")
        return

    if "wm_current_country" not in st.session_state:
        st.session_state.wm_current_country = countries[0]
    if "wm_nav_generation" not in st.session_state:
        st.session_state.wm_nav_generation = 0
    if st.session_state.wm_current_country not in countries:
        st.session_state.wm_current_country = countries[0]

    def save_entry(country: str, enabled: bool, reviewed: bool) -> None:
        config[country] = {"enabled": enabled, "reviewed": reviewed}
        save_world_map_config(config)

    controls_col, preview_col = st.columns([1, 3])

    with controls_col:
        st.subheader("Country")
        country = st.selectbox(
            "Country",
            countries,
            index=countries.index(st.session_state.wm_current_country),
            key=f"wm_country_picker_{st.session_state.wm_nav_generation}",
        )
        st.session_state.wm_current_country = country
        entry: WorldMapConfig = config[country]

        enabled = st.checkbox("Enabled", value=entry["enabled"], key=widget_key("wm", "enabled", country))
        highlight_target = st.checkbox("Highlight target country", value=True, key="wm_highlight_target")

        if enabled != entry["enabled"]:
            save_entry(country, enabled, reviewed=True)
            st.success("Saved")

        def decide_and_advance(enabled_value: bool) -> None:
            save_entry(country, enabled_value, reviewed=True)
            pool = [c for c in countries if c != country and not config[c]["reviewed"]]
            if pool:
                st.session_state.wm_current_country = random.choice(pool)
                st.session_state.wm_nav_generation += 1
                st.rerun()
            else:
                st.info("No countries left to review.")

        st.divider()
        undecided = [c for c in countries if c != country and not config[c]["reviewed"]]
        st.caption(f"{len(undecided)} countries left to review")
        enable_col, disable_col = st.columns(2)
        if enable_col.button("Enable and load random next", use_container_width=True, key="wm_enable_next"):
            decide_and_advance(True)
        if disable_col.button("Disable and load random next", use_container_width=True, key="wm_disable_next"):
            decide_and_advance(False)

    with preview_col:
        st.title(f"{country} — world map exercise preview")
        st.caption("full, un-zoomed world view")
        render_preview(dev_server_url, {"preview": 1, "country": country, "highlight": 1 if highlight_target else 0})
        st.divider()
        enabled_count = sum(1 for c in config.values() if c["enabled"])
        reviewed_count = sum(1 for c in config.values() if c["reviewed"])
        st.caption(f"{enabled_count} of {len(config)} countries enabled · {reviewed_count} of {len(config)} reviewed")


def render_identify_country_tab(dev_server_url: str) -> None:
    config = load_identify_country_config()
    countries = sorted(config.keys())

    if not countries:
        st.warning("No countries in the config yet. Run `uv run python world_map/scripts/import_seed_data.py` first.")
        return

    if "ic_current_country" not in st.session_state:
        st.session_state.ic_current_country = countries[0]
    if "ic_nav_generation" not in st.session_state:
        st.session_state.ic_nav_generation = 0
    if st.session_state.ic_current_country not in countries:
        st.session_state.ic_current_country = countries[0]

    def save_entry(country: str, enabled: bool, reviewed: bool) -> None:
        config[country] = {"enabled": enabled, "reviewed": reviewed}
        save_identify_country_config(config)

    controls_col, preview_col = st.columns([1, 3])

    with controls_col:
        st.subheader("Country")
        country = st.selectbox(
            "Country",
            countries,
            index=countries.index(st.session_state.ic_current_country),
            key=f"ic_country_picker_{st.session_state.ic_nav_generation}",
        )
        st.session_state.ic_current_country = country
        entry: IdentifyCountryConfig = config[country]

        enabled = st.checkbox("Enabled", value=entry["enabled"], key=widget_key("ic", "enabled", country))
        highlight_target = st.checkbox("Highlight + circle target country", value=True, key="ic_highlight_target")

        if enabled != entry["enabled"]:
            save_entry(country, enabled, reviewed=True)
            st.success("Saved")

        def decide_and_advance(enabled_value: bool) -> None:
            save_entry(country, enabled_value, reviewed=True)
            pool = [c for c in countries if c != country and not config[c]["reviewed"]]
            if pool:
                st.session_state.ic_current_country = random.choice(pool)
                st.session_state.ic_nav_generation += 1
                st.rerun()
            else:
                st.info("No countries left to review.")

        st.divider()
        undecided = [c for c in countries if c != country and not config[c]["reviewed"]]
        st.caption(f"{len(undecided)} countries left to review")
        enable_col, disable_col = st.columns(2)
        if enable_col.button("Enable and load random next", use_container_width=True, key="ic_enable_next"):
            decide_and_advance(True)
        if disable_col.button("Disable and load random next", use_container_width=True, key="ic_disable_next"):
            decide_and_advance(False)

    with preview_col:
        st.title(f"{country} — identify country exercise preview")
        st.caption("full, un-zoomed world view; learner picks the country name from two options")
        render_preview(
            dev_server_url,
            {
                "preview": 1,
                "country": country,
                "highlight": 1 if highlight_target else 0,
                "marker": 1 if highlight_target else 0,
            },
        )
        st.divider()
        enabled_count = sum(1 for c in config.values() if c["enabled"])
        reviewed_count = sum(1 for c in config.values() if c["reviewed"])
        st.caption(f"{enabled_count} of {len(config)} countries enabled · {reviewed_count} of {len(config)} reviewed")


def render_distractor_choice_tab(dev_server_url: str) -> None:
    config = load_distractor_choice_config()
    countries = sorted(config.keys())

    if not countries:
        st.warning(
            "No countries in the config yet. Run "
            "`uv run python world_map/scripts/import_distractor_seed_data.py` first."
        )
        return

    if "dc_current_country" not in st.session_state:
        st.session_state.dc_current_country = countries[0]
    if "dc_nav_generation" not in st.session_state:
        st.session_state.dc_nav_generation = 0
    if st.session_state.dc_current_country not in countries:
        st.session_state.dc_current_country = countries[0]

    def save_entry(country: str, zoom: int, enabled: bool, distractors: list[str], reviewed: bool) -> None:
        config[country] = {"enabled": enabled, "zoom": int(zoom), "distractors": distractors, "reviewed": reviewed}
        save_distractor_choice_config(config)

    controls_col, preview_col = st.columns([1, 3])

    with controls_col:
        st.subheader("Country")
        country = st.selectbox(
            "Country",
            countries,
            index=countries.index(st.session_state.dc_current_country),
            key=f"dc_country_picker_{st.session_state.dc_nav_generation}",
        )
        st.session_state.dc_current_country = country
        entry: DistractorChoiceConfig = config[country]

        zoom = st.number_input(
            "Zoom", min_value=100, max_value=200, value=entry["zoom"], step=1, key=widget_key("dc", "zoom", country)
        )
        enabled = st.checkbox("Enabled", value=entry["enabled"], key=widget_key("dc", "enabled", country))
        pan_index = st.select_slider(
            "Pan index (which of the 9 crops to preview)",
            options=list(range(9)),
            value=4,
            key=widget_key("dc", "pan_index", country),
        )
        highlight_target = st.checkbox("Highlight target + distractors", value=True, key="dc_highlight_target")

        st.subheader("Distractors")
        distractors_key = widget_key("dc", "distractors", country)
        if distractors_key not in st.session_state:
            st.session_state[distractors_key] = list(entry["distractors"])
        current_distractors: list[str] = st.session_state[distractors_key]

        for distractor in list(current_distractors):
            name_col, remove_col = st.columns([4, 1])
            name_col.write(distractor)
            if remove_col.button("Remove", key=f"dc_remove_{country}_{distractor}"):
                current_distractors.remove(distractor)
                save_entry(country, zoom, enabled, current_distractors, reviewed=True)
                st.rerun()

        add_picker_key = f"dc_add_picker_{country}_{st.session_state.dc_nav_generation}"
        add_options = [c for c in countries if c != country and c not in current_distractors]
        new_distractor = st.selectbox("Add distractor", [""] + add_options, key=add_picker_key)
        if st.button("Add", key=f"dc_add_btn_{country}") and new_distractor:
            current_distractors.append(new_distractor)
            save_entry(country, zoom, enabled, current_distractors, reviewed=True)
            # the just-added country drops out of add_options next render, which
            # would leave this widget's stored value pointing at a now-invalid
            # option; clear it so it remounts at the default "" instead of crashing
            del st.session_state[add_picker_key]
            st.rerun()

        if zoom != entry["zoom"] or enabled != entry["enabled"]:
            reviewed = entry["reviewed"] or enabled != entry["enabled"]
            save_entry(country, zoom, enabled, current_distractors, reviewed)
            st.success("Saved")

        def decide_and_advance(enabled_value: bool) -> None:
            save_entry(country, zoom, enabled_value, current_distractors, reviewed=True)
            pool = [c for c in countries if c != country and not config[c]["reviewed"]]
            if pool:
                st.session_state.dc_current_country = random.choice(pool)
                st.session_state.dc_nav_generation += 1
                st.rerun()
            else:
                st.info("No countries left to review.")

        st.divider()
        undecided = [c for c in countries if c != country and not config[c]["reviewed"]]
        st.caption(f"{len(undecided)} countries left to review")
        enable_col, disable_col = st.columns(2)
        if enable_col.button("Enable and load random next", use_container_width=True, key="dc_enable_next"):
            decide_and_advance(True)
        if disable_col.button("Disable and load random next", use_container_width=True, key="dc_disable_next"):
            decide_and_advance(False)

    with preview_col:
        st.title(f"{country} — distractor choice exercise preview")
        st.caption(f"pan index {pan_index} of 0-8, zoom {zoom} · target amber, distractors purple")
        render_preview(
            dev_server_url,
            {
                "preview": 1,
                "country": country,
                "zoom": zoom,
                "panIndex": pan_index,
                "highlight": 1 if highlight_target else 0,
                "distractors": ",".join(current_distractors),
            },
        )
        st.divider()
        enabled_count = sum(1 for c in config.values() if c["enabled"])
        reviewed_count = sum(1 for c in config.values() if c["reviewed"])
        st.caption(f"{enabled_count} of {len(config)} countries enabled · {reviewed_count} of {len(config)} reviewed")


DEV_SERVER_URL = st.sidebar.text_input("Frontend dev server URL", value="http://localhost:5173")

neighborhood_tab, world_map_tab, identify_country_tab, distractor_choice_tab = st.tabs(
    ["Find in neighborhood", "Find on world map", "Identify country", "Distractor choice"]
)
with neighborhood_tab:
    render_neighborhood_tab(DEV_SERVER_URL)
with world_map_tab:
    render_world_map_tab(DEV_SERVER_URL)
with identify_country_tab:
    render_identify_country_tab(DEV_SERVER_URL)
with distractor_choice_tab:
    render_distractor_choice_tab(DEV_SERVER_URL)
