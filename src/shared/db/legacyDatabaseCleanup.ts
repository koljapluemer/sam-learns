import Dexie from 'dexie'

// The 16 separate per-app/activity IndexedDB databases this repo used before
// consolidating onto the single shared `db` (src/shared/db/db.ts). Deleting
// an already-gone database is a harmless no-op, so this can just run once on
// every boot rather than needing a "have I already cleaned up" flag.
const LEGACY_DATABASE_NAMES = [
  'quotesDb',
  'currencyConversionPracticeDb',
  'entityRelationIntuitionDb',
  'simplifyExpressionsDb',
  'triangleCongruenceDb',
  'worldMapDb',
  'arabicnumbersDb',
  'comprehensibleInputDb',
  'twentyWordsDb',
  'theLittlePrinceDb',
  'sentenceNetDb',
  'hebrewscriptDb',
  'tprboardDb',
  'typingpracticeDb',
  'viettonepracticeDb',
  'samlearnsActivityDb'
]

export function cleanupLegacyDatabases(): void {
  for (const name of LEGACY_DATABASE_NAMES) {
    void Dexie.delete(name)
  }
}
