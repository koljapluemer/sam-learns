import { mandarinPack } from './mandarin'
import type { LanguagePack } from './types'
import { vietPack } from './viet'

export const TONE_LANGUAGES: LanguagePack[] = [vietPack, mandarinPack]

export function getLanguage(code: string): LanguagePack | undefined {
  return TONE_LANGUAGES.find((pack) => pack.code === code)
}

export function listLanguageOptions(): { code: string; name: string }[] {
  return TONE_LANGUAGES.map((pack) => ({ code: pack.code, name: pack.name }))
}
