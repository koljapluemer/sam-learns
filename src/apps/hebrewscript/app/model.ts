// Ported unchanged from linguanodon's hebrewscript app/model.js. Hebrew
// letter confusion is a single flat alphabet swap - any letter can be
// mistaken for any other letter - so there's no family/normalization step.

import type { DistractorCandidate } from './types'

export const HEBREW_LETTER_KEYS = [
  'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י',
  'כ', 'ך', 'ל', 'מ', 'ם', 'נ', 'ן', 'ס', 'ע', 'פ',
  'ף', 'צ', 'ץ', 'ק', 'ר', 'ש', 'ת'
] as const

const hebrewLetterSet = new Set<string>(HEBREW_LETTER_KEYS)

const isHebrewLetter = (character: string) => hebrewLetterSet.has(character)

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }
  return copy
}

function listCandidatesInternal(transcript: string, stopAfterFirst = false): DistractorCandidate[] {
  const characters = [...transcript]
  const candidates: DistractorCandidate[] = []

  for (let changedIndex = 0; changedIndex < characters.length; changedIndex += 1) {
    const character = characters[changedIndex]
    if (!isHebrewLetter(character)) continue

    for (const alternative of HEBREW_LETTER_KEYS) {
      if (alternative === character) continue

      const mutated = [...characters]
      mutated[changedIndex] = alternative
      const label = mutated.join('')
      if (label === transcript) continue

      candidates.push({
        label,
        changedIndex,
        correctCharacter: character,
        distractorCharacter: alternative,
        correctLetter: character,
        distractorLetter: alternative
      })

      if (stopAfterFirst) return candidates
    }
  }

  return candidates
}

export const canGenerateDistractor = (transcript: string): boolean => listCandidatesInternal(transcript, true).length > 0

export const listDistractorCandidates = (transcript: string): DistractorCandidate[] => shuffle(listCandidatesInternal(transcript))
