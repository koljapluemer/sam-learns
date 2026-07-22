// Port of linguanodon's infinitesentences app/keys.js.

export function buildSentenceKey(nativeIso: string, targetIso: string, index: number): string {
  return `${nativeIso}:${targetIso}:${index}`
}

export function buildPartKey(targetIso: string, content: string): string {
  return `${targetIso}::${content}`
}
