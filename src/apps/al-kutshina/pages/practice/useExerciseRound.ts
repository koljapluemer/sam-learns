import { onUnmounted, ref } from 'vue'
import { logActivity } from '@/shared/activity/useLearningEvent'
import { actionsBetween, applyAction, type Field } from '../../entities/item/interaction'
import { matchesQuestKey, type Item } from '../../entities/item/item'
import { playSound } from '../../dumb/playSound'
import type { Exercise } from './generateExercise'

export type RoundState = 'waiting' | 'correct' | 'wrong'

const SUCCESS_SOUND = '/data/al-kutshina/success.mp3'
const NEXT_DELAY_MS = 800

// One exercise: the board's cards and whether the player got it. Any drop
// that triggers an action ends the round - right if it's the quest's action
// between the quest's two items, wrong otherwise.
export function useExerciseRound(exercise: Exercise, itemsByImg: Map<string, Item>, onDone: () => void) {
  const fields = ref<Field[]>(exercise.fields.map((field) => ({ ...field })))
  const state = ref<RoundState>('waiting')
  let doneTimer: ReturnType<typeof setTimeout> | undefined
  onUnmounted(() => clearTimeout(doneTimer))

  function isQuestSolved(senderItem: Item, receiverItem: Item, action: string): boolean {
    const { quest } = exercise
    return (
      action === quest.action &&
      matchesQuestKey(senderItem, quest.sender) &&
      matchesQuestKey(receiverItem, quest.receiver)
    )
  }

  function replaceField(field: Field) {
    fields.value = fields.value.map((existing) => (existing.id === field.id ? field : existing))
  }

  function finish(correct: boolean) {
    state.value = correct ? 'correct' : 'wrong'
    if (correct) playSound(SUCCESS_SOUND, 0.2)
    void logActivity('al-kutshina')
    doneTimer = setTimeout(onDone, NEXT_DELAY_MS)
  }

  function drop(senderId: string, receiverId: string) {
    if (state.value !== 'waiting') return
    const sender = fields.value.find((field) => field.id === senderId)
    const receiver = fields.value.find((field) => field.id === receiverId)
    const senderItem = sender && itemsByImg.get(sender.img)
    const receiverItem = receiver && itemsByImg.get(receiver.img)
    if (!sender || !receiver || !senderItem || !receiverItem) return

    const [action] = actionsBetween(senderItem, receiverItem)
    if (!action) return

    const result = applyAction(sender, receiver, senderItem, receiverItem, action)
    replaceField(result.sender)
    replaceField(result.receiver)
    finish(isQuestSolved(senderItem, receiverItem, action))
  }

  return { fields, state, drop }
}
