// Ported from linguanodon's hebrewscript app/catalog.js. `audioBaseUrl`
// now points at the exported public/data/hebrewscript/audio/ directory
// instead of a Django static URL.

import { listDistractorCandidates } from './model'
import type { Clip, PracticeCatalogEntry } from './types'

export const toClips = (rawClips: { filename: string; transcript: string }[], audioBaseUrl: string): Clip[] =>
  rawClips.map((rawClip) => ({
    filename: rawClip.filename,
    transcript: rawClip.transcript,
    audioSrc: `${audioBaseUrl}${encodeURIComponent(rawClip.filename)}.opus`
  }))

export const buildPracticeCatalog = (clips: Clip[]): PracticeCatalogEntry[] =>
  clips
    .map((clip) => {
      const candidates = listDistractorCandidates(clip.transcript)
      if (!candidates.length) return null
      return { clip, candidates }
    })
    .filter((entry): entry is PracticeCatalogEntry => entry !== null)
