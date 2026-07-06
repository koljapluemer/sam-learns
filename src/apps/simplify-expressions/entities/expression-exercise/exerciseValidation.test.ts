import { describe, expect, it } from 'vitest'
import { isValidExercise, rendersDistinctly, requiresWorkForTopic } from './exerciseValidation'
import type { ExpressionExercise } from './exerciseTypes'

const visuallyCollapsedExercise: ExpressionExercise = {
  id: 'visually-collapsed',
  topic: 'remove-parentheses-with-sign',
  source: '4*z + (5*n + a)',
  target: '4*z + 5*n + a',
  difficultyBand: 1,
  difficultyScore: 8,
  features: ['outer-minus'],
  seed: 'visual-collapse'
}

const validParenthesesExercise: ExpressionExercise = {
  id: 'valid-parentheses',
  topic: 'remove-parentheses-with-sign',
  source: '4*z - (5*n + a)',
  target: '4*z - 5*n - a',
  difficultyBand: 1,
  difficultyScore: 8,
  features: ['outer-minus', 'sign-flip'],
  seed: 'valid-parentheses'
}

describe('exerciseValidation', () => {
  it('renders source and target distinctly for meaningful exercises', () => {
    expect(rendersDistinctly(validParenthesesExercise.source, validParenthesesExercise.target)).toBe(true)
  })

  it('rejects remove-parentheses exercises that only differ by presentation', () => {
    expect(requiresWorkForTopic(visuallyCollapsedExercise)).toBe(false)
    expect(isValidExercise(visuallyCollapsedExercise)).toBe(false)
  })

  it('accepts remove-parentheses exercises with an actual sign change step', () => {
    expect(requiresWorkForTopic(validParenthesesExercise)).toBe(true)
    expect(isValidExercise(validParenthesesExercise)).toBe(true)
  })
})
