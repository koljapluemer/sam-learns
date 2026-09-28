import { canDo, canReceive, matchesQuestKey, type Item } from '../../entities/item/item'
import type { Field } from '../../entities/item/interaction'
import { parseQuest, type Quest } from '../../entities/sentence/sentence'
import { pickRandom, takeRandom } from '../../dumb/random'
import { pickDistractors } from './pickDistractors'

export type Exercise = { id: string; questKey: string; quest: Quest; fields: Field[] }

const MAX_ATTEMPTS = 20

function toField(item: Item): Field {
  return { id: crypto.randomUUID(), img: item.img }
}

function buildExercise(items: Item[], questKey: string): Exercise | undefined {
  const quest = parseQuest(questKey)
  if (!quest) return undefined
  const sender = pickRandom(items.filter((item) => matchesQuestKey(item, quest.sender) && canDo(item, quest.action)))
  const receiver = pickRandom(
    items.filter((item) => item !== sender && matchesQuestKey(item, quest.receiver) && canReceive(item, quest.action))
  )
  if (!sender || !receiver) return undefined

  const cards = [sender, receiver, ...pickDistractors(items, quest, [sender, receiver])]
  return { id: crypto.randomUUID(), questKey, quest, fields: takeRandom(cards, cards.length).map(toField) }
}

// Starts from a sentence rather than from random items, so every exercise has
// a translation (and recording) in the chosen language.
export function generateExercise(items: Item[], questKeys: string[]): Exercise | undefined {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const questKey = pickRandom(questKeys)
    const exercise = questKey ? buildExercise(items, questKey) : undefined
    if (exercise) return exercise
  }
  return undefined
}
