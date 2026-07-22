import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import Home from './Home.vue'
import StatsPage from './StatsPage.vue'
import AppRouteLayout from './shared/shell/AppRouteLayout.vue'
import { apps } from './appRegistry'

const router = createRouter({
  history: createWebHistory(),
  routes: (
    [
      {
        path: '/',
        name: 'home',
        component: Home,
        meta: {
          title: 'Sam Learns Things',
          description: 'A meta-app for learning apps and interfaces.'
        }
      },
      {
        path: '/stats',
        name: 'stats',
        component: StatsPage,
        meta: {
          title: 'Daily Usage',
          description: 'Cross-app daily usage stats, stored locally on this device.'
        }
      }
    ] as RouteRecordRaw[]
  ).concat(
    apps.flatMap((app): RouteRecordRaw[] => {
      // New shape: real per-app sub-routes, rendered under a shared subnav
      // layout. `path: ''` is the home/index page, so it keeps resolving at
      // `/${slug}` and keeps the route name `app.slug` - Home.vue's card
      // links (`:to="{ name: app.slug }"`) don't need to change either way.
      if (app.routes) {
        const routes = app.routes
        return [
          {
            path: `/${app.slug}`,
            component: AppRouteLayout,
            children: routes.map((route) => ({
              path: route.path,
              name: route.path === '' ? app.slug : `${app.slug}-${route.path}`,
              component: route.component,
              meta: { ...route.meta, appSlug: app.slug }
            }))
          }
        ]
      }

      // Legacy shape: one flat route, used by every pre-existing app.
      return [
        {
          path: `/${app.slug}`,
          name: app.slug,
          component: app.component,
          meta: { ...app.meta, appSlug: app.slug }
        }
      ]
    })
  )
})

const appSlugs = new Set(apps.map((app) => app.slug))
const defaultFavicon = '/favicons/base.ico'

router.afterEach((to) => {
  const baseTitle = 'Sam Learns Things'
  const routeTitle = typeof to.meta.title === 'string' ? to.meta.title : ''

  document.title = routeTitle && routeTitle !== baseTitle ? `${routeTitle} | ${baseTitle}` : baseTitle

  const description =
    typeof to.meta.description === 'string' ? to.meta.description : 'A meta-app for learning apps and interfaces.'
  let descriptionTag = document.querySelector('meta[name="description"]')

  if (!descriptionTag) {
    descriptionTag = document.createElement('meta')
    descriptionTag.setAttribute('name', 'description')
    document.head.appendChild(descriptionTag)
  }

  descriptionTag.setAttribute('content', description)

  const slug = typeof to.meta.appSlug === 'string' ? to.meta.appSlug : ''
  const faviconHref = appSlugs.has(slug) ? `/favicons/${slug}.ico` : defaultFavicon
  let iconTag = document.querySelector('link[rel="icon"]')

  if (!iconTag) {
    iconTag = document.createElement('link')
    iconTag.setAttribute('rel', 'icon')
    document.head.appendChild(iconTag)
  }

  iconTag.setAttribute('href', faviconHref)
})

export default router
