import type { TriangleTheorem } from '../triangle/triangleTypes'

export type ClozeTemplateData = {
  topicId: TriangleTheorem
  content: string
  possibleGapIndices: number[]
}

export type ClozeExerciseMode = 'multiple-choice' | 'freetext'

export type ClozeExercise = {
  topicId: TriangleTheorem
  gapIndex: number
  clozeText: string
  correctAnswer: string
  mode: ClozeExerciseMode
  options?: string[]
}
