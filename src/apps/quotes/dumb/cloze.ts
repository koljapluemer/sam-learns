export const CLOZE_MARK = '＿'

export function splitWords(content: string): string[] {
  return content.trim().split(/\s+/).filter((word) => word.length > 0)
}

export function clozeLevelCount(content: string): number {
  return splitWords(content).length
}

export function buildClozeFront(content: string, level: number): string {
  const { visible } = buildClozeParts(content, level)
  return visible ? `${visible} ${CLOZE_MARK}` : CLOZE_MARK
}

export function buildClozeParts(content: string, level: number): { visible: string; clozed: string } {
  const words = splitWords(content)
  const visibleCount = Math.max(words.length - level, 0)
  return {
    visible: words.slice(0, visibleCount).join(' '),
    clozed: words.slice(visibleCount).join(' ')
  }
}
