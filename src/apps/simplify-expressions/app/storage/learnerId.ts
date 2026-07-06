const learnerIdStorageKey = 'simplify-expressions:learner-id'

export function getLearnerId() {
  const stored = window.localStorage.getItem(learnerIdStorageKey)
  if (stored) {
    return stored
  }

  const learnerId = crypto.randomUUID()
  window.localStorage.setItem(learnerIdStorageKey, learnerId)
  return learnerId
}
