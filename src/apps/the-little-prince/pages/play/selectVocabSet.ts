// Pure selection algorithm for one segment's practice batch: prefer FSRS-due
// items, fill remaining slots with unseen items, and fall back to the
// soonest-not-yet-due items only if the segment has more than 8 total terms
// and neither due nor unseen exhausts the slots.
import type { Card } from 'ts-fsrs'
import type { Segment } from '../../entities/segment/segment'
import { buildVocabKey, getVocabCardsByKeys } from '../../entities/vocab-card/vocabCard'
import { shuffleArray } from '../../dumb/random'

const SET_SIZE = 8

export type VocabEntry = {
  term: string
  translation: string
  key: string
  card: Card | undefined
}

export async function selectVocabSet(youtubeId: string, segment: Segment, now: Date = new Date()): Promise<VocabEntry[]> {
  const terms = Object.entries(segment.vocab)
  const keys = terms.map(([term]) => buildVocabKey(youtubeId, term))
  const cardsByKey = await getVocabCardsByKeys(keys)

  const due: VocabEntry[] = []
  const unseen: VocabEntry[] = []
  const notYetDue: VocabEntry[] = []

  terms.forEach(([term, translation], index) => {
    const key = keys[index]
    const card = cardsByKey.get(key)
    const entry: VocabEntry = { term, translation, key, card }

    if (!card) unseen.push(entry)
    else if (card.due <= now) due.push(entry)
    else notYetDue.push(entry)
  })

  notYetDue.sort((a, b) => a.card!.due.getTime() - b.card!.due.getTime())

  return [...shuffleArray(due), ...shuffleArray(unseen), ...notYetDue].slice(0, SET_SIZE)
}
