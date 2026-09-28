// Reads the static item catalog from public/data/al-kutshina/items.json.
// An item's capabilities are actions it can do to another item, its
// affordances are actions that can be done to it; a matching action name
// makes the two items interact.
import { loadJson } from '../../dumb/loadJson'

const DATA_URL = '/data/al-kutshina'

// What happens to the sender (capability) or receiver (affordance) card after
// an action. Numeric because that's how items.json stores them.
export const Reaction = {
  Disappear: 0,
  DoNothing: 1,
  ChangeTo: 2,
  AddImage: 3
} as const

// [action, reaction, target img for ChangeTo]
export type ActionInfo = [string, number, string?]

export type Item = {
  key: string
  img: string
  props: Record<string, string>
  capabilities: ActionInfo[]
  affordances: ActionInfo[]
}

export function getItems(): Promise<Item[]> {
  return loadJson<Item[]>(`${DATA_URL}/items.json`)
}

export function imageUrl(img: string): string {
  return `${DATA_URL}/images/${img}.webp`
}

// All keys a quest may use to refer to this item: its bare key ("car") plus
// one per property ("car__color__red").
export function questKeysOf(item: Item): string[] {
  return [item.key, ...Object.entries(item.props).map(([prop, value]) => `${item.key}__${prop}__${value}`)]
}

export function matchesQuestKey(item: Item, questKey: string): boolean {
  return questKeysOf(item).includes(questKey)
}

export function canDo(item: Item, action: string): boolean {
  return item.capabilities.some(([name]) => name === action)
}

export function canReceive(item: Item, action: string): boolean {
  return item.affordances.some(([name]) => name === action)
}
