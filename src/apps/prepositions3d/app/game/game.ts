// Ported from linguanodon's prepositions3d app/game/game.js. No accounts/
// sync in this repo - queueEvent/queueState/mergeRemoteLearningEvents are
// dropped; local completion state stays in localStorage exactly as the
// original tracked it (this app has no per-item Dexie state, just a flat
// completed-gloss-keys log), and each completed task also logs to this
// repo's shared cross-app activity log via logActivity.
import { logActivity } from '@/shared/activity/useLearningEvent'
import { getGlossKeysWithLanguage, getGlossPrompt, type GlossPrompt } from '../language/glossary'
import { FeedbackAudio } from '../ui/feedback-audio'
import type { GameState, GlossKey, InteractionMode, LanguageCode, TaskExecutionMode, Zone, ZoneId } from '../types'

const CORRECT_FEEDBACK_MS = 1500
const LEARNING_EVENTS_STORAGE_KEY = 'prepositions3d:learning-events'
const PLAY_SESSION_INDEX_STORAGE_KEY = 'prepositions3d:play-session-index'

type StoredLearningEvent = {
  glossKey: GlossKey
  playSessionIndex: number
  taskIndexInPlaySession: number
  executionMode: TaskExecutionMode
  taskStartedInteractionMode: InteractionMode
  completedInteractionMode: InteractionMode
  taskStartedAt: string
  completedAt: string
  timeOnTaskMs: number
  audioReplayCount: number
  triesUntilCorrect: number
  language: LanguageCode
  task: GlossKey
  taskText: string
  correctTargetId: ZoneId
  correctTargetIds: ZoneId[]
  movedTargetIds: ZoneId[]
  wrongTargetIds: ZoneId[]
  unlockedTargetIds: ZoneId[]
  unlockedTaskIds: GlossKey[]
  wasPreviouslyCompleted: boolean
  hadAudio: boolean
}

type ActiveLearningTask = {
  glossKey: GlossKey
  prompt: GlossPrompt
  taskIndexInPlaySession: number
  startedAt: string
  startedAtMs: number
  audioReplayCount: number
  movedTargetIds: ZoneId[]
  unlockedTargetIds: ZoneId[]
  unlockedTaskIds: GlossKey[]
  wasPreviouslyCompleted: boolean
  startedInteractionMode: InteractionMode
}

type PendingFeedback =
  | { kind: 'correct'; sessionId: number; mugEl: any; remainingMs: number }
  | { kind: 'wrong'; sessionId: number; remainingMs: number }

export type GameUI = {
  setInstruction(prompt: GlossPrompt): void
  showFeedback(text: string, type: 'success' | 'error'): void
}

function isStoredLearningEvent(event: unknown): event is StoredLearningEvent {
  return (
    typeof event === 'object' &&
    event !== null &&
    typeof (event as any).glossKey === 'string' &&
    typeof (event as any).language === 'string' &&
    typeof (event as any).completedAt === 'string'
  )
}

export class Game {
  state: GameState = 'idle'
  target: GlossKey = ''
  unlockedZoneIds = new Set<ZoneId>()
  completedGlossKeys = new Set<GlossKey>()
  pendingFeedback: PendingFeedback | null = null
  sessionId = 0
  playSessionIndex = 0
  taskIndexInPlaySession = 0
  currentTask: ActiveLearningTask | null = null

  private ui: GameUI
  private sceneEl: any
  private zones: Zone[]
  private zonesById: Map<ZoneId, Zone>
  private language: LanguageCode
  private feedbackAudio: FeedbackAudio

  constructor(opts: { ui: GameUI; sceneEl: any; zones: Zone[]; language: LanguageCode; soundBaseUrl: string }) {
    this.ui = opts.ui
    this.sceneEl = opts.sceneEl
    this.zones = opts.zones
    this.zonesById = new Map(this.zones.map((zone) => [zone.key, zone]))
    this.language = opts.language
    this.feedbackAudio = new FeedbackAudio(opts.soundBaseUrl)
    this.completedGlossKeys = this.loadCompletedGlossKeys()

    opts.sceneEl.addEventListener('drag-end', (e: CustomEvent) => {
      const { el, hoveredZoneEl } = e.detail
      if (!hoveredZoneEl) {
        el.components.draggable.snapBack()
        return
      }
      const zoneComponent = hoveredZoneEl.components['drop-zone']
      if (!zoneComponent) {
        el.components.draggable.snapBack()
        return
      }
      this.handleDrop(zoneComponent.data.label, el)
    })

    this.setMugInteractionEnabled(false)
  }

  startRound(): void {
    if (this.state === 'idle') {
      this.sessionId += 1
      this.playSessionIndex = this.nextPlaySessionIndex()
      this.taskIndexInPlaySession = 0
    }
    this.clearFeedbackTimer()
    this.state = 'playing'
    if (this.unlockedZoneIds.size === 0) {
      this.unlockRandomZone()
    }
    this.syncUnlockedZones()
    this.target = this.pickTaskFromUnlockedZones()
    const prompt = getGlossPrompt(this.target, this.language)
    this.currentTask = this.createActiveTask(this.target, prompt)
    this.ui.setInstruction(prompt)
    this.setMugInteractionEnabled(true)
  }

