export function pickRandom<T>(items: readonly [T, ...T[]]): T
export function pickRandom<T>(items: readonly T[]): T | undefined
export function pickRandom<T>(items: readonly T[]): T | undefined {
  if (!items.length) return undefined
  const index = Math.floor(Math.random() * items.length)
  return items[index]
}

export const shuffleArray = <T>(items: readonly T[]): T[] => {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = copy[i] as T
    copy[i] = copy[j] as T
    copy[j] = temp
  }
  return copy
}

export const takeRandom = <T>(items: readonly T[], count: number): T[] => {
  if (count <= 0) return []
  return shuffleArray(items).slice(0, count)
}
