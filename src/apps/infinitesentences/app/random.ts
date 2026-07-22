// Port of linguanodon's infinitesentences app/random.js.

export function pickRandom<T>(items: readonly T[]): T | undefined {
  if (!items.length) return undefined
  return items[Math.floor(Math.random() * items.length)]
}

export function shuffleArray<T>(items: readonly T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function takeRandom<T>(items: readonly T[], count: number): T[] {
  if (count <= 0) return []
  return shuffleArray(items).slice(0, count)
}
