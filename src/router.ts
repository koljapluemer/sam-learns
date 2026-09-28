import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import Home from './Home.vue'
import { apps } from './appRegistry'
import { routeNameForPath } from './shared/shell/appRoutePath'

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
        component: () => import('./shared/stats/GlobalStatsSection.vue'),
        meta: {
          title: 'Daily Usage',
          description: 'Cross-app daily usage stats, synced to your account when signed in.'
        }
      },
      {
        path: '/settings',
        name: 'settings',
        component: () => import('./shared/settings/GeneralSettingsSection.vue'),
        meta: {
          title: 'Settings',
          description: 'Theme and general settings.'
        }
      },
      {
        path: '/info',
        name: 'info',
        component: () => import('./shared/shell/AppInfoPage.vue'),
        meta: {
          title: 'Info',
          description: 'Credits and privacy info for Sam Learns Things.'
        }
      }
    ] as RouteRecordRaw[]
  ).concat(
    apps.flatMap((app): RouteRecordRaw[] =>
      app.routes.map((route) => ({
        path: route.path === '' ? `/${app.slug}` : `/${app.slug}/${route.path}`,
        name: routeNameForPath(app.slug, route.path),
        component: route.component,
        meta: { ...route.meta, appSlug: app.slug }
      }))
    )
  )
})

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
})

export default router
