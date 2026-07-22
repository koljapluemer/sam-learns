// Ported from linguanodon's comprehensible_input/static/.../js/types.d.ts,
// dropping the htmx/Alpine-specific bits (this repo replaces those with
// plain Vue reactivity) and the ambient window.YT typing stays, loose on
// purpose - same precedent as this repo's other CDN-only global typings.

export type Video = {
  videoId: number
  youtubeId: string
  title: string
  languageId: number
  languageName: string
  languageCode: string
  thumbnailUrl: string
  thumbnailUrlLarge: string
}

export type WatchMeta = {
  videoId: number
  languageId: number
  languageName: string
  videoTitle: string
}

export type WatchSegment = {
  start: number
  end: number
}

export type WatchRecord = WatchMeta & {
  seconds: number
  segments: WatchSegment[]
}

export type SurveyResponse = WatchMeta & {
  timestamp: number
  comprehension: number
  listening: number
  rewatch: 'no' | 'yes' | 'certainly'
  segments: WatchSegment[]
}

export interface YTPlayer {
  playVideo(): void
  pauseVideo(): void
  getCurrentTime(): number
}

export interface YTPlayerStateConstants {
  PLAYING: number
  PAUSED: number
  ENDED: number
  BUFFERING: number
  CUED: number
}

export interface YTNamespace {
  Player: new (elementId: string, options: Record<string, unknown>) => YTPlayer
  PlayerState: YTPlayerStateConstants
}

declare global {
  interface Window {
    YT: YTNamespace
    onYouTubeIframeAPIReady: () => void
  }
}
