import { matchesQuestKey, type Item } from '../../entities/item/item'
import type { Quest } from '../../entities/sentence/sentence'
import { takeRandom } from '../../dumb/random'

const MAX_DISTRACTORS = 3

// "Narrow" distractors make a property-based quest key ("car__color__red")
// actually hard: same item with another value (green car), or another item
// with the same value (red suitcase).
function isNarrowDistractor(item: Item, questKey: string): boolean {
  const [key, prop, value] = questKey.split('__')
  if (!prop) return false
  const itemValue = item.props[prop]
  return (item.key === key && itemValue !== undefined && itemValue !== value) || (item.key !== key && itemValue === value)
}

// Wrong cards for the board: never one the quest could also refer to, never a
// duplicate image. Up to three, narrow ones first.
export function pickDistractors(items: Item[], quest: Quest, picked: Item[]): Item[] {
  const usedImgs = new Set(picked.map((item) => item.img))
  const candidates = items.filter(
    (item) => !usedImgs.has(item.img) && !matchesQuestKey(item, quest.sender) && !matchesQuestKey(item, quest.receiver)
  )
  const isNarrow = (item: Item) => isNarrowDistractor(item, quest.sender) || isNarrowDistractor(item, quest.receiver)
  const ordered = [
    ...takeRandom(candidates.filter(isNarrow), candidates.length),
    ...takeRandom(candidates.filter((item) => !isNarrow(item)), candidates.length)
  ]

  const count = Math.floor(Math.random() * (MAX_DISTRACTORS + 1))
  const distractors: Item[] = []
  for (const item of ordered) {
    if (distractors.length >= count) break
    if (usedImgs.has(item.img)) continue
    usedImgs.add(item.img)
    distractors.push(item)
  }
  return distractors
}
