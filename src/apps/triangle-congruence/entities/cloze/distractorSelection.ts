import { distractorWords } from './clozeTemplateData'

const UPPERCASE_START = /^[A-ZÄÖÜ]/
const LOWERCASE_START = /^[a-zäöüß]/

export function getUppercaseDistractors(words: string[] = distractorWords): string[] {
  return words.filter((word) => UPPERCASE_START.test(word))
}

export function getLowercaseDistractors(words: string[] = distractorWords): string[] {
  return words.filter((word) => LOWERCASE_START.test(word))
}

export function pickRelevantDistractor(correctAnswer: string, allDistractors: string[] = distractorWords): string | null {
  const isUppercase = correctAnswer.length > 0 && UPPERCASE_START.test(correctAnswer)

  const pool = (isUppercase ? getUppercaseDistractors(allDistractors) : getLowercaseDistractors(allDistractors)).filter(
    (word) => word !== correctAnswer
  )

  if (pool.length === 0) {
    return null
  }

  return pool[Math.floor(Math.random() * pool.length)]
}
