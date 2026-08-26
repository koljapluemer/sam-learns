"""Curation UI for the phrases content in public/data/phrases/<iso3>.json.

Run via: uv run streamlit run phrases/app.py

Layout:
- Sidebar: pick (or add) a language.
- Main area: that language's communication goals, each an expander holding
  that goal's expressions (target-language phrase + optional note + audio
  status/generation), plus an "add goal" form.

State machine: every rerun reloads <iso3>.json fresh from disk (see
data_io.py) - there is no cached copy of the domain data in
st.session_state, only UI navigation state (selected language, per-list
widget "generation" counters used to reset input fields after an add).
This is the same pattern as world_map/app.py, and it's what keeps disk and
Streamlit state from drifting apart: every write goes straight to disk via
an explicit Save/Add/Delete button, immediately followed by st.rerun(), so
the next render always reflects exactly what's on disk.
"""

import pycountry
import streamlit as st

from audio import audio_path, generate_missing_audio, has_audio
from data_io import (
    LanguageContent,
    create_language,
    list_languages,
    load_content,
    rename_key,
    save_content,
)

st.set_page_config(page_title="Phrases CMS", layout="wide")

ADD_LANGUAGE = "+ Add language"


def language_display_name(iso3: str) -> str:
    language = pycountry.languages.get(alpha_3=iso3)
    return language.name if language else iso3.upper()


def render_language_picker() -> str | None:
    """Sidebar language picker, including the add-language flow. Returns
    the selected iso3 code, or None if the add-language form is showing
    (nothing else to render until a language exists)."""
    languages = list_languages()
    options = languages + [ADD_LANGUAGE]

    if "current_language" not in st.session_state or st.session_state.current_language not in options:
        st.session_state.current_language = languages[0] if languages else ADD_LANGUAGE

    st.sidebar.header("Language")
    selected = st.sidebar.selectbox(
        "Language",
        options,
        index=options.index(st.session_state.current_language),
        format_func=lambda iso3: f"{language_display_name(iso3)} ({iso3})" if iso3 != ADD_LANGUAGE else iso3,
        key="language_picker",
    )
    st.session_state.current_language = selected

    if selected != ADD_LANGUAGE:
        return selected

    with st.sidebar.form("add_language_form", clear_on_submit=True):
        new_iso3 = st.text_input("ISO 639-3 code (e.g. deu, jpn)")
        submitted = st.form_submit_button("Add language")
    if submitted:
        code = new_iso3.strip().lower()
        if not pycountry.languages.get(alpha_3=code):
            st.sidebar.error("Enter a valid ISO 639-3 code")
        elif code in languages:
            st.sidebar.error("Language already exists")
        else:
            create_language(code)
            st.session_state.current_language = code
            st.rerun()
    return None


@st.dialog("Delete goal?")
def confirm_delete_goal(iso3: str, content: LanguageContent, goal_text: str) -> None:
    n = len(content.get(goal_text, {}).get("expressions", {}))
    extra = f" and its {n} expression(s)" if n else ""
    st.write(f"Delete **{goal_text}**{extra}? This cannot be undone.")
    cancel_col, confirm_col = st.columns(2)
    if cancel_col.button("Cancel", use_container_width=True):
        st.rerun()
    if confirm_col.button("Delete", use_container_width=True, type="primary"):
        content.pop(goal_text, None)
        save_content(iso3, content)
        st.rerun()


@st.dialog("Delete expression?")
def confirm_delete_expression(
    iso3: str, content: LanguageContent, goal_text: str, expressions: dict, phrase: str
) -> None:
    st.write(f"Delete **{phrase}**? This cannot be undone. (Its audio file, if any, is kept - other expressions may reuse it.)")
    cancel_col, confirm_col = st.columns(2)
    if cancel_col.button("Cancel", use_container_width=True):
        st.rerun()
    if confirm_col.button("Delete", use_container_width=True, type="primary"):
        expressions.pop(phrase, None)
        content[goal_text]["expressions"] = expressions
        save_content(iso3, content)
        st.rerun()


