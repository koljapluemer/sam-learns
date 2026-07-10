import type { AppLocale } from '@/apps/simplify-expressions/app/i18n'

export async function submitFeedback(input: {
  helpfulForLearning: string
  improveUsefulness: string
  anythingElse: string
  website: string
  locale: AppLocale
}) {
  if (input.website.trim().length > 0) {
    return
  }
}
