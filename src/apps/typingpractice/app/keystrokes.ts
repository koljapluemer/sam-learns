// Vietnamese TELEX/VNI keystroke decomposition, ported unchanged from
// linguanodon's typingpractice/static/typingpractice/js/main.js.
//
// We already know the target word, so this only needs to go text ->
// keystrokes, not the other way round (as a real IME would). NFD splits
// precomposed letters (e.g. "ệ") into a base letter plus combining marks, so
// this only needs small tables for those marks instead of one entry per
// precomposed Vietnamese letter.
//
// The tone key isn't typed at the diacritic's own letter - both TELEX and
// VNI type it at the end of the vowel cluster, before any trailing
// consonant (e.g. "tiếng" -> "ti" + "ee" + "s" + "ng"). So letters are
// grouped into (consonants)(vowel run)(consonants) and the tone key is
// inserted at the vowel-run boundary.

export type KeystrokeMethod = 'off' | 'telex' | 'vni'

const CIRCUMFLEX = '̂' // â ê ô
const BREVE = '̆' // ă
const HORN = '̛' // ơ ư
const GRAVE = '̀' // huyền
const ACUTE = '́' // sắc
const TILDE = '̃' // ngã
const HOOK_ABOVE = '̉' // hỏi
const DOT_BELOW = '̣' // nặng

const SHAPE_MARKS = new Set([CIRCUMFLEX, BREVE, HORN])
const TONE_MARKS = new Set([GRAVE, ACUTE, TILDE, HOOK_ABOVE, DOT_BELOW])
const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'y'])

const TELEX_TONE: Record<string, string> = { [GRAVE]: 'f', [ACUTE]: 's', [HOOK_ABOVE]: 'r', [TILDE]: 'x', [DOT_BELOW]: 'j' }
const VNI_TONE: Record<string, string> = { [GRAVE]: '2', [ACUTE]: '1', [HOOK_ABOVE]: '3', [TILDE]: '4', [DOT_BELOW]: '5' }

function shapeSuffix(base: string, mark: string, method: KeystrokeMethod): string {
  const upper = base !== base.toLowerCase()
  if (method === 'telex') {
    if (mark === CIRCUMFLEX) return base
    if (mark === BREVE || mark === HORN) return upper ? 'W' : 'w'
  } else {
    if (mark === CIRCUMFLEX) return '6'
    if (mark === BREVE) return '8'
    if (mark === HORN) return '7'
  }
  return ''
}

function toneSuffix(mark: string, method: KeystrokeMethod): string {
  return (method === 'telex' ? TELEX_TONE : VNI_TONE)[mark] || ''
}

type LetterGroup = { base: string; shapeMark: string; toneMark: string; isDBar: boolean }

function groupLetter(ch: string): LetterGroup {
  if (ch === 'đ' || ch === 'Đ') return { base: ch, shapeMark: '', toneMark: '', isDBar: true }
  const decomposed = ch.normalize('NFD')
  const base = decomposed[0]
  let shapeMark = ''
  let toneMark = ''
  for (const mark of decomposed.slice(1)) {
    if (SHAPE_MARKS.has(mark)) shapeMark = mark
    else if (TONE_MARKS.has(mark)) toneMark = mark
  }
  return { base, shapeMark, toneMark, isDBar: false }
}

function syllableToKeystrokes(token: string, method: KeystrokeMethod): string {
  const groups = Array.from(token).map(groupLetter)
  const outputs = groups.map((g) => {
    if (g.isDBar) return method === 'telex' ? (g.base === 'đ' ? 'dd' : 'DD') : g.base === 'đ' ? 'd9' : 'D9'
    return g.base + (g.shapeMark ? shapeSuffix(g.base, g.shapeMark, method) : '')
  })
  const isVowel = groups.map((g) => !g.isDBar && VOWELS.has(g.base.toLowerCase()))

  let toneStr = ''
  for (const g of groups) {
    if (g.toneMark) {
      toneStr = toneSuffix(g.toneMark, method)
      break
    }
  }

  let runEnd = -1
  let started = false
  for (let i = 0; i < isVowel.length; i++) {
    if (isVowel[i]) {
      started = true
      runEnd = i
    } else if (started) {
      break
    }
  }

  let result = ''
  for (let i = 0; i < groups.length; i++) {
    result += outputs[i]
    if (i === runEnd && toneStr) {
      result += toneStr
      toneStr = ''
    }
  }
  if (toneStr) result += toneStr
  return result
}

export function wordToKeystrokes(word: string, method: KeystrokeMethod): string {
  return word
    .split(' ')
    .map((token) => syllableToKeystrokes(token, method))
    .join(' ')
}
