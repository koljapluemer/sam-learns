export type VocabPasteRow = { word: string; translation: string; note: string }

export function buildVocabPrompt(sentence: string, translation: string): string {
  return [
    `Sentence: ${sentence}`,
    `Translation: ${translation}`,
    '',
    'Extract each vocabulary word from the sentence above, with its translation.',
    "Keep \"word\" and \"translation\" to the bare word/phrase - don't add parenthetical",
    'annotations (gender, register, grammar notes, etc.) inside those fields. If a word',
    'genuinely needs that extra context, put it in an optional "note" field instead.',
    'Return ONLY a JSON array, no other text, in this exact format:',
    '[{"word": "...", "translation": "...", "note": "..."}]'
  ].join('\n')
}

export function parseVocabPaste(clipboardText: string): VocabPasteRow[] {
  const jsonMatch = clipboardText.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return []

  try {
    const parsed: unknown = JSON.parse(jsonMatch[0])
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
      .map((entry) => ({
        word: typeof entry.word === 'string' ? entry.word : '',
        translation: typeof entry.translation === 'string' ? entry.translation : '',
        note: typeof entry.note === 'string' ? entry.note : ''
      }))
      .filter((row) => row.word.length > 0)
  } catch {
    return []
  }
}
