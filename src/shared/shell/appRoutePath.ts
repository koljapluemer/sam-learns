// Shared by src/router.ts (route registration) and AppSubnav.vue (tab links)
// so both agree on how an AppRouteDefinition's `path` maps to a route name.

// Strips dynamic segments (`:param`) before deriving the name, so
// `practice/:lessonKey` still gets the clean name `<slug>-practice` instead
// of a name containing a literal colon/slash.
export function routeNameForPath(slug: string, path: string): string {
  if (path === '') return slug
  const staticSegments = path.split('/').filter((segment) => !segment.startsWith(':'))
  return staticSegments.length > 0 ? `${slug}-${staticSegments.join('-')}` : slug
}

// A route with a required param (e.g. `practice/:lessonKey`) has no single
// destination, so it can't be a generic subnav tab - same reasoning as
// linguanodon's AppInfo.practice_url_name being None for apps like saetze/
// boringwords where practice takes a required argument.
export function isDynamicRoutePath(path: string): boolean {
  return path.split('/').some((segment) => segment.startsWith(':'))
}
