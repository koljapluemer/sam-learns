import { describe, expect, it } from 'vitest'
import { generateExercise } from './exerciseGenerator'
import { gradeAnswer } from './exerciseGrader'
import { toDisplayLatex } from './exerciseDisplay'
import type { ExpressionExercise } from './exerciseTypes'

const visuallyCollapsedExercise: ExpressionExercise = {
  id: 'visually-collapsed',
  topic: 'remove-parentheses-with-sign',
  source: '4*z + (5*n + a)',
  target: '4*z + 5*n + a',
  difficultyBand: 1,
  difficultyScore: 8,
  features: ['split-coefficient'],
  seed: 'visual-collapse'
}

function createDeterministicRandomSource(value: number) {
  return {
    next: () => value
  }
}

describe('exercise regressions', () => {
  it('keeps source and target visually distinct in the dedicated display renderer', () => {
    expect(toDisplayLatex(visuallyCollapsedExercise.source)).not.toBe(
      toDisplayLatex(visuallyCollapsedExercise.target)
    )
  })

  it('does not generate a remove-parentheses exercise that already renders as the solved form', () => {
    const exercise = generateExercise(
      'remove-parentheses-with-sign',
      1,
      createDeterministicRandomSource(0)
    )

    expect(toDisplayLatex(exercise.source)).not.toBe(toDisplayLatex(exercise.target))
  })

  it('accepts a solved equivalent answer if a bad exercise slips through', () => {
    expect(gradeAnswer(visuallyCollapsedExercise, 'a+5n+4z')).toEqual({
      isCorrect: true,
      reason: 'correct'
    })
  })
})
