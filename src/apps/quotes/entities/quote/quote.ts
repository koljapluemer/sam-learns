import { appDb, type QuoteRow } from '../../db/appDb'

export async function addQuote(content: string, attribution: string): Promise<QuoteRow> {
  const row: QuoteRow = {
    id: crypto.randomUUID(),
    content,
    attribution,
    createdAt: new Date().toISOString()
  }
  await appDb.quotes.add(row)
  return row
}

export async function updateQuote(id: string, content: string, attribution: string): Promise<void> {
  const existing = await appDb.quotes.get(id)
  if (!existing) return

  await appDb.quotes.update(id, { content, attribution })

  if (existing.content !== content) {
    await appDb.quoteClozeCards.where('quoteId').equals(id).delete()
  }
}

export async function deleteQuote(id: string): Promise<void> {
  await appDb.quotes.delete(id)
  await appDb.quoteClozeCards.where('quoteId').equals(id).delete()
}

export async function getQuote(id: string): Promise<QuoteRow | undefined> {
  return appDb.quotes.get(id)
}

export async function listQuotes(): Promise<QuoteRow[]> {
  return appDb.quotes.toArray()
}
