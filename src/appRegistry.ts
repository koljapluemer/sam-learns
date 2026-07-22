import type { RouteRecordRaw } from 'vue-router'

// A single child page within an app that uses the `routes` shape below.
// `path: ''` is the app's home/index page - conventionally followed by
// 'practice', 'stats', 'settings', but any custom path is fine too.
export type AppRouteDefinition = {
  path: string
  component: NonNullable<RouteRecordRaw['component']>
  label?: string
  meta?: {
    title?: string
    description?: string
  }
}

export type AppDefinition = {
  slug: string
  name: string
  description: string
  // Trusted HTML, rendered as-is in the app's footer (attribution/credits
  // for imported content, e.g. Tatoeba sentence pairs).
  credits?: string
  meta?: {
    title?: string
    description?: string
  }
} & (
  // Legacy shape: one flat route at `/${slug}`, used by every existing app.
  | { component: NonNullable<RouteRecordRaw['component']>; routes?: never }
  // New shape: real per-app sub-routes (home/practice/stats/settings/custom),
  // rendered inside AppRouteLayout with an AppSubnav tab bar.
  | { routes: AppRouteDefinition[]; component?: never }
)

export const apps: AppDefinition[] = [
  {
    slug: 'arabicnumbers',
    name: 'Arabic Numbers Practice',
    description: 'Learn to read the Arabic numbers from 0 to 100.',
    routes: [
      {
        path: '',
        component: () => import('./apps/arabicnumbers/pages/home/PageHome.vue'),
        meta: {
          title: 'Arabic Numbers Practice',
          description: 'Learn to read the Arabic numbers from 0 to 100.'
        }
      },
      {
        path: 'practice',
        component: () => import('./apps/arabicnumbers/pages/practice/PagePractice.vue'),
        meta: {
          title: 'Practice | Arabic Numbers',
          description: 'Practice reading Arabic numbers with spaced repetition.'
        }
      }
    ]
  },
  {
    slug: 'learn-flags',
    name: 'Learn Flags',
    description: 'Guess the country from its flag.',
    component: () => import('./apps/learn-flags/LearnFlags.vue'),
    meta: {
      title: 'Learn Flags',
      description: 'Practice recognizing countries by their flags.'
    }
  },
  {
    slug: 'currency-conversion-practice',
    name: 'Currency Conversion Practice',
    description: 'Practice quick mental exchange-rate conversions.',
    component: () => import('./apps/currency-conversion-practice/CurrencyConversionPractice.vue'),
    meta: {
      title: 'Currency Conversion Practice',
      description: 'Practice converting currencies in your head.'
    }
  },
  {
    slug: 'simplify-expressions',
    name: 'Simplify Expressions',
    description: 'Practice simplifying algebraic expressions.',
    component: () => import('./apps/simplify-expressions/app/App.vue'),
    meta: {
      title: 'Simplify Expressions',
      description: 'Practice simplifying algebraic expressions.'
    }
  },
  {
    slug: 'triangle-congruence',
    name: 'Triangle Congruence',
    description: 'Practice identifying triangle congruence theorems (SSS, SAS, ASA, SSA).',
    component: () => import('./apps/triangle-congruence/app/App.vue'),
    meta: {
      title: 'Triangle Congruence',
      description: 'Practice recognizing SSS, SAS, ASA and SSA triangle congruence theorems, in German.'
    }
  },
  {
    slug: 'world-map',
    name: 'World Map',
    description: 'Find countries in their neighborhood on the world map.',
    component: () => import('./apps/world-map/app/App.vue'),
    meta: {
      title: 'World Map',
      description: 'Practice locating countries on the world map.'
    }
  },
  {
    slug: 'typingpractice',
    name: 'Vietnamese Typing Practice',
    description: 'Practice Vietnamese TELEX/VNI keyboard input.',
    routes: [
      {
        path: '',
        component: () => import('./apps/typingpractice/pages/home/PageHome.vue'),
        meta: {
          title: 'Vietnamese Typing Practice',
          description: 'Practice Vietnamese TELEX/VNI keyboard input.'
        }
      },
      {
        path: 'practice',
        component: () => import('./apps/typingpractice/pages/practice/PagePractice.vue'),
        meta: {
          title: 'Practice | Vietnamese Typing',
          description: 'Type Vietnamese words against a fixed word list, with optional TELEX/VNI keystroke display.'
        }
      },
      {
        path: 'settings',
        component: () => import('./apps/typingpractice/pages/settings/PageSettings.vue'),
        meta: {
          title: 'Settings | Vietnamese Typing',
          description: 'Choose the TELEX/VNI keystroke input method.'
        }
      }
    ]
  },
  {
    slug: 'entity-relation-intuition',
    name: 'ER Diagram Intuition',
    description: 'Practice sketching simple entity-relationship diagrams for everyday business cases.',
    component: () => import('./apps/entity-relation-intuition/app/App.vue'),
    meta: {
      title: 'ER Diagram Intuition',
      description: 'Build intuition for basic ER modeling by comparing your sketch to example solutions.'
    }
  }
]
