import { computed, onMounted, ref } from 'vue'
import { assignToRow, countWordsAddedToday, graduateWordRow, listUnmemorizedWords } from '../../entities/word/word'
import { graduateWord } from '../../entities/word-card/wordCard'
import { popRandom, shuffleArray } from '../../dumb/random'
import { DAILY_GOAL } from './useAddForm'
import type { WordRow } from '../../db/appDb'

export type MemorizeRow = 1 | 2 | 3 | 4
const ROWS: MemorizeRow[] = [1, 2, 3, 4]
const ROW_SIZE = 3

export function useMemorizeBoard() {
  const loading = ref(true)
  const pool = ref<WordRow[]>([])
  const board = ref<Record<MemorizeRow, WordRow[]>>({ 1: [], 2: [], 3: [], 4: [] })
  const revealed = ref<Record<MemorizeRow, boolean>>({ 1: false, 2: false, 3: false, 4: false })
  const totalNonMemorizedAtStart = ref(0)
  const todayGoalMet = ref(false)

  let nextSeq = 1

  async function persistAssignment(row: WordRow, memorizeRow: MemorizeRow): Promise<void> {
    const seq = nextSeq++
    row.memorizeRow = memorizeRow
    row.memorizeSeq = seq
    await assignToRow(row.id, memorizeRow, seq)
  }

  async function refillBottomRow(): Promise<void> {
    while (board.value[1].length < ROW_SIZE && pool.value.length > 0) {
      const word = popRandom(pool.value)
      if (!word) break
      await persistAssignment(word, 1)
      board.value[1].push(word)
    }
  }

  async function load(): Promise<void> {
    loading.value = true
    const words = await listUnmemorizedWords()
    totalNonMemorizedAtStart.value = words.length

    const onBoard: WordRow[] = []
    const inPool: WordRow[] = []
    let maxSeq = 0
    for (const word of words) {
      if (word.memorizeRow) {
        onBoard.push(word)
        maxSeq = Math.max(maxSeq, word.memorizeSeq ?? 0)
      } else {
        inPool.push(word)
      }
    }
    nextSeq = maxSeq + 1

    const nextBoard: Record<MemorizeRow, WordRow[]> = { 1: [], 2: [], 3: [], 4: [] }
    for (const row of ROWS) {
      nextBoard[row] = onBoard
        .filter((word) => word.memorizeRow === row)
        .sort((a, b) => (a.memorizeSeq ?? 0) - (b.memorizeSeq ?? 0))
    }
    board.value = nextBoard
    pool.value = shuffleArray(inPool)

    await refillBottomRow()
    todayGoalMet.value = (await countWordsAddedToday()) >= DAILY_GOAL
    loading.value = false
  }

  async function score(row: MemorizeRow, correct: boolean): Promise<void> {
    const word = board.value[row][0]
    if (!word) return

    board.value[row].shift()
    revealed.value[row] = false

    if (!correct) {
      await persistAssignment(word, 1)
      board.value[1].push(word)
    } else if (row === 4) {
      await graduateWordRow(word.id)
      await graduateWord(word.id)
    } else {
      const nextRow = (row + 1) as MemorizeRow
      await persistAssignment(word, nextRow)
      board.value[nextRow].push(word)
    }

    await refillBottomRow()
  }

  function reveal(row: MemorizeRow): void {
    revealed.value[row] = true
  }

  const remaining = computed(
    () => pool.value.length + ROWS.reduce((sum, row) => sum + board.value[row].length, 0)
  )
  const clearedCount = computed(() => totalNonMemorizedAtStart.value - remaining.value)

  onMounted(load)

  return { loading, board, revealed, reveal, score, remaining, clearedCount, totalNonMemorizedAtStart, todayGoalMet }
}
