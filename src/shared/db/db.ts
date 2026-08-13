import Dexie from 'dexie'
import dexieCloud from 'dexie-cloud-addon'

// The single physical Dexie(+Cloud) database for the whole repo. Every app's
// db/appDb.ts is a thin shim onto this instance's tables (see
// add-a-new-app.md) - Dexie Cloud syncs at the database level, so one login
// needs to cover everything, hence one database rather than one per app.
// Table names are prefixed per app (`<appSlug>_<tableName>`) since several
// apps independently chose the same local table name for unrelated data
// (e.g. `learningEvents`, `topicProgress`).
export const db = new Dexie('samlearnsDb', { addons: [dexieCloud] })

db.version(1).stores({
  quotes_quotes: 'id',
  quotes_quoteClozeCards: 'id, quoteId',

  currencyConversionPractice_trials: 'id, date',

  entityRelationIntuition_scenarioProgress: 'scenarioId',
  entityRelationIntuition_learningEvents: 'id, timestamp, scenarioId',

  simplifyExpressions_exerciseAttempts: 'id, timestamp, topic, difficultyBand',
  simplifyExpressions_topicProgress: 'topic, dueAt, lastSeenAt',

  triangleCongruence_topicProgress: 'topicId',
  triangleCongruence_clozeGapProgress: 'gapKey, topicId',
  triangleCongruence_learningEvents: 'id, timestamp, topicId',

  worldMap_countryProgress: 'country',
  worldMap_exerciseProgress: 'exerciseKey, country',
  worldMap_learningEvents: 'id, timestamp, country',
  worldMap_practiceTime: 'key',

  arabicnumbers_numberState: 'val',
  arabicnumbers_exercises: 'key',

  comprehensibleInput_watchTime: 'videoId',
  comprehensibleInput_sessions: 'id',
  comprehensibleInput_dailyWatchTime: 'id, dayKey, languageName',

  twentyWords_words: 'id, dayKey',
  twentyWords_wordCards: 'wordId',
  twentyWords_reviewEvents: 'id, dayKey',

  theLittlePrince_vocabCards: 'key',

  sentenceNet_sentences: 'id, text, *wordIds',
  sentenceNet_words: 'id, text',
  sentenceNet_sentenceCards: 'sentenceId',
  sentenceNet_wordCards: 'wordId',

  justFlashcards_flashcards: 'id, createdAt',
  justFlashcards_cards: 'flashcardId',

  phrases_schedules: 'id',

  hebrewscript_practiceEvents: 'id, timestamp',

  tprboard_learningItems: 'key, languageCode',
  tprboard_sentenceLearningItems: 'key, languageCode',
  tprboard_languageProgress: 'languageCode',
  tprboard_learningEvents: 'id',

  typingpractice_lineAttempts: 'id, timestamp',

  viettonepractice_practiceEvents: 'id, timestamp',

  activity_activityEvents: 'id, appSlug, timestamp',
  activity_activityTimeEntries: 'id, appSlug, dayKey'
})

export const signupOpen = import.meta.env.VITE_DEXIE_CLOUD_SIGNUP_OPEN === 'true'

db.cloud.configure({
  databaseUrl: import.meta.env.VITE_DEXIE_CLOUD_DB_URL,
  // Sync is opt-in: the app works fully offline/unauthenticated exactly as
  // before, logging in is only how a user starts syncing across devices.
  requireAuth: false,
  // We render our own UserInteractionDialog.vue instead of the addon's
  // built-in (Preact-rendered) login GUI.
  customLoginGui: true,
  // No OAuth providers are configured server-side; disabling keeps the
  // login flow to the plain email+OTP steps our custom dialog handles.
  socialAuth: false
})

// When signup is closed, force every login attempt to only accept already-
// registered users - an unknown email then surfaces a USER_NOT_REGISTERED
// alert (see UserInteractionDialog.vue) instead of silently registering.
export function loginHints() {
  return signupOpen ? undefined : { intent: 'login' as const }
}
