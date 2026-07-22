// Ported from linguanodon's prepositions3d app/ui/feedback-audio.js.
type FeedbackSound = 'success' | 'error'

export class FeedbackAudio {
  private audioBySound: Record<FeedbackSound, HTMLAudioElement>

  constructor(soundBaseUrl: string) {
    this.audioBySound = {
      success: new Audio(`${soundBaseUrl}confirmation_001.ogg`),
      error: new Audio(`${soundBaseUrl}error_004.ogg`)
    }
    Object.values(this.audioBySound).forEach((audio) => {
      audio.preload = 'auto'
    })
  }

  play(sound: FeedbackSound): void {
    const audio = this.audioBySound[sound]
    this.stopOtherSounds(audio)
    audio.currentTime = 0
    void audio.play().catch(() => {
      // Browsers can block playback until audio is unlocked by a user gesture.
    })
  }

  stopOtherSounds(activeAudio: HTMLAudioElement): void {
    Object.values(this.audioBySound).forEach((audio) => {
      if (audio === activeAudio) return
      audio.pause()
      audio.currentTime = 0
    })
  }
}
