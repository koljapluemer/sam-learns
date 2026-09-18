import type { DistractorCandidate } from '../types'

export type LanguagePack = {
  code: string
  name: string
  audioBaseUrl: string
  clipsUrl: string
  toneKeys: readonly string[]
  toneLabels: Record<string, string>
  credits: {
    datasetName: string
    datasetUrl: string
    licenseName: string
    licenseUrl: string
    licenseSummary: string
  }
  generateDistractors: (transcript: string) => DistractorCandidate[]
}
