// Picks one snippet's exercise batch (hard limit of 3): FSRS-due items
// first, then unseen core vocab, then other unseen vocab, then the
// soonest-due rest.
import type { Card } from 'ts-fsrs'
import type { Snippet } from '../../entities/snippet/snippet'
import { buildVocabKey, getVocabCardsByKeys } from '../../entities/vocab-card/vocabCard'
import { shuffleArray } from '../../dumb/random'

const SET_SIZE = 3

export type VocabEntry = {
  term: string
  translation: string
  key: string
  card: Card | undefined
}

export async function selectExercises(youtubeId: string, snippet: Snippet, now: Date = new Date()): Promise<VocabEntry[]> {
  const keys = snippet.vocab.map((item) => buildVocabKey(youtubeId, item.term))
  const cardsByKey = await getVocabCardsByKeys(keys)

  const due: VocabEntry[] = []
  const unseenCore: VocabEntry[] = []
  const unseenOther: VocabEntry[] = []
  const notYetDue: VocabEntry[] = []

  snippet.vocab.forEach((item, index) => {
    const key = keys[index]
    const card = cardsByKey.get(key)
    const entry: VocabEntry = { term: item.term, translation: item.translation, key, card }

    if (!card) (item.core ? unseenCore : unseenOther).push(entry)
    else if (card.due <= now) due.push(entry)
    else notYetDue.push(entry)
  })

  notYetDue.sort((a, b) => a.card!.due.getTime() - b.card!.due.getTime())

  return [...shuffleArray(due), ...shuffleArray(unseenCore), ...shuffleArray(unseenOther), ...notYetDue].slice(0, SET_SIZE)
}
