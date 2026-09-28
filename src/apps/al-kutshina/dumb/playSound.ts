// Plays a sound, ignoring autoplay rejections and missing files - audio here
// is a nice-to-have, never a reason for the game to break.
export function playSound(url: string, volume = 1): HTMLAudioElement {
  const audio = new Audio(url)
  audio.volume = volume
  audio.play().catch(() => {})
  return audio
}
