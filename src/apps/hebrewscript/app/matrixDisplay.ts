// Pure display helpers ported from linguanodon's hebrewscript app/matrix.js
// (the color scale, tooltip text, and percent/attempt formatting). The DOM
// building itself is replaced by a real Vue template in PageStats.vue.

import type { MatrixCellStats } from './types'

const MIN_RANDOM_ACCURACY = 0.5
const SCIENTIFIC_COLOR_STOPS: { position: number; rgb: [number, number, number] }[] = [
  { position: 0, rgb: [0, 34, 78] },
  { position: 0.25, rgb: [52, 73, 107] },
  { position: 0.5, rgb: [103, 107, 112] },
  { position: 0.75, rgb: [168, 144, 92] },
  { position: 1, rgb: [253, 233, 69] }
]

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const mixChannel = (start: number, end: number, amount: number) => Math.round(start + (end - start) * amount)

function getScientificColor(value: number): [number, number, number] {
  const normalizedValue = clamp((value - MIN_RANDOM_ACCURACY) / (1 - MIN_RANDOM_ACCURACY), 0, 1)

  for (let index = 1; index < SCIENTIFIC_COLOR_STOPS.length; index += 1) {
    const start = SCIENTIFIC_COLOR_STOPS[index - 1]
    const end = SCIENTIFIC_COLOR_STOPS[index]

    if (normalizedValue <= end.position) {
      const range = end.position - start.position || 1
      const amount = (normalizedValue - start.position) / range
      return start.rgb.map((channel, channelIndex) => mixChannel(channel, end.rgb[channelIndex], amount)) as [number, number, number]
    }
  }

  return [...SCIENTIFIC_COLOR_STOPS[SCIENTIFIC_COLOR_STOPS.length - 1].rgb]
}

const getRelativeLuminance = ([red, green, blue]: [number, number, number]) => (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255

export const formatPercent = (value: number | null): string => (value === null ? '—' : `${Math.round(value * 100)}%`)

export const formatEffectiveAttempts = (value: number): string => (value >= 10 ? Math.round(value).toString() : value.toFixed(1))

export function getTooltip(cell: MatrixCellStats, formatKeyLabel: (key: string) => string): string {
  if (cell.decayedPosteriorAccuracy === null) return 'No tracked attempts yet'
  return [
    `Correct ${formatKeyLabel(cell.correctKey)}, distractor ${formatKeyLabel(cell.distractorKey)}`,
    `Weighted accuracy ${formatPercent(cell.decayedPosteriorAccuracy)}`,
    `Effective attempts ${formatEffectiveAttempts(cell.effectiveAttempts)}`,
    `Lifetime: ${cell.correct}/${cell.attempts} correct`,
    `Lifetime accuracy ${formatPercent(cell.rawAccuracy)}`
  ].join('\n')
}

export function getCellStyle(cell: MatrixCellStats): Record<string, string> {
  if (cell.decayedPosteriorAccuracy === null || cell.correctKey === cell.distractorKey) return {}

  const [red, green, blue] = getScientificColor(cell.decayedPosteriorAccuracy)
  const alpha = Math.min(0.22 + Math.log(cell.attempts + 1) / 4, 0.82)
  const textColor = getRelativeLuminance([red, green, blue]) > 0.58 ? 'rgb(17 24 39)' : 'rgb(248 250 252)'

  return {
    backgroundColor: `rgba(${red}, ${green}, ${blue}, ${alpha})`,
    borderColor: `rgba(${red}, ${green}, ${blue}, 0.58)`,
    color: textColor
  }
}
