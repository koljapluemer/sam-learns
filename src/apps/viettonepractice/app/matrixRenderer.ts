// Port of linguanodon's viettonepractice app/matrix.js - deliberately kept
// as imperative DOM building (matching the original's own style) rather
// than rewritten as a Vue component, since it's a self-contained,
// container-driven renderer with no reactive state of its own; the Vue
// page that owns it just calls renderMatrix(containerEl, {...}) from
// onMounted, same shape as the source app.
import type { MatrixCellStats, MatrixSummary, PracticePairTarget } from './types'

const MIN_RANDOM_ACCURACY = 0.5
const SCIENTIFIC_COLOR_STOPS = [
  { position: 0, rgb: [0, 34, 78] },
  { position: 0.25, rgb: [52, 73, 107] },
  { position: 0.5, rgb: [103, 107, 112] },
  { position: 0.75, rgb: [168, 144, 92] },
  { position: 1, rgb: [253, 233, 69] }
]

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const mixChannel = (start: number, end: number, amount: number) => Math.round(start + (end - start) * amount)

function getScientificColor(value: number): number[] {
  const normalizedValue = clamp((value - MIN_RANDOM_ACCURACY) / (1 - MIN_RANDOM_ACCURACY), 0, 1)

  for (let index = 1; index < SCIENTIFIC_COLOR_STOPS.length; index += 1) {
    const start = SCIENTIFIC_COLOR_STOPS[index - 1]
    const end = SCIENTIFIC_COLOR_STOPS[index]

    if (normalizedValue <= end.position) {
      const range = end.position - start.position || 1
      const amount = (normalizedValue - start.position) / range
      return start.rgb.map((channel, channelIndex) => mixChannel(channel, end.rgb[channelIndex], amount))
    }
  }

  return [...SCIENTIFIC_COLOR_STOPS[SCIENTIFIC_COLOR_STOPS.length - 1].rgb]
}

