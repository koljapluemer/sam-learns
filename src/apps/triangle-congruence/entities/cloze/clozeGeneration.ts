import { clozeTemplates } from './clozeTemplateData'
import type { ClozeTemplateData } from './clozeTypes'
import type { TriangleTheorem } from '../triangle/triangleTypes'

const PUNCTUATION_CHARS = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'

function stripPunctuation(value: string): string {
  let start = 0
  let end = value.length
  while (start < end && PUNCTUATION_CHARS.includes(value[start])) {
    start += 1
  }
  while (end > start && PUNCTUATION_CHARS.includes(value[end - 1])) {
    end -= 1
  }
  return value.slice(start, end)
}

export function getGapWord(template: ClozeTemplateData, gapIndex: number): string {
  const words = template.content.trim().split(/\s+/)
  if (gapIndex >= words.length) {
    throw new Error(`Gap index ${gapIndex} is out of range for template "${template.content}"`)
  }
  return words[gapIndex]
}

export function generateClozeExercise(
  templateContent: string,
  correctAnswerWithPunctuation: string
): { template: string; answer: string } {
  if (!templateContent.includes(correctAnswerWithPunctuation)) {
    throw new Error('Correct answer string must be present in template string')
  }

  const strippedAnswer = stripPunctuation(correctAnswerWithPunctuation)
  const modifiedTemplate = templateContent.replace(correctAnswerWithPunctuation, '___')

  return { template: modifiedTemplate, answer: strippedAnswer }
}

export function pickDueGapIndex(possibleGapIndices: number[]): number {
  if (possibleGapIndices.length === 0) {
    return 0
  }
  return possibleGapIndices[Math.floor(Math.random() * possibleGapIndices.length)]
}

export function pickRandomClozeTemplateForTopic(
  topicId: TriangleTheorem,
  templates: ClozeTemplateData[] = clozeTemplates
): ClozeTemplateData | undefined {
  const matches = templates.filter((template) => template.topicId === topicId)
  if (matches.length === 0) {
    return undefined
  }
  return matches[Math.floor(Math.random() * matches.length)]
}
