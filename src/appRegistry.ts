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
    slug: 'saetze',
    name: 'Sätze',
    description: 'German cloze-sentence drills for confusable word families like "jeder/alle/ganz".',
    routes: [
      {
        path: '',
        component: () => import('./apps/saetze/pages/home/PageHome.vue'),
        meta: {
          title: 'Sätze',
          description: 'German cloze-sentence drills for confusable word families.'
        }
      },
      {
        path: 'practice/:lessonKey',
        component: () => import('./apps/saetze/pages/practice/PagePractice.vue'),
        meta: {
          title: 'Practice | Sätze',
          description: 'Fill in the blank in German cloze sentences.'
        }
      }
    ]
  },
  {
    slug: 'egyptiansentences',
    name: 'Basic Egyptian Sentences',
    description: 'Timed cloze-word quiz for Egyptian Arabic sentences.',
    credits: 'Sentence data from <a href="https://lisaanmasry.org" class="link" rel="noreferrer noopener">lisaanmasry.org</a>, used under Mike Green\'s non-commercial license.',
    routes: [
      {
        path: '',
        component: () => import('./apps/egyptiansentences/pages/home/PageHome.vue'),
        meta: {
          title: 'Basic Egyptian Sentences',
          description: 'Timed cloze-word quiz for Egyptian Arabic sentences.'
        }
      },
      {
        path: 'practice',
        component: () => import('./apps/egyptiansentences/pages/practice/PagePractice.vue'),
        meta: {
          title: 'Practice | Egyptian Sentences',
          description: 'Timed cloze-word quiz for Egyptian Arabic sentences.'
        }
      }
    ]
  },
  {
    slug: 'boringwords',
    name: 'Boring Words',
    description: 'FSRS flashcards for the small, unglamorous function words that hold the language together.',
    routes: [
      {
        path: '',
        component: () => import('./apps/boringwords/pages/home/PageHome.vue'),
        meta: {
          title: 'Boring Words',
          description: 'FSRS flashcards for small, unglamorous function words.'
        }
      },
      {
        path: 'practice/:language',
        component: () => import('./apps/boringwords/pages/practice/PagePractice.vue'),
        meta: {
          title: 'Practice | Boring Words',
          description: 'FSRS flashcard practice for function words in your chosen language.'
        }
      }
    ]
  },
  {
    slug: 'comprehensible-input',
    name: 'Comprehensible Input',
    description: 'An endless stream of easy foreign-language videos, with light comprehension surveys.',
    routes: [
      {
        path: '',
        component: () => import('./apps/comprehensible-input/pages/home/PageHome.vue'),
        meta: {
          title: 'Comprehensible Input',
          description: 'An endless stream of easy foreign-language videos.'
        }
      },
      {
        path: 'videos',
        component: () => import('./apps/comprehensible-input/pages/videos/PageVideos.vue'),
        label: 'Videos',
        meta: {
          title: 'Videos | Comprehensible Input',
          description: 'Browse comprehensible-input videos by language.'
        }
      },
      {
        path: 'watch/:videoId',
        component: () => import('./apps/comprehensible-input/pages/watch/PageWatch.vue'),
        meta: {
          title: 'Watch | Comprehensible Input',
          description: 'Watch a single comprehensible-input video.'
        }
      },
      {
        path: 'stats',
        component: () => import('./apps/comprehensible-input/pages/stats/PageStats.vue'),
        meta: {
          title: 'Stats | Comprehensible Input',
          description: 'Watch-time totals by language.'
        }
      }
    ]
  },
  {
    slug: 'viettonepractice',
    name: 'Vietnamese Tone Practice',
    description: "Listen to a short audio clip and identify which of Vietnamese's six tones you heard.",
    routes: [
      {
        path: '',
        component: () => import('./apps/viettonepractice/pages/home/PageHome.vue'),
        meta: {
          title: 'Vietnamese Tone Practice',
          description: "Listen to a short audio clip and identify which of Vietnamese's six tones you heard."
        }
      },
      {
        path: 'practice',
        component: () => import('./apps/viettonepractice/pages/practice/PagePractice.vue'),
        meta: {
          title: 'Practice | Vietnamese Tone Practice',
          description: 'Practice distinguishing Vietnamese tones by ear.'
        }
      },
      {
        path: 'stats',
        component: () => import('./apps/viettonepractice/pages/stats/PageStats.vue'),
        meta: {
          title: 'Stats | Vietnamese Tone Practice',
          description: 'Accuracy and listening-time stats for Vietnamese tone practice.'
        }
      }
    ]
  },
  {
    slug: 'hebrewscript',
    name: 'Script Practice',
    description: 'Acquire a foreign script without declarative learning by matching sounds to writing.',
    routes: [
      {
        path: '',
        component: () => import('./apps/hebrewscript/pages/home/PageHome.vue'),
        meta: {
          title: 'Script Practice',
          description: 'Listen to a clip and pick the Hebrew script that matches what you heard.'
        }
      },
      {
        path: 'practice',
        component: () => import('./apps/hebrewscript/pages/practice/PagePractice.vue'),
        meta: {
          title: 'Practice | Script Practice',
          description: 'Practice recognizing Hebrew letters by ear.'
        }
      },
      {
        path: 'stats',
        component: () => import('./apps/hebrewscript/pages/stats/PageStats.vue'),
        meta: {
          title: 'Stats | Script Practice',
          description: 'Confusion-matrix and accuracy stats for your practice history.'
        }
      }
    ]
  },
  {
    slug: 'prepositions3d',
    name: 'Prepositions 3D',
    description: 'A 3D scene where you act out spatial prepositions with objects to learn them in context.',
    routes: [
      {
        path: '',
        component: () => import('./apps/prepositions3d/pages/home/PageHome.vue'),
        meta: {
          title: 'Prepositions 3D',
          description: 'A 3D scene where you act out spatial prepositions with objects.'
        }
      },
      {
        path: 'practice',
        component: () => import('./apps/prepositions3d/pages/practice/PagePractice.vue'),
        meta: {
          title: 'Practice | Prepositions 3D',
          description: 'Drag the mug to the place that matches the spoken preposition.'
        }
      }
    ]
  },
  {
    slug: 'infinitesentences',
    name: 'Infinite Sentences',
    description: 'Learn a language word by word and sentence by sentence.',
    routes: [
      {
        path: '',
        component: () => import('./apps/infinitesentences/pages/home/PageHome.vue'),
        meta: {
          title: 'Infinite Sentences',
          description: 'Learn a language word by word and sentence by sentence.'
        }
      },
      {
        path: 'select-native-language',
        component: () => import('./apps/infinitesentences/pages/select-native-language/PageSelectNativeLanguage.vue'),
        meta: {
          title: 'Select Native Language | Infinite Sentences',
          description: 'Choose your native language.'
        }
      },
      {
        path: 'select-target-language/:nativeIso',
        component: () => import('./apps/infinitesentences/pages/select-target-language/PageSelectTargetLanguage.vue'),
        meta: {
          title: 'Select Target Language | Infinite Sentences',
          description: 'Choose a language to learn.'
        }
      },
      {
        path: 'practice/:nativeIso/:targetIso',
        component: () => import('./apps/infinitesentences/pages/practice/PagePractice.vue'),
        meta: {
          title: 'Practice | Infinite Sentences',
          description: 'Practice vocab and sentences for your chosen language pair.'
        }
      },
      {
        path: 'stats',
        component: () => import('./apps/infinitesentences/pages/stats/PageStats.vue'),
        meta: {
          title: 'Stats | Infinite Sentences',
          description: 'Streak and sentences-learned stats.'
        }
      },
      {
        path: 'settings',
        component: () => import('./apps/infinitesentences/pages/settings/PageSettings.vue'),
        meta: {
          title: 'Settings | Infinite Sentences',
          description: 'Daily sentence goal and language preferences.'
        }
      }
    ]
  },
  {
    slug: 'tprboard',
    name: 'TPR Board',
    description: 'A 3D interactive board for Total Physical Response language learning.',
    routes: [
      {
        path: '',
        component: () => import('./apps/tprboard/pages/home/PageHome.vue'),
        meta: {
          title: 'TPR Board',
          description: 'Listen to a spoken instruction, then drag objects on a 3D board to act it out.'
        }
      },
      {
        path: 'practice',
        component: () => import('./apps/tprboard/pages/practice/PagePractice.vue'),
        meta: {
          title: 'Practice | TPR Board',
          description: 'Drag objects on a 3D board to act out spoken instructions.'
        }
      },
      {
        path: 'stats',
        component: () => import('./apps/tprboard/pages/stats/PageStats.vue'),
        meta: {
          title: 'Stats | TPR Board',
          description: 'Streak and time-played stats for TPR Board.'
        }
      },
      {
        path: 'settings',
        component: () => import('./apps/tprboard/pages/settings/PageSettings.vue'),
        meta: {
          title: 'Settings | TPR Board',
          description: 'Choose which language to practice.'
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
