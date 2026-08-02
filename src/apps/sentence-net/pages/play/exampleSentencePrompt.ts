export type SentencePasteRow = { sentence: string; translation: string; note: string }

export function buildExampleSentencesPrompt(word: string, translation: string, language = ''): string {
  return [
    `Word: ${word}`,
    `Translation: ${translation}`,
    ...(language.trim() ? [`Language: ${language.trim()}`] : []),
    '',
    "Give 3 example sentences in the word's language that use this word, each with its translation.",
    "Keep \"sentence\" and \"translation\" to the plain text - don't add parenthetical",
    'annotations (context notes, alternate readings, etc.) inside those fields. If a',
    'sentence genuinely needs that extra context, put it in an optional "note" field instead.',
    'Return ONLY a JSON array, no other text, in this exact format:',
    '[{"sentence": "...", "translation": "...", "note": "..."}]'
  ].join('\n')
}

export function parseExampleSentencesPaste(clipboardText: string): SentencePasteRow[] {
  const jsonMatch = clipboardText.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return []

  try {
    const parsed: unknown = JSON.parse(jsonMatch[0])
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
      .map((entry) => ({
        sentence: typeof entry.sentence === 'string' ? entry.sentence : '',
        translation: typeof entry.translation === 'string' ? entry.translation : '',
        note: typeof entry.note === 'string' ? entry.note : ''
      }))
      .filter((row) => row.sentence.length > 0)
  } catch {
    return []
  }
}
