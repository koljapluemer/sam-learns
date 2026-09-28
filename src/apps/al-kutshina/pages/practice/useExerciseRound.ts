import { computed, onUnmounted, ref } from 'vue'
import { logActivity } from '@/shared/activity/useLearningEvent'
import { actionsBetween, applyAction, type Field } from '../../entities/item/interaction'
import { matchesQuestKey, type Item } from '../../entities/item/item'
import { playSound } from '../../dumb/playSound'
import { playTone } from '../../dumb/playTone'
import type { Exercise } from './generateExercise'

export type RoundState = 'waiting' | 'correct' | 'wrong' | 'reveal'
export type CardStatus = 'correct' | 'wrong' | 'solution'

const SUCCESS_SOUND = '/data/al-kutshina/success.mp3'
const CORRECT_DELAY_MS = 900
const WRONG_DELAY_MS = 700
const REVEAL_DELAY_MS = 1600

// One exercise as a small state machine. Any drop that triggers an action
// leaves 'waiting': right if it's the quest's action between the quest's two
// items (correct → done), wrong otherwise (wrong → reveal → done). 'reveal'
// resets the board and highlights the pair the player should have used.
export function useExerciseRound(exercise: Exercise, itemsByImg: Map<string, Item>, onDone: () => void) {
  const fields = ref<Field[]>(freshFields())
  const state = ref<RoundState>('waiting')
  const droppedIds = ref<string[]>([])
  let timer: ReturnType<typeof setTimeout> | undefined
  onUnmounted(() => clearTimeout(timer))

  const statuses = computed<Record<string, CardStatus>>(() => {
    if (state.value === 'correct') return statusOf(droppedIds.value, 'correct')
    if (state.value === 'wrong') return statusOf(droppedIds.value, 'wrong')
    if (state.value === 'reveal') return statusOf(exercise.solution, 'solution')
    return {}
  })

  function freshFields(): Field[] {
    return exercise.fields.map((field) => ({ ...field }))
  }

  function statusOf(ids: string[], status: CardStatus): Record<string, CardStatus> {
    return Object.fromEntries(ids.map((id) => [id, status]))
  }

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

  function after(delayMs: number, next: () => void) {
    timer = setTimeout(next, delayMs)
  }

  function reveal() {
    fields.value = freshFields()
    state.value = 'reveal'
    after(REVEAL_DELAY_MS, onDone)
  }

  function finish(correct: boolean) {
    void logActivity('al-kutshina')
    if (correct) {
      state.value = 'correct'
      playSound(SUCCESS_SOUND, 0.2)
      after(CORRECT_DELAY_MS, onDone)
    } else {
      state.value = 'wrong'
      playTone(160, 250)
      after(WRONG_DELAY_MS, reveal)
    }
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
    droppedIds.value = [senderId, receiverId]
    finish(isQuestSolved(senderItem, receiverItem, action))
  }

  return { fields, state, statuses, drop }
}
