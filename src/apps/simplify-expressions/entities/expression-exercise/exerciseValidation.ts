import { isEquivalent, parseExpression } from './mathEngine'
import { toDisplayLatex } from './exerciseDisplay'
import {
  hasLikeTermOpportunities,
  hasMeaningfulParenthesesRemovalOpportunity,
  isSolvedForTopic
} from './exerciseSimplification'
import type { ExpressionExercise } from './exerciseTypes'

export function isValidExercise(exercise: ExpressionExercise): boolean {
  try {
    parseExpression(exercise.source)
    parseExpression(exercise.target)
  } catch {
    return false
  }

  if (!isEquivalent(exercise.source, exercise.target)) {
    return false
  }

  if (!rendersDistinctly(exercise.source, exercise.target)) {
    return false
  }

  if (!requiresWorkForTopic(exercise)) {
    return false
  }

  return isSolvedForTopic(exercise.topic, exercise.target)
}

export function rendersDistinctly(source: string, target: string): boolean {
  return toDisplayLatex(source) !== toDisplayLatex(target)
}

export function requiresWorkForTopic(exercise: ExpressionExercise): boolean {
  if (exercise.topic === 'remove-parentheses-with-sign') {
    return (
      hasMeaningfulParenthesesRemovalOpportunity(exercise.source) &&
      (exercise.source.includes('-(') ||
        exercise.source.includes('- (') ||
        hasLikeTermOpportunities(exercise.target))
    )
  }

  return !isSolvedForTopic(exercise.topic, exercise.source)
}