  exitGame(): void {
    this.sessionId += 1
    this.clearFeedbackTimer()
    this.state = 'idle'
    this.target = ''
    this.currentTask = null
    this.unlockedZoneIds.clear()
    this.setMugInteractionEnabled(false)
    this.syncUnlockedZones()
    this.resetMug()
  }

  setLanguage(language: LanguageCode): void {
    this.language = language
    if (this.state !== 'idle') this.startRound()
  }

  tick(_time: number, delta: number): void {
    if (!this.pendingFeedback) return
    this.pendingFeedback.remainingMs -= delta
    if (this.pendingFeedback.remainingMs > 0) return

    const pending = this.pendingFeedback
    this.pendingFeedback = null
    if (this.sessionId !== pending.sessionId || this.state === 'idle') return

    if (pending.kind === 'correct') {
      pending.mugEl.components.draggable.resetToStartWithFade(() => {
        if (this.sessionId !== pending.sessionId || this.state === 'idle') return
        if (this.allUnlockedTasksCompleted()) {
          this.unlockRandomZone()
        }
        this.startRound()
      })
      return
    }

    this.state = 'playing'
    this.setMugInteractionEnabled(true)
  }

  recordAudioReplay(): void {
    if (!this.currentTask) return
    this.currentTask.audioReplayCount += 1
  }

  handleDrop(zoneId: ZoneId, mugEl: any): void {
    if (this.state !== 'playing') return
    this.state = 'feedback'
    this.setMugInteractionEnabled(false)
    this.currentTask?.movedTargetIds.push(zoneId)

    const zone = this.zonesById.get(zoneId)
    if (zone?.glossKeys.includes(this.target)) {
      this.recordLearningEvent(zoneId)
      this.feedbackAudio.play('success')
      this.ui.showFeedback('Correct!', 'success')
      this.pendingFeedback = {
        kind: 'correct',
        sessionId: this.sessionId,
        mugEl,
        remainingMs: CORRECT_FEEDBACK_MS
      }
    } else {
      this.feedbackAudio.play('error')
      this.ui.showFeedback('Try again!', 'error')
      mugEl.components.draggable.snapBack()
      this.pendingFeedback = {
        kind: 'wrong',
        sessionId: this.sessionId,
        remainingMs: 1000
      }
    }
  }

  clearFeedbackTimer(): void {
    this.pendingFeedback = null
  }

  resetMug(): void {
    const mugEl = this.sceneEl.querySelector('#mug')
    mugEl?.components.draggable.resetToStartWithFade()
  }

  setMugInteractionEnabled(enabled: boolean): void {
    const mugEl = this.sceneEl.querySelector('#mug')
    mugEl?.components.draggable.setInteractionEnabled(enabled)
  }

  pickTaskFromUnlockedZones(): GlossKey {
    const candidates = this.getUnlockedCandidateGlossKeys()
    if (candidates.length === 0) {
      throw new Error(`No unlocked zones have gloss data for language "${this.language}".`)
    }

    const uncompletedCandidates = candidates.filter((glossKey) => !this.completedGlossKeys.has(glossKey))
    const shouldPreferUncompleted = Math.random() < 0.5 && uncompletedCandidates.length > 0
    const preferredCandidates = shouldPreferUncompleted ? uncompletedCandidates : candidates
    const nonRepeatingCandidates = preferredCandidates.filter((glossKey) => glossKey !== this.target)
    const taskCandidates = this.target && nonRepeatingCandidates.length > 0 ? nonRepeatingCandidates : preferredCandidates
    return taskCandidates[Math.floor(Math.random() * taskCandidates.length)]
  }

  createActiveTask(glossKey: GlossKey, prompt: GlossPrompt): ActiveLearningTask {
    this.taskIndexInPlaySession += 1
    return {
      glossKey,
      prompt,
      taskIndexInPlaySession: this.taskIndexInPlaySession,
      startedAt: new Date().toISOString(),
      startedAtMs: performance.now(),
      audioReplayCount: 0,
      movedTargetIds: [],
      unlockedTargetIds: [...this.unlockedZoneIds],
      unlockedTaskIds: this.getUnlockedCandidateGlossKeys(),
      wasPreviouslyCompleted: this.completedGlossKeys.has(glossKey),
      startedInteractionMode: this.getInteractionMode()
    }
  }

  getZoneCandidateGlossKeys(zone: Zone): GlossKey[] {
    return getGlossKeysWithLanguage(zone.glossKeys, this.language)
  }

  getUnlockedCandidateGlossKeys(): GlossKey[] {
    return [
      ...new Set(
        this.zones
          .filter((zone) => this.unlockedZoneIds.has(zone.key))
          .flatMap((zone) => this.getZoneCandidateGlossKeys(zone))
      )
    ]
  }

