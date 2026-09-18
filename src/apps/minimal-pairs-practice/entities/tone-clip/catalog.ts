import type { Clip, DistractorCandidate, PracticeCatalogEntry } from './types'

export function toClips(
  rawClips: { filename: string; transcript: string; nativeScript?: string }[],
  audioBaseUrl: string
): Clip[] {
  return rawClips.map((rawClip) => ({
    filename: rawClip.filename,
    transcript: rawClip.transcript,
    audioSrc: audioBaseUrl + encodeURIComponent(rawClip.filename),
    nativeScript: rawClip.nativeScript
  }))
}

export function buildPracticeCatalog(
  clips: Clip[],
  generateDistractors: (transcript: string) => DistractorCandidate[]
): PracticeCatalogEntry[] {
  return clips
    .map((clip) => {
      const candidates = generateDistractors(clip.transcript)
      if (!candidates.length) return null
      return { clip, candidates }
    })
    .filter((entry): entry is PracticeCatalogEntry => entry !== null)
}
