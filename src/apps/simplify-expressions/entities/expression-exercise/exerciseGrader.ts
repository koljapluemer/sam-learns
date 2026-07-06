import type { ExpressionExercise, GradeResult } from './exerciseTypes'
import { expressionComplexity, isEquivalent, parseExpression } from './mathEngine'
import { isSolvedForTopic } from './exerciseSimplification'

const targetTolerance = 2

export function gradeAnswer(exercise: ExpressionExercise, answer: string): GradeResult {
  if (answer.trim().length === 0) {
    return { isCorrect: false, reason: 'empty' }
  }

  if (!canParse(answer)) {
    return { isCorrect: false, reason: 'parseError' }
  }

  if (!isEquivalent(exercise.source, answer)) {
    return { isCorrect: false, reason: 'notEquivalent' }
  }

  if (isSolvedForTopic(exercise.topic, answer) && isSimpleEnough(exercise, answer)) {
    return { isCorrect: true, reason: 'correct' }
  }

  if (isCopiedOrUnchanged(exercise, answer)) {
    return { isCorrect: false, reason: 'copied' }
  }

  if (!isSimpleEnough(exercise, answer)) {
    return { isCorrect: false, reason: 'tooComplex' }
  }

  return { isCorrect: true, reason: 'correct' }
}

function canParse(expression: string): boolean {
  try {
    parseExpression(expression)
    return true
  } catch {
    return false
  }
}

function isCopiedOrUnchanged(exercise: ExpressionExercise, answer: string): boolean {
  try {
    return parseExpression(exercise.source).isSame(parseExpression(answer))
  } catch {
    return false
  }
}

function isSimpleEnough(exercise: ExpressionExercise, answer: string): boolean {
  const answerScore = expressionComplexity(answer)
  const targetScore = expressionComplexity(exercise.target)

  return answerScore <= targetScore + targetTolerance
}
