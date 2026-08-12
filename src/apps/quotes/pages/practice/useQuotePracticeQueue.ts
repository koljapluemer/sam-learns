import type { Card } from 'ts-fsrs'
import { listQuotes, type QuoteRow } from '../../entities/quote/quote'
import { getAllClozeCards } from '../../entities/quote-cloze-card/quoteClozeCard'
import { clozeLevelCount } from '../../dumb/cloze'
import { pickRandom } from '../../dumb/random'

export type ClozeCandidate = { quote: QuoteRow; level: number; card: Card | undefined }

type Frontier = { level: number; status: 'due' | 'unseen'; card: Card | undefined }

// Prefer showing due, previously-seen cards 5/6 of the time; unseen cards 1/6.
const DUE_PREFERENCE = 5 / 6

// Which quotes have already had a card practiced this session - session-only,
// never persisted, reset when the page reloads. Used to spread practice
// across quotes rather than favoring the same few repeatedly.
const sessionTouchedQuoteIds = new Set<string>()

// The quote shown by the previous pick - excluded from the next pick outright
// so the same quote never comes up twice in a row, unless it's the only quote
// with anything to show at all.
let lastShownQuoteId: string | null = null

function excludeQuote(candidates: ClozeCandidate[], quoteId: string | null): ClozeCandidate[] {
  return quoteId ? candidates.filter((candidate) => candidate.quote.id !== quoteId) : candidates
}

function findFrontier(quote: QuoteRow, cardsByLevel: Map<number, Card>, now: Date): Frontier | null {
  const levelCount = clozeLevelCount(quote.content)
  for (let level = 1; level <= levelCount; level++) {
    const card = cardsByLevel.get(level)
    if (!card) return { level, status: 'unseen', card: undefined }
    if (card.due <= now) return { level, status: 'due', card }
  }
  return null
}

export async function pickNextCandidate(): Promise<ClozeCandidate | null> {
  const [quotes, cards] = await Promise.all([listQuotes(), getAllClozeCards()])

  const cardsByQuote = new Map<string, Map<number, Card>>()
  for (const { quoteId, level, card } of cards) {
    if (!cardsByQuote.has(quoteId)) cardsByQuote.set(quoteId, new Map())
    cardsByQuote.get(quoteId)?.set(level, card)
  }

  const now = new Date()
  const due: ClozeCandidate[] = []
  const unseen: ClozeCandidate[] = []

  for (const quote of quotes) {
    const frontier = findFrontier(quote, cardsByQuote.get(quote.id) ?? new Map(), now)
    if (!frontier) continue
    const candidate: ClozeCandidate = { quote, level: frontier.level, card: frontier.card }
    if (frontier.status === 'due') due.push(candidate)
    else unseen.push(candidate)
  }

  // Never repeat the previous quote back-to-back, unless it's the only one
  // with anything eligible right now (in which case there's no other choice).
  const dueWithoutLastShown = excludeQuote(due, lastShownQuoteId)
  const unseenWithoutLastShown = excludeQuote(unseen, lastShownQuoteId)
  const canAvoidRepeat = dueWithoutLastShown.length > 0 || unseenWithoutLastShown.length > 0
  const dueForPick = canAvoidRepeat ? dueWithoutLastShown : due
  const unseenForPick = canAvoidRepeat ? unseenWithoutLastShown : unseen

  const preferDue = Math.random() < DUE_PREFERENCE
  let pool = preferDue ? dueForPick : unseenForPick
  if (pool.length === 0) pool = preferDue ? unseenForPick : dueForPick
  if (pool.length === 0) return null

  const untouched = pool.filter((candidate) => !sessionTouchedQuoteIds.has(candidate.quote.id))
  const chosen = pickRandom(untouched.length > 0 ? untouched : pool) ?? null
  if (chosen) lastShownQuoteId = chosen.quote.id
  return chosen
}

export function markQuoteTouched(quoteId: string): void {
  sessionTouchedQuoteIds.add(quoteId)
}
