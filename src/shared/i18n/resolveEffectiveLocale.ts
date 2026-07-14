export function resolveEffectiveLocale<TLocale extends string>(
  appLocales: readonly TLocale[],
  appDefaultLocale: TLocale,
  preferredLocale: string
): TLocale {
  return (appLocales as readonly string[]).includes(preferredLocale)
    ? (preferredLocale as TLocale)
    : appDefaultLocale
}
