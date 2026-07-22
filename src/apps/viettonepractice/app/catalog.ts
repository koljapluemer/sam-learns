// Ported unchanged from linguanodon's viettonepractice app/catalog.js.
import { listDistractorCandidates } from './model'
import type { Clip, PracticeCatalogEntry } from './types'

export function toClips(rawClips: { filename: string; transcript: string }[], audioBaseUrl: string): Clip[] {
  return rawClips.map((rawClip) => ({
    filename: rawClip.filename,
    transcript: rawClip.transcript,
    audioSrc: audioBaseUrl + encodeURIComponent(rawClip.filename)
  }))
}

export function buildPracticeCatalog(clips: Clip[]): PracticeCatalogEntry[] {
  return clips
    .map((clip) => {
      const candidates = listDistractorCandidates(clip.transcript)
      if (!candidates.length) return null
      return { clip, candidates }
    })
    .filter((entry): entry is PracticeCatalogEntry => entry !== null)
}
