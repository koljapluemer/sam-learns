// Tone-confusion-candidate generator, ported unchanged from linguanodon's
// viettonepractice app/model.js (itself a tone-only port of
// listen-to-viet's src/entities/listening-clip/model.ts).
import type { DistractorCandidate } from './types'

export const TONE_KEYS = ['ngang', 'huyen', 'sac', 'hoi', 'nga', 'nang'] as const

const VOWEL_FAMILIES = [
  ['a', 'à', 'á', 'ả', 'ã', 'ạ'],
  ['ă', 'ằ', 'ắ', 'ẳ', 'ẵ', 'ặ'],
  ['â', 'ầ', 'ấ', 'ẩ', 'ẫ', 'ậ'],
  ['e', 'è', 'é', 'ẻ', 'ẽ', 'ẹ'],
  ['ê', 'ề', 'ế', 'ể', 'ễ', 'ệ'],
  ['i', 'ì', 'í', 'ỉ', 'ĩ', 'ị'],
  ['o', 'ò', 'ó', 'ỏ', 'õ', 'ọ'],
  ['ô', 'ồ', 'ố', 'ổ', 'ỗ', 'ộ'],
  ['ơ', 'ờ', 'ớ', 'ở', 'ỡ', 'ợ'],
  ['u', 'ù', 'ú', 'ủ', 'ũ', 'ụ'],
  ['ư', 'ừ', 'ứ', 'ử', 'ữ', 'ự'],
  ['y', 'ỳ', 'ý', 'ỷ', 'ỹ', 'ỵ']
]

const TRANSCRIPT_CLEANUP_PATTERN = /(^|\s)-N(?=\s|$)/g
const WORD_SPLIT_PATTERN = /\s+/
const ALPHABETIC_CHARACTER_PATTERN = /^\p{L}$/u

const VIETNAMESE_ALPHABET_CHARACTERS = [
  'a', 'ă', 'â', 'b', 'c', 'd', 'đ', 'e', 'ê', 'g', 'h', 'i', 'k', 'l', 'm', 'n',
  'o', 'ô', 'ơ', 'p', 'q', 'r', 's', 't', 'u', 'ư', 'v', 'x', 'y',
  ...VOWEL_FAMILIES.flatMap((family) => family.slice(1))
]

function buildCharacterSet(characters: readonly string[]): Set<string> {
  const set = new Set<string>()
  characters.forEach((character) => {
    set.add(character)
    set.add(character.toUpperCase())
  })
  return set
}

const TONE_MARKED_CHARACTER_SET = buildCharacterSet(VOWEL_FAMILIES.flatMap((family) => family.slice(1)))
const DEFINITELY_VIETNAMESE_CHARACTER_SET = buildCharacterSet([
  'ă', 'â', 'ê', 'ô', 'ơ', 'ư', 'đ',
  ...VOWEL_FAMILIES.flatMap((family) => family.slice(1))
])
const VIETNAMESE_ALPHABET_CHARACTER_SET = buildCharacterSet(VIETNAMESE_ALPHABET_CHARACTERS)

const characterToneMap: Map<string, string> = (() => {
  const map = new Map<string, string>()
  for (const family of VOWEL_FAMILIES) {
    family.forEach((character, toneIndex) => {
      map.set(character, TONE_KEYS[toneIndex])
    })
  }
  for (const [character, tone] of [...map.entries()]) {
    map.set(character.toUpperCase(), tone)
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

  // Same vowel-family, cross-tone alternatives (e.g. all 6 tones of "a" are
  // mutually confusable). The source's cross-family/letter section is
  // intentionally not ported here.
  for (const family of VOWEL_FAMILIES) {
    for (const source of family) {
      for (const candidate of family) {
        addAlternative(source, candidate)
      }
    }
  }

  // Uppercase mirroring of everything built above.
  for (const [source, candidates] of [...map.entries()]) {
    const upperSource = source.toUpperCase()
    for (const candidate of candidates) {
      addAlternative(upperSource, candidate.toUpperCase())
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

const isVietnameseConfirmedToken = (token: string) =>
  [...token].some((character) => DEFINITELY_VIETNAMESE_CHARACTER_SET.has(character))

const hasOnlyVietnameseAlphabetCharacters = (token: string) =>
  [...token].every((character) => !isAlphabeticCharacter(character) || VIETNAMESE_ALPHABET_CHARACTER_SET.has(character))

const isValidSourceToken = (token: string) => isVietnameseConfirmedToken(token) && hasOnlyVietnameseAlphabetCharacters(token)

const getToneMarkedCharacterCount = (token: string) =>
  [...token].filter((character) => TONE_MARKED_CHARACTER_SET.has(character)).length

const isValidMutatedToken = (token: string) => getToneMarkedCharacterCount(token) <= 1

export const normalizeTranscript = (value: string): string =>
  value.replace(TRANSCRIPT_CLEANUP_PATTERN, ' ').replace(WORD_SPLIT_PATTERN, ' ').trim()

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }
  return copy
}

function listDistractorCandidatesInternal(transcript: string): DistractorCandidate[] {
  const normalizedTranscript = normalizeTranscript(transcript)
  const characters = [...normalizedTranscript]
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
      if (label === normalizedTranscript) continue

      const mutatedToken = mutated.slice(tokenSpan.start, tokenSpan.end).join('')
      if (!isValidMutatedToken(mutatedToken)) continue

      candidates.push({
        label,
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

export const listDistractorCandidates = (transcript: string): DistractorCandidate[] =>
  shuffle(listDistractorCandidatesInternal(transcript))
