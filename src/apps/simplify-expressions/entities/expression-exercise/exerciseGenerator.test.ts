import { describe, expect, it } from 'vitest'
import { generateExercise } from './exerciseGenerator'
import { isEquivalent, parseExpression } from './mathEngine'
import { exerciseTopics } from './exerciseTypes'

describe('generateExercise', () => {
  it.each(exerciseTopics.filter((topic) => topic !== 'challenge-mixed-expressions'))(
    'generates valid exercises for %s',
    (topic) => {
      for (const difficultyBand of [1, 2, 3, 4] as const) {
        const exercise = generateExercise(topic, difficultyBand)

        expect(() => parseExpression(exercise.source)).not.toThrow()
        expect(() => parseExpression(exercise.target)).not.toThrow()
        expect(isEquivalent(exercise.source, exercise.target)).toBe(true)
        expect(exercise.topic).toBe(topic)
        expect(exercise.difficultyBand).toBe(difficultyBand)
        expect(exercise.features.length).toBeGreaterThan(0)
      }
    }
  )

  it('locks challenge exercises to band 5', () => {
    const exercise = generateExercise('challenge-mixed-expressions', 5)

    expect(exercise.difficultyBand).toBe(5)
    expect(exercise.features).toContain('challenge')
  })
})
