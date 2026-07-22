// Practice-loop state, ported from linguanodon's typingpractice/static/.../js/main.js.
// The original drove the DOM directly (innerHTML + manual event listeners);
// here the same line-scoring/timer logic lives behind Vue refs instead, and
// the per-line trial is logged to this repo's shared cross-app activity log
// instead of the dropped server-tracking queueEvent call.

import { computed, onMounted, onUnmounted, ref } from 'vue'
import { logActivity } from '@/shared/activity/useLearningEvent'
import { useLocalSetting } from '@/shared/settings/useLocalSetting'
import { wordToKeystrokes, type KeystrokeMethod } from './keystrokes'

export type WordPair = [string, string]

const WORDS_PER_LINE = 3
const IDLE_TIMEOUT_MS = 10000

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

// Pure function of a line's words and the current field value - no memory
// of prior renders. However the value got to its current state (real IME
// composition, or a tool that edits already-typed characters in place),
// this always reflects what's true right now.
function renderLine(lineWords: WordPair[], typed: string, active: boolean, method: KeystrokeMethod): string {
  let html = '<div class="flex justify-center gap-8">'
  let offset = 0
  lineWords.forEach(([vie, eng]) => {
    html += '<div class="flex flex-col items-center gap-1">'
    html += '<span class="font-mono text-2xl tracking-wide">'
    for (let i = 0; i < vie.length; i++) {
      const idx = offset + i
      const char = vie[i]
      if (active && idx < typed.length) {
        html += `<span class="${typed[idx] === char ? 'text-success' : 'text-error underline'}">${char}</span>`
      } else if (active && idx === typed.length) {
        html += `<span class="bg-primary/30 rounded">${char}</span>`
      } else {
        html += `<span class="text-base-content/40">${char}</span>`
      }
    }
    html += '</span>'
    html += `<span class="text-xs opacity-60">${eng}</span>`
    if (method !== 'off') {
      html += `<span class="badge badge-ghost badge-sm font-mono">${wordToKeystrokes(vie, method)}</span>`
    }
    html += '</div>'
    offset += vie.length + 1
  })
  html += '</div>'
  return html
}

const WORD_COUNT = 30

function sampleWords(words: Record<string, string>, count: number): WordPair[] {
  const entries = Object.entries(words) as WordPair[]
  const sample: WordPair[] = []
  const pool = entries.slice()
  for (let i = 0; i < Math.min(count, pool.length); i++) {
    const index = Math.floor(Math.random() * pool.length)
    sample.push(pool[index])
    pool.splice(index, 1)
  }
  return sample
}

export function useTypingSession() {
  const method = useLocalSetting<KeystrokeMethod>('typingpractice-vn-input-method', 'off')

  const loading = ref(true)
  const loadError = ref('')
  const inputValue = ref('')
  const wpm = ref(0)
  const accuracy = ref(100)
  const elapsedSeconds = ref(0)

  let allLines: WordPair[][] = []
  let lineIndex = 0
  let currentLine: WordPair[] = []
  let nextLine: WordPair[] = []
  let target = ''
  let totalChars = 0
  let mistakes = 0
  let completedWords = 0

  // Timer: accumulates only while the tab is visible and typing is active.
  let elapsedMs = 0
  let runStart: number | null = null
  let lastKeyTime = 0

  function resumeTimer(): void {
    if (runStart === null && !document.hidden) {
      runStart = Date.now()
    }
  }

  function pauseTimer(): void {
    if (runStart !== null) {
      elapsedMs += Date.now() - runStart
      runStart = null
    }
  }

  function currentElapsedMs(): number {
    return elapsedMs + (runStart !== null ? Date.now() - runStart : 0)
  }

  function nextChunk(): WordPair[] {
    const line = allLines[lineIndex % allLines.length]
    lineIndex++
    return line
  }

  const lineHtml = ref('')

  function renderLines(): void {
    lineHtml.value =
      renderLine(currentLine, inputValue.value, true, method.value) + renderLine(nextLine, '', false, method.value)
  }

  function tick(): void {
    if (runStart !== null && Date.now() - lastKeyTime > IDLE_TIMEOUT_MS) {
      pauseTimer()
    }
    const elapsedMin = currentElapsedMs() / 60000
    const typedInLine = inputValue.value.trim().length > 0 ? inputValue.value.trim().split(/\s+/).length : 0
    const typedWords = completedWords + typedInLine
    wpm.value = elapsedMin > 0 ? Math.round(typedWords / elapsedMin) : 0
    accuracy.value = totalChars > 0 ? Math.max(0, Math.round(((totalChars - mistakes) / totalChars) * 100)) : 100
    elapsedSeconds.value = Math.round(currentElapsedMs() / 1000)
  }

  // Scored once, from the final settled value, when a line completes - never
  // accumulated keystroke by keystroke. A letter that took several revisions
  // to reach its correct form is graded once, as whatever it ended up being.
  function scoreLine(value: string): number {
    let lineMistakes = 0
    for (let i = 0; i < target.length; i++) {
      totalChars++
      if (value[i] !== target[i]) {
        mistakes++
        lineMistakes++
      }
    }
    return lineMistakes
  }

  function advanceLine(value: string): void {
    scoreLine(value)
    void logActivity('typingpractice')
    completedWords += currentLine.length
    currentLine = nextLine
    nextLine = nextChunk()
    target = currentLine.map(([vie]) => vie).join(' ')
    inputValue.value = ''
    renderLines()
  }

  function handleInput(value: string, isComposing: boolean): void {
    // 'input' fires reliably on every change regardless of how it got there -
    // unlike keydown, which reports e.key as the opaque value "Process" for
    // the physical keys involved while an IME is composing.
    lastKeyTime = Date.now()
    resumeTimer()

    inputValue.value = value
    renderLines()
    if (isComposing) return
    if (value.length >= target.length) advanceLine(value)
  }

  function handleVisibilityChange(): void {
    if (document.hidden) pauseTimer()
  }

  let tickInterval: ReturnType<typeof setInterval> | undefined

  onMounted(async () => {
    try {
      const response = await fetch('/data/typingpractice/vie.json')
      if (!response.ok) throw new Error(`Failed to load word list (${response.status})`)
      const words = (await response.json()) as Record<string, string>
      const wordPairs = sampleWords(words, WORD_COUNT)

      allLines = chunk(wordPairs, WORDS_PER_LINE)
      lineIndex = 0
      currentLine = nextChunk()
      nextLine = nextChunk()
      target = currentLine.map(([vie]) => vie).join(' ')
      renderLines()

      tickInterval = setInterval(tick, 500)
      document.addEventListener('visibilitychange', handleVisibilityChange)
    } catch (error) {
      loadError.value = error instanceof Error ? error.message : String(error)
    } finally {
      loading.value = false
    }
  })

  onUnmounted(() => {
    if (tickInterval) clearInterval(tickInterval)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  })

  return {
    loading,
    loadError,
    method,
    inputValue,
    lineHtml,
    wpm,
    accuracy,
    elapsedSeconds: computed(() => `${elapsedSeconds.value}s`),
    handleInput
  }
}
