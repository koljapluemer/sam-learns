import { generateClozeExercise, getGapWord } from './clozeGeneration'
import { pickRelevantDistractor } from './distractorSelection'
import type { ClozeExercise, ClozeTemplateData } from './clozeTypes'
import { shuffleArray } from '../../dumb/random'

const FREETEXT_UPGRADE_STREAK_THRESHOLD = 3

export function buildClozeExercise(template: ClozeTemplateData, gapIndex: number, gapStreak: number, noDistractorFallback: string): ClozeExercise {
  const gapWord = getGapWord(template, gapIndex)
  const { template: clozeText, answer: correctAnswer } = generateClozeExercise(template.content, gapWord)

  const mode = gapStreak >= FREETEXT_UPGRADE_STREAK_THRESHOLD ? 'freetext' : 'multiple-choice'

  if (mode === 'freetext') {
    return { topicId: template.topicId, gapIndex, clozeText, correctAnswer, mode }
  }

  const distractor = pickRelevantDistractor(correctAnswer) ?? noDistractorFallback
  const options = shuffleArray([correctAnswer, distractor])

  return { topicId: template.topicId, gapIndex, clozeText, correctAnswer, mode, options }
}
