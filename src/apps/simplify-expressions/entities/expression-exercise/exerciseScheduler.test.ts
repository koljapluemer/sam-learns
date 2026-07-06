import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createDefaultTopicProgress,
  getUnlockedTopics,
  recordExerciseAttempt,
  selectDifficultyBand,
  updateTopicProgress
} from './exerciseScheduler'
import { listExerciseAttempts, listTopicProgress, resetExerciseRepositoryForTests } from './exerciseRepository'
import type { ExpressionExercise, TopicProgress } from './exerciseTypes'

const baseExercise: ExpressionExercise = {
  id: 'exercise-1',
  topic: 'combine-like-terms',
  source: '2*x + 3*x',
  target: '5*x',
  difficultyBand: 2,
  difficultyScore: 18,
  features: ['split-coefficient'],
  seed: 'seed-1'
}

describe('exerciseScheduler', () => {
  beforeEach(() => {
    resetExerciseRepositoryForTests()
  })

  it('unlocks advanced topics after prerequisite progress is stable', () => {
    const progress = new Map<TopicProgress['topic'], TopicProgress>([
      [
        'combine-like-terms',
        {
          ...createDefaultTopicProgress('combine-like-terms'),
          skillEstimate: 2.6,
          recentAccuracy: 0.8
        }
      ],
      [
        'remove-parentheses-with-sign',
        {
          ...createDefaultTopicProgress('remove-parentheses-with-sign'),
          skillEstimate: 2.6,
          recentAccuracy: 0.8
        }
      ],
      [
        'distribute-monomial-over-sum',
        {
          ...createDefaultTopicProgress('distribute-monomial-over-sum'),
          skillEstimate: 2.7,
          recentAccuracy: 0.85
        }
      ]
    ])

    expect(getUnlockedTopics(progress)).toContain('expand-binomial-times-binomial')
    expect(getUnlockedTopics(progress)).toContain('normalize-product-powers')
  })

  it('selects nearby difficulty most of the time', () => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.95)

    const progress = {
      ...createDefaultTopicProgress('combine-like-terms'),
      skillEstimate: 3
    }

    expect(selectDifficultyBand('combine-like-terms', progress)).toBe(3)
    expect(selectDifficultyBand('combine-like-terms', progress)).toBe(2)
    expect(selectDifficultyBand('combine-like-terms', progress)).toBe(4)
  })

  it('updates progress on a correct answer', () => {
    const previous = createDefaultTopicProgress('combine-like-terms')
    const next = updateTopicProgress(
      previous,
      {
        exercise: baseExercise,
        resultReason: 'correct',
        isCorrect: true,
        latencyMs: 9_000
      },
      new Date('2026-04-21T10:00:00.000Z')
    )

    expect(next.skillEstimate).toBeGreaterThan(previous.skillEstimate)
    expect(next.streak).toBe(1)
    expect(next.recentAccuracy).toBeGreaterThan(previous.recentAccuracy)
  })

  it('persists attempt and topic progress deterministically', async () => {
    await recordExerciseAttempt({
      exercise: baseExercise,
      answer: '5x',
      resultReason: 'correct',
      isCorrect: true,
      latencyMs: 12_000
    })

    const attempts = await listExerciseAttempts()
    const progress = await listTopicProgress()

    expect(attempts).toHaveLength(1)
    expect(attempts[0]?.topic).toBe('combine-like-terms')
    expect(progress).toHaveLength(1)
    expect(progress[0]?.topic).toBe('combine-like-terms')
  })
})
