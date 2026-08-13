import { shuffleArray } from './random'

export type HotPoolKind = 'sentence' | 'word'

interface HotPoolItem {
  kind: HotPoolKind
  id: string
}

const MAX_SIZE = 10

let pool: HotPoolItem[] = []

function has(kind: HotPoolKind, id: string): boolean {
  return pool.some((item) => item.kind === kind && item.id === id)
}

export function addToHotPool(kind: HotPoolKind, ids: string[]): void {
  for (const id of ids) {
    if (!has(kind, id)) pool.push({ kind, id })
  }
}

export function removeFromHotPool(kind: HotPoolKind, ids: string[]): void {
  const idSet = new Set(ids)
  pool = pool.filter((item) => !(item.kind === kind && idSet.has(item.id)))
}

export function shuffleAndTrimHotPool(): void {
  pool = shuffleArray(pool).slice(0, MAX_SIZE)
}

export function hotPoolIds(kind: HotPoolKind): Set<string> {
  return new Set(pool.filter((item) => item.kind === kind).map((item) => item.id))
}

export function hasHotPoolItems(): boolean {
  return pool.length > 0
}
