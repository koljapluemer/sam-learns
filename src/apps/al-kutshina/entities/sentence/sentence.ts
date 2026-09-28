// Reads the per-language instruction sentences from public/data/al-kutshina/.
// Every sentence is keyed by its quest, `<sender>-<action>-<receiver>`, where
// sender/receiver are item quest keys (e.g. "cat_food-feed-cat__color__brown").
import { loadJson } from '../../dumb/loadJson'

const DATA_URL = '/data/al-kutshina'

export type Language = { code: string; name: string }
export type Quest = { sender: string; action: string; receiver: string }

let languagesPromise: Promise<Language[]> | null = null

export function getLanguages(): Promise<Language[]> {
  languagesPromise ??= loadJson<Record<string, string>>(`${DATA_URL}/languages.json`).then((record) =>
    Object.entries(record).map(([code, name]) => ({ code, name }))
  )
  return languagesPromise
}

export function getSentences(languageCode: string): Promise<Record<string, string>> {
  return loadJson<Record<string, string>>(`${DATA_URL}/sentences/${languageCode}.json`)
}

export function audioUrl(languageCode: string, questKey: string): string {
  return `${DATA_URL}/audio/${languageCode}/${questKey}.mp3`
}

export function parseQuest(questKey: string): Quest | undefined {
  const [sender, action, receiver] = questKey.split('-')
  return sender && action && receiver ? { sender, action, receiver } : undefined
}
