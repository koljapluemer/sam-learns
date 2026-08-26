import type { VocabEntry } from '../../entities/vocab/vocab'

// The sentence pool (entities/sentence) has no translations of its own -
// every pool sentence exactly matches some vocab word's example sentence,
// so translations are looked up by joining against the vocab catalog.
export function buildTranslationLookup(words: Map<string, VocabEntry>): Map<string, string> {
  const lookup = new Map<string, string>()
  for (const entry of words.values()) {
    for (const example of entry.examples) lookup.set(example.target, example.translation)
  }
  return lookup
}
