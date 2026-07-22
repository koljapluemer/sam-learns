// Ported unchanged from linguanodon's boringwords app/random.js (itself a
// vendored copy of infinitesentences' random.js).

export function pickRandom<T>(items: ReadonlyArray<T>): T | undefined {
  if (!items.length) return undefined
  return items[Math.floor(Math.random() * items.length)]
}

export function shuffleArray<T>(items: ReadonlyArray<T>): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = copy[i]
    copy[i] = copy[j]
    copy[j] = temp
  }
  return copy
}
