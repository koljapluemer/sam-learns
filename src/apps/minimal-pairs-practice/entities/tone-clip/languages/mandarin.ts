// Mandarin language pack. Unlike Vietnamese, hanzi carries no visual tone
// marking at all, so there is no "mutate a diacritic in the transcript"
// operation available on the source data. Instead, `clip.transcript` for
// Mandarin clips is a *precomputed* pinyin string (one syllable per
// space-delimited token, diacritic style - built at content-curation time
// by cms/tonepractice/build_mandarin_clips.py via pypinyin, mirroring
// exactly how Vietnamese's transcripts are already one word per
// space-delimited token). This generator then runs the same
// character-substitution shape viet.ts uses, against a pinyin vowel-family
// table instead of a Vietnamese one.
//
// Neutral tone is deliberately excluded from the swap table: pinyin's
// neutral tone is visually unmarked (no diacritic) and only grammatically
// valid on specific particles (的/了/吗/...), unlike Vietnamese's `ngang`
// (unmarked but a fully general 6th tone) - treating it as a swappable
// alternative would generate implausible distractors. A syllable that's
// already neutral-toned in the source pinyin simply produces no candidate
// at that position, same as any other non-tone-marked character.
import type { DistractorCandidate } from '../types'
import type { LanguagePack } from './types'

export const TONE_KEYS = ['tone1', 'tone2', 'tone3', 'tone4'] as const

const VOWEL_FAMILIES = [
  ['ā', 'á', 'ǎ', 'à'],
  ['ē', 'é', 'ě', 'è'],
  ['ī', 'í', 'ǐ', 'ì'],
  ['ō', 'ó', 'ǒ', 'ò'],
  ['ū', 'ú', 'ǔ', 'ù'],
  ['ǖ', 'ǘ', 'ǚ', 'ǜ']
]

const ALPHABETIC_CHARACTER_PATTERN = /^\p{L}$/u

const PINYIN_BASE_LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'ü']

function buildCharacterSet(characters: readonly string[]): Set<string> {
  return new Set(characters)
}

const TONE_MARKED_CHARACTER_SET = buildCharacterSet(VOWEL_FAMILIES.flat())
const PINYIN_ALPHABET_CHARACTER_SET = buildCharacterSet([...PINYIN_BASE_LETTERS, ...VOWEL_FAMILIES.flat()])

const characterToneMap: Map<string, string> = (() => {
  const map = new Map<string, string>()
  for (const family of VOWEL_FAMILIES) {
    family.forEach((character, toneIndex) => {
      map.set(character, TONE_KEYS[toneIndex])
    })
  }
  return map
})()

const alternativeMap: Map<string, string[]> = (() => {
  const map = new Map<string, Set<string>>()

  const addAlternative = (source: string, candidate: string) => {
    if (source === candidate) return
    const alternatives = map.get(source) ?? new Set<string>()
    alternatives.add(candidate)
    map.set(source, alternatives)
  }

  for (const family of VOWEL_FAMILIES) {
    for (const source of family) {
      for (const candidate of family) {
        addAlternative(source, candidate)
      }
    }
  }

  return new Map([...map.entries()].map(([source, candidates]) => [source, [...candidates]]))
})()

const isAlphabeticCharacter = (character: string) => ALPHABETIC_CHARACTER_PATTERN.test(character)

type TokenSpan = { start: number; end: number }

function getTokenSpans(characters: string[]): TokenSpan[] {
  const spans: TokenSpan[] = []
  let tokenStart: number | null = null

  characters.forEach((character, index) => {
    if (isAlphabeticCharacter(character)) {
      if (tokenStart === null) tokenStart = index
      return
    }
    if (tokenStart !== null) {
      spans.push({ start: tokenStart, end: index })
      tokenStart = null
    }
  })

  if (tokenStart !== null) {
    spans.push({ start: tokenStart, end: characters.length })
  }

  return spans
}

function getTokenSpanForIndex(tokenSpans: TokenSpan[], index: number): TokenSpan | null {
  for (const span of tokenSpans) {
    if (index >= span.start && index < span.end) return span
  }
  return null
}

const isValidSourceToken = (token: string) =>
  [...token].every((character) => !isAlphabeticCharacter(character) || PINYIN_ALPHABET_CHARACTER_SET.has(character.toLowerCase()))

const getToneMarkedCharacterCount = (token: string) =>
  [...token].filter((character) => TONE_MARKED_CHARACTER_SET.has(character)).length

const isValidMutatedToken = (token: string) => getToneMarkedCharacterCount(token) <= 1

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }
  return copy
}

function listDistractorCandidatesInternal(transcript: string): DistractorCandidate[] {
  const characters = [...transcript.trim()]
  const tokenSpans = getTokenSpans(characters)
  const candidates: DistractorCandidate[] = []

  for (let changedIndex = 0; changedIndex < characters.length; changedIndex += 1) {
    const character = characters[changedIndex]
    const sourceTone = characterToneMap.get(character)
    const alternatives = alternativeMap.get(character)

    if (!sourceTone || !alternatives?.length) continue

    const tokenSpan = getTokenSpanForIndex(tokenSpans, changedIndex)
    if (!tokenSpan) continue

    const sourceToken = characters.slice(tokenSpan.start, tokenSpan.end).join('')
    if (!isValidSourceToken(sourceToken)) continue

    for (const alternative of alternatives) {
      const distractorTone = characterToneMap.get(alternative)
      if (!distractorTone) continue

      const mutated = [...characters]
      mutated[changedIndex] = alternative
      const label = mutated.join('')
      if (label === transcript) continue

      const mutatedToken = mutated.slice(tokenSpan.start, tokenSpan.end).join('')
      if (!isValidMutatedToken(mutatedToken)) continue

      candidates.push({
        label,
        word: sourceToken,
        changedIndex,
        correctCharacter: character,
        distractorCharacter: alternative,
        correctTone: sourceTone,
        distractorTone
      })
    }
  }

  return candidates
}

const listDistractorCandidates = (transcript: string): DistractorCandidate[] =>
  shuffle(listDistractorCandidatesInternal(transcript))

const TONE_LABELS: Record<string, string> = {
  tone1: '1st | ā',
  tone2: '2nd | á',
  tone3: '3rd | ǎ',
  tone4: '4th | à'
}

export const mandarinPack: LanguagePack = {
  code: 'cmn',
  name: 'Mandarin',
  audioBaseUrl: '/data/minimal-pairs-practice/cmn/audio/',
  clipsUrl: '/data/minimal-pairs-practice/cmn/clips.json',
  toneKeys: TONE_KEYS,
  toneLabels: TONE_LABELS,
  credits: {
    datasetName: 'AISHELL-1',
    datasetUrl: 'https://huggingface.co/datasets/AISHELL/AISHELL-1',
    licenseName: 'Apache License 2.0',
    licenseUrl: 'https://www.apache.org/licenses/LICENSE-2.0',
    licenseSummary:
      "Tagged Apache License 2.0 on the dataset repository; AISHELL's own dataset card additionally describes the data as \"free for academic use\"."
  },
  generateDistractors: listDistractorCandidates
}
