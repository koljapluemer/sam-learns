import { canDo, canReceive, matchesQuestKey, type Item } from '../../entities/item/item'
import type { Field } from '../../entities/item/interaction'
import { parseQuest, type Quest } from '../../entities/sentence/sentence'
import { pickRandom, takeRandom } from '../../dumb/random'
import { pickDistractors } from './pickDistractors'

// `solution` holds the field ids of the quest's sender and receiver.
export type Exercise = { id: string; questKey: string; quest: Quest; fields: Field[]; solution: string[] }

const MAX_ATTEMPTS = 20
// Fixed board size (sender, receiver, up to three distractors, rest empty),
// so the board's layout never changes between rounds.
const BOARD_SIZE = 6

function toField(item: Item): Field {
  return { id: crypto.randomUUID(), img: item.img }
}

function emptyField(): Field {
  return { id: crypto.randomUUID(), img: '' }
}

function buildExercise(items: Item[], questKey: string): Exercise | undefined {
  const quest = parseQuest(questKey)
  if (!quest) return undefined
  const sender = pickRandom(items.filter((item) => matchesQuestKey(item, quest.sender) && canDo(item, quest.action)))
  const receiver = pickRandom(
    items.filter((item) => item !== sender && matchesQuestKey(item, quest.receiver) && canReceive(item, quest.action))
  )
  if (!sender || !receiver) return undefined

  const senderField = toField(sender)
  const receiverField = toField(receiver)
  const cards = [senderField, receiverField, ...pickDistractors(items, quest, [sender, receiver]).map(toField)]
  const fields = [...cards, ...Array.from({ length: BOARD_SIZE - cards.length }, emptyField)]
  return {
    id: crypto.randomUUID(),
    questKey,
    quest,
    fields: takeRandom(fields, fields.length),
    solution: [senderField.id, receiverField.id]
  }
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
