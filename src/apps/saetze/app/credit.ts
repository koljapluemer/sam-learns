// Ported unchanged from linguanodon's saetze app/credit.js - splits a
// "[text](url) rest of the string" markdown-link attribution into text/link
// tokens so the template can render real <a> elements via v-for instead of
// v-html, avoiding any HTML-injection risk from the imported credit strings.

import type { CreditToken } from './types'

const LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g

export function tokenizeCredit(markdown: string): CreditToken[] {
  if (!markdown) return []

  const tokens: CreditToken[] = []
  let lastIndex = 0

  for (const match of markdown.matchAll(LINK_PATTERN)) {
    const [fullMatch, text, href] = match
    const matchIndex = match.index ?? 0

    if (matchIndex > lastIndex) {
      tokens.push({ type: 'text', text: markdown.slice(lastIndex, matchIndex) })
    }
    tokens.push({ type: 'link', text, href })
    lastIndex = matchIndex + fullMatch.length
  }

  if (lastIndex < markdown.length) {
    tokens.push({ type: 'text', text: markdown.slice(lastIndex) })
  }

  return tokens
}
