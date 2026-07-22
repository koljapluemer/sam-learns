import { createRouter, createWebHistory } from 'vue-router'
import Home from './Home.vue'
import StatsPage from './StatsPage.vue'
import { apps } from './appRegistry'

const router = createRouter({
  history: createWebHistory(),
  routes: [
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
  ].concat(
    apps.map((app) => ({
      path: `/${app.slug}`,
      name: app.slug,
      component: app.component,
      meta: app.meta
    }))
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

  const slug = typeof to.name === 'string' ? to.name : ''
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
