import type { RouteRecordRaw } from 'vue-router'

export type AppDefinition = {
  slug: string
  name: string
  description: string
  component: NonNullable<RouteRecordRaw['component']>
  meta?: {
    title?: string
    description?: string
  }
}

export const apps: AppDefinition[] = [
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
  }
]