  getCorrectTargetIds(glossKey: GlossKey): ZoneId[] {
    return this.zones.filter((zone) => zone.glossKeys.includes(glossKey)).map((zone) => zone.key)
  }

  getInteractionMode(): InteractionMode {
    const mode = this.sceneEl.components?.['xr-mode']?.mode
    return mode === 'vr' ? 'vr' : 'desktop'
  }

  getTaskExecutionMode(startedMode: InteractionMode, completedMode: InteractionMode): TaskExecutionMode {
    return startedMode === completedMode ? completedMode : 'mixed'
  }

  allUnlockedTasksCompleted(): boolean {
    const candidates = this.getUnlockedCandidateGlossKeys()
    return candidates.length > 0 && candidates.every((glossKey) => this.completedGlossKeys.has(glossKey))
  }

  unlockRandomZone(): void {
    const lockedZones = this.zones.filter((zone) => !this.unlockedZoneIds.has(zone.key))
    if (lockedZones.length === 0) return

    const zonesWithTasks = lockedZones.filter((zone) => this.getZoneCandidateGlossKeys(zone).length > 0)
    const candidates = zonesWithTasks.length > 0 ? zonesWithTasks : lockedZones
    const zone = candidates[Math.floor(Math.random() * candidates.length)]
    this.unlockedZoneIds.add(zone.key)
  }

  syncUnlockedZones(): void {
    this.zones.forEach((zone) => {
      const component = this.getDropZoneComponent(zone.key)
      component?.setUnlocked(this.unlockedZoneIds.has(zone.key))
    })
  }

  getDropZoneComponent(zoneId: ZoneId): any {
    const zoneEl = this.sceneEl.querySelector(`#zone-${zoneId}`)
    return zoneEl?.components?.['drop-zone'] ?? null
  }

  recordLearningEvent(correctTargetId: ZoneId): void {
    if (!this.currentTask) return

    const task = this.currentTask
    const completedAt = new Date().toISOString()
    const completedInteractionMode = this.getInteractionMode()
    const movedTargetIds = [...task.movedTargetIds]
    const event: StoredLearningEvent = {
      glossKey: task.glossKey,
      playSessionIndex: this.playSessionIndex,
      taskIndexInPlaySession: task.taskIndexInPlaySession,
      executionMode: this.getTaskExecutionMode(task.startedInteractionMode, completedInteractionMode),
      taskStartedInteractionMode: task.startedInteractionMode,
      completedInteractionMode,
      taskStartedAt: task.startedAt,
      completedAt,
      timeOnTaskMs: Math.max(0, Math.round(performance.now() - task.startedAtMs)),
      audioReplayCount: task.audioReplayCount,
      triesUntilCorrect: movedTargetIds.length,
      language: this.language,
      task: task.glossKey,
      taskText: task.prompt.text,
      correctTargetId,
      correctTargetIds: this.getCorrectTargetIds(task.glossKey),
      movedTargetIds,
      wrongTargetIds: movedTargetIds.filter((targetId) => targetId !== correctTargetId),
      unlockedTargetIds: task.unlockedTargetIds,
      unlockedTaskIds: task.unlockedTaskIds,
      wasPreviouslyCompleted: task.wasPreviouslyCompleted,
      hadAudio: task.prompt.audioUrl !== null
    }

    const events = this.loadLearningEvents()
    events.push(event)
    this.completedGlossKeys.add(task.glossKey)
    this.saveLearningEvents(events)
    this.currentTask = null

    void logActivity('prepositions3d')
  }

  nextPlaySessionIndex(): number {
    try {
      const currentValue = Number(window.localStorage.getItem(PLAY_SESSION_INDEX_STORAGE_KEY) ?? '0')
      const nextValue = Number.isFinite(currentValue) && currentValue >= 0 ? currentValue + 1 : 1
      window.localStorage.setItem(PLAY_SESSION_INDEX_STORAGE_KEY, String(nextValue))
      return nextValue
    } catch {
      return this.playSessionIndex + 1
    }
  }

  loadCompletedGlossKeys(): Set<GlossKey> {
    return new Set(this.loadLearningEvents().map((event) => event.glossKey))
  }

  loadLearningEvents(): StoredLearningEvent[] {
    try {
      const rawEvents = window.localStorage.getItem(LEARNING_EVENTS_STORAGE_KEY)
      if (!rawEvents) return []
      const events = JSON.parse(rawEvents)
      if (!Array.isArray(events)) return []
      return events.filter(isStoredLearningEvent)
    } catch {
      return []
    }
  }

  saveLearningEvents(events: StoredLearningEvent[]): void {
    try {
      window.localStorage.setItem(LEARNING_EVENTS_STORAGE_KEY, JSON.stringify(events))
    } catch {
      // localStorage can fail in private browsing or when quota is exceeded.
    }
  }
}
