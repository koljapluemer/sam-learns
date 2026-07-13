export function localize<T extends Record<string, string>>(text: T, locale: keyof T): string {
  return text[locale]
}
