// Ported unchanged from linguanodon's boringwords app/keys.js.

export function buildWordKey(language: string, wordId: number): string {
  return `${language}:${wordId}`
}
