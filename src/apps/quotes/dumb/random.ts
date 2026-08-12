export function pickRandom<T>(items: ReadonlyArray<T>): T | undefined {
  if (!items.length) return undefined
  return items[Math.floor(Math.random() * items.length)]
}
