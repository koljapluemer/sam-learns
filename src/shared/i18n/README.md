# i18n policy

Every app owns an **isolated** message dictionary via `createLocalI18n`. Content is never shared
across apps — only the plumbing (dot-path lookup, `{param}` interpolation, localStorage-backed
locale state) is. Adding a German-only app never obligates translating any other app, and no app
has to touch a shared translation catalog to ship.

The **only** globally-shared, must-translate surface is shell chrome: `src/App.vue` (nav/footer)
and the `name`/`description` strings in `src/appRegistry.ts` (shown on the home page card grid).
That's a handful of strings, intentionally kept out of this factory — it's the one place a new app
genuinely does cost a translation, because every visitor sees it regardless of which app they open.

Apps pick their own locale set independently. A German-only app just does:

```ts
const locales = ['de'] as const
```

and skips rendering a language `<select>` in its `App.vue` — `createLocalI18n` never forces a
switcher UI, it just exposes `setAppLocale`/`getStoredLocale` if an app wants one.

## Starting a new app's i18n

Copy the shape from `src/apps/simplify-expressions/app/i18n.ts` or
`src/apps/triangle-congruence/app/i18n.ts`:

```ts
import { createLocalI18n } from '@/shared/i18n/createLocalI18n'

const messages = {
  de: { /* ... */ }
} as const

const locales = ['de'] as const
export type AppLocale = (typeof locales)[number]

export const { useAppI18n, setAppLocale, getStoredLocale } = createLocalI18n({
  messages,
  locales,
  defaultLocale: 'de',
  storageKey: '<your-app-slug>:locale'
})
```

Route all UI copy through `t('some.path')` even with a single locale — adding a second language
later is then just adding dictionary keys, not restructuring components.

## Adding a locale to an existing app

1. Add the locale code to that app's `locales` tuple.
2. Add a matching top-level key to its `messages` object with the same shape as the existing locale.
3. If the app renders a language switcher, add an `<option>` for it.

Nothing outside that app's own folder needs to change.