def render_expression(
    iso3: str, content: LanguageContent, goal_text: str, expressions: dict, phrase: str, note: str
) -> None:
    scope = f"{iso3}_{goal_text}_{phrase}"

    phrase_col, note_col = st.columns(2)
    new_phrase = phrase_col.text_input("Phrase", value=phrase, key=f"phrase_{scope}")
    new_note = note_col.text_input("Note (optional)", value=note, key=f"note_{scope}")

    audio_col, save_col, delete_col = st.columns([2, 1, 1])
    with audio_col:
        if has_audio(iso3, phrase):
            st.audio(str(audio_path(iso3, phrase)))
        else:
            st.caption("No audio")
            if st.button("Generate audio", key=f"gen_audio_{scope}"):
                try:
                    with st.spinner("Generating audio..."):
                        generate_missing_audio(iso3, phrase)
                    st.rerun()
                except Exception as exc:
                    st.error(str(exc))
    if save_col.button("Save", key=f"save_expr_{scope}", use_container_width=True):
        stripped_phrase = new_phrase.strip()
        stripped_note = new_note.strip()
        if not stripped_phrase:
            st.error("Phrase text is required")
        elif stripped_phrase != phrase and stripped_phrase in expressions:
            st.error("This phrase already exists for this goal")
        else:
            updated = rename_key(expressions, phrase, stripped_phrase) if stripped_phrase != phrase else dict(expressions)
            updated[stripped_phrase] = {"note": stripped_note} if stripped_note else {}
            content[goal_text]["expressions"] = updated
            save_content(iso3, content)
            st.rerun()
    if delete_col.button("Delete", key=f"delete_expr_{scope}", use_container_width=True):
        confirm_delete_expression(iso3, content, goal_text, expressions, phrase)


def render_add_expression(iso3: str, content: LanguageContent, goal_text: str, expressions: dict) -> None:
    st.caption("Add expression")
    gen = st.session_state.get(f"expr_gen_{iso3}_{goal_text}", 0)
    scope = f"{iso3}_{goal_text}_{gen}"

    phrase_col, note_col = st.columns(2)
    new_phrase = phrase_col.text_input("Phrase", key=f"add_phrase_{scope}")
    new_note = note_col.text_input("Note (optional)", key=f"add_note_{scope}")

    if st.button("Add expression", key=f"add_expr_btn_{scope}"):
        stripped_phrase = new_phrase.strip()
        stripped_note = new_note.strip()
        if not stripped_phrase:
            st.error("Phrase text is required")
        elif stripped_phrase in expressions:
            st.error("This phrase already exists for this goal")
        else:
            expressions[stripped_phrase] = {"note": stripped_note} if stripped_note else {}
            content[goal_text]["expressions"] = expressions
            save_content(iso3, content)
            st.session_state[f"expr_gen_{iso3}_{goal_text}"] = gen + 1
            st.rerun()


def render_goal(iso3: str, content: LanguageContent, goal_text: str) -> None:
    expressions = content[goal_text].get("expressions", {})

    new_goal_text = st.text_input("Goal text", value=goal_text, key=f"goal_name_{iso3}_{goal_text}")
    save_col, delete_col = st.columns([3, 1])
    if save_col.button("Save", key=f"save_goal_{iso3}_{goal_text}", use_container_width=True):
        stripped = new_goal_text.strip()
        if not stripped:
            st.error("Goal text is required")
        elif stripped != goal_text and stripped in content:
            st.error("A goal with this text already exists")
        elif stripped != goal_text:
            save_content(iso3, rename_key(content, goal_text, stripped))
            st.rerun()
    if delete_col.button("Delete", key=f"delete_goal_{iso3}_{goal_text}", use_container_width=True):
        confirm_delete_goal(iso3, content, goal_text)

    st.divider()

    if not expressions:
        st.caption("No expressions yet.")
    for phrase, entry in list(expressions.items()):
        render_expression(iso3, content, goal_text, expressions, phrase, entry.get("note", ""))
        st.divider()

    render_add_expression(iso3, content, goal_text, expressions)


def render_add_goal(iso3: str, content: LanguageContent) -> None:
    st.subheader("Add communication goal")
    gen = st.session_state.get(f"goal_gen_{iso3}", 0)
    new_goal = st.text_input("Goal (e.g. [saying] excuse me)", key=f"add_goal_{iso3}_{gen}")
    if st.button("Add goal", key=f"add_goal_btn_{iso3}_{gen}"):
        stripped = new_goal.strip()
        if not stripped:
            st.error("Goal text is required")
        elif stripped in content:
            st.error("A goal with this text already exists")
        else:
            content[stripped] = {"expressions": {}}
            save_content(iso3, content)
            st.session_state[f"goal_gen_{iso3}"] = gen + 1
            st.rerun()


def render_language_detail(iso3: str) -> None:
    content = load_content(iso3)
    st.subheader("Communication goals")
    if not content:
        st.caption("No communication goals yet.")
    for goal_text in list(content.keys()):
        with st.expander(goal_text, key=f"goal_expander_{iso3}_{goal_text}"):
            render_goal(iso3, content, goal_text)

    st.divider()
    render_add_goal(iso3, content)


iso3 = render_language_picker()
if iso3 is None:
    st.title("Phrases CMS")
    st.info("Add a language in the sidebar to get started.")
else:
    st.title(f"Phrases — {language_display_name(iso3)}")
    render_language_detail(iso3)
