import type { VocabExample } from '../../entities/vocab/vocab'

// Picks `count` distinct random examples, optionally excluding one by its
// target text (used to exclude a vocab card's initialSentence for levels 2-4).
export function pickExamples(examples: VocabExample[], count: number, exclude?: string): VocabExample[] {
  const pool = exclude ? examples.filter((example) => example.target !== exclude) : [...examples]
  const picked: VocabExample[] = []

  while (picked.length < count && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length)
    picked.push(...pool.splice(index, 1))
  }

  return picked
}