const getRelativeLuminance = ([red, green, blue]: number[]) => (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255
const formatPercent = (value: number | null) => (value === null ? '—' : `${Math.round(value * 100)}%`)
const formatEffectiveAttempts = (value: number) => (value >= 10 ? Math.round(value).toString() : value.toFixed(1))

function getTooltip(cell: MatrixCellStats, formatKeyLabel: (key: string) => string): string {
  if (cell.decayedPosteriorAccuracy === null) return 'No tracked attempts yet'
  return [
    `Correct ${formatKeyLabel(cell.correctKey)}, distractor ${formatKeyLabel(cell.distractorKey)}`,
    `Weighted accuracy ${formatPercent(cell.decayedPosteriorAccuracy)}`,
    `Effective attempts ${formatEffectiveAttempts(cell.effectiveAttempts)}`,
    `Lifetime: ${cell.correct}/${cell.attempts} correct`,
    `Lifetime accuracy ${formatPercent(cell.rawAccuracy)}`
  ].join('\n')
}

function getCellStyle(cell: MatrixCellStats): Partial<CSSStyleDeclaration> {
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

export function renderMatrix(
  container: HTMLElement,
  options: {
    title: string
    summary: MatrixSummary
    formatKey?: (key: string) => string
    onSelectPair: (pairTarget: PracticePairTarget) => void
  }
) {
  const { title, summary, formatKey, onSelectPair } = options
  const formatKeyLabel = (key: string) => formatKey?.(key) ?? key
  const rows = summary.rows
  const columnKeys = rows[0]?.cells.map((cell) => cell.distractorKey) ?? []

  const visibleCells = rows.flatMap((row) => row.cells.filter((cell) => cell.correctKey !== cell.distractorKey && cell.decayedPosteriorAccuracy !== null))
  const attempts = visibleCells.reduce((total, cell) => total + cell.attempts, 0)
  const distinctPairs = visibleCells.length

  const topPairs = [...visibleCells]
    .filter((cell) => cell.attempts >= 3)
    .sort((left, right) => {
      if (left.decayedPosteriorAccuracy !== right.decayedPosteriorAccuracy) {
        return (left.decayedPosteriorAccuracy ?? 0) - (right.decayedPosteriorAccuracy ?? 0)
      }
      if (left.effectiveAttempts !== right.effectiveAttempts) return right.effectiveAttempts - left.effectiveAttempts
      return right.attempts - left.attempts
    })
    .slice(0, 5)

  container.innerHTML = ''
  container.className = 'space-y-4'

  const header = document.createElement('div')
  header.className = 'flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'
  header.innerHTML = `
    <div class="max-w-2xl space-y-1">
      <h2 class="text-lg font-semibold">${title}</h2>
      <p class="text-sm text-base-content/70">Rows are the correct answer. Columns are the distractor shown alongside it.</p>
      <p class="text-sm text-base-content/70">Each cell shows a recency-weighted Bayesian accuracy estimate for that direction. The smaller number underneath is the effective attempt count after discounting older results.</p>
    </div>
    <div class="stats stats-vertical border border-base-300 bg-base-100 shadow-sm sm:stats-horizontal">
      <div class="stat px-4 py-3">
        <div class="stat-title text-xs">Weighted accuracy</div>
        <div class="stat-value text-xl">${formatPercent(summary.decayedPosteriorAccuracy)}</div>
      </div>
      <div class="stat px-4 py-3">
        <div class="stat-title text-xs">Attempts</div>
        <div class="stat-value text-xl">${attempts}</div>
      </div>
      <div class="stat px-4 py-3">
        <div class="stat-title text-xs">Directions</div>
        <div class="stat-value text-xl">${distinctPairs}</div>
      </div>
    </div>
  `
  container.appendChild(header)

  const gridWrapper = document.createElement('div')
  gridWrapper.className = 'overflow-x-auto overflow-y-hidden rounded-box border border-base-300 bg-base-100 p-3'
  const grid = document.createElement('div')
  grid.className = 'grid w-fit min-w-full gap-2 text-center text-xs sm:text-sm'
  grid.style.gridTemplateColumns = `max-content repeat(${columnKeys.length}, minmax(4.5rem, 1fr))`

  grid.appendChild(document.createElement('div')).className = 'sticky left-0 z-10 rounded-box bg-base-100 p-2'

  columnKeys.forEach((columnKey) => {
    const cell = document.createElement('div')
    cell.className = 'flex items-center justify-center rounded-box bg-base-200 p-2 font-medium'
    cell.textContent = formatKeyLabel(columnKey)
    grid.appendChild(cell)
  })

  rows.forEach((row) => {
    const rowHeader = document.createElement('div')
    rowHeader.className = 'sticky left-0 z-10 flex items-center rounded-box bg-base-200 p-2 font-medium'
    rowHeader.textContent = formatKeyLabel(row.key)
    grid.appendChild(rowHeader)

    row.cells.forEach((cell) => {
      const isDisabled = cell.correctKey === cell.distractorKey || cell.attempts === 0
      const button = document.createElement('button')
      button.type = 'button'
      button.className = `tooltip tooltip-bottom min-h-20 rounded-box border p-2 ${
        isDisabled ? 'cursor-default border-base-300 bg-base-200/60 text-base-content/40' : 'cursor-pointer border-base-300 bg-base-100'
      }`
      button.setAttribute('data-tip', getTooltip(cell, formatKeyLabel))
      button.disabled = isDisabled
      Object.assign(button.style, getCellStyle(cell))

      button.innerHTML = `
        <div class="flex h-full flex-col items-center justify-center gap-1">
          <span class="text-sm font-semibold sm:text-base">${formatPercent(cell.decayedPosteriorAccuracy)}</span>
          <span class="text-[11px] text-base-content/70">eff ${formatEffectiveAttempts(cell.effectiveAttempts)}</span>
        </div>
      `

      if (!isDisabled) {
        button.addEventListener('click', () => onSelectPair({ correctKey: cell.correctKey, distractorKey: cell.distractorKey }))
      }

      grid.appendChild(button)
    })
  })

  gridWrapper.appendChild(grid)
  container.appendChild(gridWrapper)

  const hardestSection = document.createElement('div')
  hardestSection.className = 'rounded-box border border-base-300 bg-base-100 p-4'

  if (topPairs.length) {
    hardestSection.innerHTML = `<h3 class="text-sm font-semibold">Hardest pairs</h3>`
    const list = document.createElement('div')
    list.className = 'mt-3 grid gap-2'

    topPairs.forEach((pair) => {
      const label = `${formatKeyLabel(pair.correctKey)} -> ${formatKeyLabel(pair.distractorKey)}`
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'flex items-center justify-between gap-3 rounded-box bg-base-200 px-3 py-2 text-left text-sm transition hover:bg-base-300'
      button.innerHTML = `<span>${label}</span><span class="text-base-content/70">${formatPercent(pair.decayedPosteriorAccuracy)} · eff ${formatEffectiveAttempts(pair.effectiveAttempts)}</span>`
      button.addEventListener('click', () => onSelectPair({ correctKey: pair.correctKey, distractorKey: pair.distractorKey }))
      list.appendChild(button)
    })

    hardestSection.appendChild(list)
  } else {
    hardestSection.innerHTML = `
      <h3 class="text-sm font-semibold">Hardest pairs</h3>
      <p class="mt-3 text-sm text-base-content/70">More tracked attempts are needed before pair rankings become useful.</p>
    `
  }

  container.appendChild(hardestSection)
}
