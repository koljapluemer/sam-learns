// Single source of truth for all world-map visual styling decisions.

export const WATER_COLOR = '#dcefff'
export const COUNTRY_FILL_COLOR = '#e6e6e6'
export const MAP_STROKE_COLOR = '#787878'
export const MAP_STROKE_WIDTH = 2

export const MARKER_STROKE_WIDTH = 2

// k=1 is always the true world view (the floor - you can zoom out no further). The ceiling is
// whichever is larger: this default, or enough headroom above the exercise's own starting zoom
// level to still let the user zoom in further from wherever they're dropped in.
export const ZOOM_SCALE_EXTENT: [number, number] = [1, 8]
export const ZOOM_MAX_HEADROOM = 3
// Pointer movement (px) tolerated between down/up before a tap is treated as a drag, not a click.
export const ZOOM_CLICK_DISTANCE = 6
// Scale multiplier applied per zoom in/out button press.
export const ZOOM_BUTTON_FACTOR = 1.5
export const ZOOM_TRANSITION_MS = 250

// Default color for highlighting/marking the country relevant to the current exercise.
export const HIGHLIGHT_COLOR = '#3b82f6'
// Feedback color shown once the correct country has been found.
export const SUCCESS_COLOR = '#22c55e'

// CMS preview uses distinct colors so authors can tell highlight/distractor apart from exercise feedback.
export const CMS_HIGHLIGHT_COLOR = '#f59e0b'
export const CMS_DISTRACTOR_COLOR = '#a855f7'
