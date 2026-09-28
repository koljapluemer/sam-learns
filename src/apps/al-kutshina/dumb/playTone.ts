// Plays a short sine tone that fades out. Like playSound, failures are
// ignored - audio is a nice-to-have.
export function playTone(frequency: number, durationMs: number, volume = 0.1) {
  try {
    const context = new AudioContext()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const end = context.currentTime + durationMs / 1000
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(volume, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, end)
    oscillator.connect(gain).connect(context.destination)
    oscillator.addEventListener('ended', () => void context.close())
    oscillator.start()
    oscillator.stop(end)
  } catch {
    // No Web Audio support - stay silent.
  }
}
