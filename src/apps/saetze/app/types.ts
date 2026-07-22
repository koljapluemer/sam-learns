export interface Lesson {
  key: string
  name: string
  order: number
}

export interface Exercise {
  id: number
  lesson: string
  english: string
  english_credit: string
  cloze: string
  correct_answer: string
  wrong_answer: string
  german_credit: string
}

export type CreditToken = { type: 'link'; text: string; href: string } | { type: 'text'; text: string }
