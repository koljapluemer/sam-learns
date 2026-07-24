import type { RouteRecordRaw } from 'vue-router'

// A single child page within an app. `path: ''` is the app's home/index page
// - conventionally followed by 'stats', 'settings', then any custom paths
// (e.g. 'practice', 'videos') the app needs. Every app has exactly one of
// each of 'home'/'stats'/'settings'; App.vue's top nav bar pulls those three
// to the front regardless of declaration order here, then appends the rest.
export type AppRouteDefinition = {
  path: string
  component: NonNullable<RouteRecordRaw['component']>
  label?: string
  meta?: {
    title?: string
    description?: string
    // 'contained' (centered, max-width, padded) unless set to 'full-bleed'
    // (fills the viewport - used by immersive/game-like exercises).
    layout?: 'contained' | 'full-bleed'
  }
}

export type AppDefinition = {
  slug: string
  name: string
  description: string
  // Trusted HTML, rendered as-is in the app's footer (attribution/credits
  // for imported content, e.g. Tatoeba sentence pairs).
  credits?: string
  routes: AppRouteDefinition[]
}

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
      },
      {
        path: 'stats',
        component: () => import('./apps/arabicnumbers/pages/stats/PageStats.vue'),
        meta: {
          title: 'Stats | Arabic Numbers',
          description: 'Cross-app daily usage stats.'
        }
      },
      {
        path: 'settings',
        component: () => import('./apps/arabicnumbers/pages/settings/PageSettings.vue'),
        meta: {
          title: 'Settings | Arabic Numbers',
          description: 'App settings.'
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
      },
      {
        path: 'stats',
        component: () => import('./apps/saetze/pages/stats/PageStats.vue'),
        meta: {
          title: 'Stats | Sätze',
          description: 'Cross-app daily usage stats.'
        }
      },
      {
        path: 'settings',
        component: () => import('./apps/saetze/pages/settings/PageSettings.vue'),
        meta: {
          title: 'Settings | Sätze',
          description: 'App settings.'
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
      },
      {
        path: 'stats',
        component: () => import('./apps/egyptiansentences/pages/stats/PageStats.vue'),
        meta: {
          title: 'Stats | Egyptian Sentences',
          description: 'Cross-app daily usage stats.'
        }
      },
      {
        path: 'settings',
        component: () => import('./apps/egyptiansentences/pages/settings/PageSettings.vue'),
        meta: {
          title: 'Settings | Egyptian Sentences',
          description: 'App settings.'
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
      },
      {
        path: 'stats',
        component: () => import('./apps/boringwords/pages/stats/PageStats.vue'),
        meta: {
          title: 'Stats | Boring Words',
          description: 'Cross-app daily usage stats.'
        }
      },
      {
        path: 'settings',
        component: () => import('./apps/boringwords/pages/settings/PageSettings.vue'),
        meta: {
          title: 'Settings | Boring Words',
          description: 'App settings.'
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
        path: 'play',
        component: () => import('./apps/comprehensible-input/pages/play/PagePlay.vue'),
        meta: {
          title: 'Comprehensible Input',
          description: 'An endless stream of easy foreign-language videos.',
          layout: 'full-bleed'
        }
      },
      {
        path: 'stats',
        component: () => import('./apps/comprehensible-input/pages/stats/PageStats.vue'),
        meta: {
          title: 'Stats | Comprehensible Input',
          description: 'Watch-time totals by language.'
        }
      },
      {
        path: 'settings',
        component: () => import('./apps/comprehensible-input/pages/settings/PageSettings.vue'),
        meta: {
          title: 'Settings | Comprehensible Input',
          description: 'Choose your video language.'
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
      },
      {
        path: 'settings',
        component: () => import('./apps/viettonepractice/pages/settings/PageSettings.vue'),
        meta: {
          title: 'Settings | Vietnamese Tone Practice',
          description: 'App settings.'
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
      },
      {
        path: 'settings',
        component: () => import('./apps/hebrewscript/pages/settings/PageSettings.vue'),
        meta: {
          title: 'Settings | Script Practice',
          description: 'App settings.'
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
      },
      {
        path: 'stats',
        component: () => import('./apps/prepositions3d/pages/stats/PageStats.vue'),
        meta: {
          title: 'Stats | Prepositions 3D',
          description: 'Cross-app daily usage stats.'
        }
      },
      {
        path: 'settings',
        component: () => import('./apps/prepositions3d/pages/settings/PageSettings.vue'),
        meta: {
          title: 'Settings | Prepositions 3D',
          description: 'App settings.'
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
        label: 'Change Languages',
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
    routes: [
      {
        path: '',
        component: () => import('./apps/learn-flags/LearnFlags.vue'),
        meta: {
          title: 'Learn Flags',
          description: 'Practice recognizing countries by their flags.'
        }
      },
      {
        path: 'stats',
        component: () => import('./apps/learn-flags/pages/stats/PageStats.vue'),
        meta: {
          title: 'Stats | Learn Flags',
          description: 'Cross-app daily usage stats.'
        }
      },
      {
        path: 'settings',
        component: () => import('./apps/learn-flags/pages/settings/PageSettings.vue'),
        meta: {
          title: 'Settings | Learn Flags',
          description: 'App settings.'
        }
      }
    ]
  },
  {
    slug: 'currency-conversion-practice',
    name: 'Currency Conversion Practice',
    description: 'Practice quick mental exchange-rate conversions.',
    routes: [
      {
        path: '',
        component: () => import('./apps/currency-conversion-practice/CurrencyConversionPractice.vue'),
        meta: {
          title: 'Currency Conversion Practice',
          description: 'Practice converting currencies in your head.'
        }
      },
      {
        path: 'stats',
        component: () => import('./apps/currency-conversion-practice/pages/stats/PageStats.vue'),
        meta: {
          title: 'Stats | Currency Conversion Practice',
          description: 'Cross-app daily usage stats.'
        }
      },
      {
        path: 'settings',
        component: () => import('./apps/currency-conversion-practice/pages/settings/PageSettings.vue'),
        meta: {
          title: 'Settings | Currency Conversion Practice',
          description: 'App settings.'
        }
      }
    ]
  },
  {
    slug: 'simplify-expressions',
    name: 'Simplify Expressions',
    description: 'Practice simplifying algebraic expressions.',
    routes: [
      {
        path: '',
        component: () => import('./apps/simplify-expressions/app/App.vue'),
        meta: {
          title: 'Simplify Expressions',
          description: 'Practice simplifying algebraic expressions.',
          layout: 'full-bleed'
        }
      },
      {
        path: 'stats',
        component: () => import('./apps/simplify-expressions/pages/stats/PageStats.vue'),
        meta: {
          title: 'Stats | Simplify Expressions',
          description: 'Cross-app daily usage stats.'
        }
      },
      {
        path: 'settings',
        component: () => import('./apps/simplify-expressions/pages/settings/PageSettings.vue'),
        meta: {
          title: 'Settings | Simplify Expressions',
          description: 'Language and app settings.'
        }
      }
    ]
  },
  {
    slug: 'triangle-congruence',
    name: 'Triangle Congruence',
    description: 'Practice identifying triangle congruence theorems (SSS, SAS, ASA, SSA).',
    routes: [
      {
        path: '',
        component: () => import('./apps/triangle-congruence/app/App.vue'),
        meta: {
          title: 'Triangle Congruence',
          description: 'Practice recognizing SSS, SAS, ASA and SSA triangle congruence theorems, in German.'
        }
      },
      {
        path: 'stats',
        component: () => import('./apps/triangle-congruence/pages/stats/PageStats.vue'),
        meta: {
          title: 'Stats | Triangle Congruence',
          description: 'Cross-app daily usage stats.'
        }
      },
      {
        path: 'settings',
        component: () => import('./apps/triangle-congruence/pages/settings/PageSettings.vue'),
        meta: {
          title: 'Settings | Triangle Congruence',
          description: 'Language and app settings.'
        }
      }
    ]
  },
  {
    slug: 'world-map',
    name: 'World Map',
    description: 'Find countries in their neighborhood on the world map.',
    routes: [
      {
        path: '',
        component: () => import('./apps/world-map/app/App.vue'),
        meta: {
          title: 'World Map',
          description: 'Practice locating countries on the world map.',
          layout: 'full-bleed'
        }
      },
      {
        path: 'stats',
        component: () => import('./apps/world-map/pages/stats/PageStats.vue'),
        meta: {
          title: 'Stats | World Map',
          description: 'Per-country progress and daily usage stats.'
        }
      },
      {
        path: 'settings',
        component: () => import('./apps/world-map/pages/settings/PageSettings.vue'),
        meta: {
          title: 'Settings | World Map',
          description: 'Language and app settings.'
        }
      }
    ]
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
        path: 'stats',
        component: () => import('./apps/typingpractice/pages/stats/PageStats.vue'),
        meta: {
          title: 'Stats | Vietnamese Typing',
          description: 'Cross-app daily usage stats.'
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
    slug: '20-words',
    name: '20 Words',
    description: 'Add 20 vocab words a day, gate them through a memorize board, then practice with FSRS flashcards.',
    routes: [
      {
        path: '',
        component: () => import('./apps/20-words/pages/home/PageHome.vue'),
        meta: {
          title: '20 Words',
          description: 'Add 20 vocab words a day and practice them in a dedicated flow.'
        }
      },
      {
        path: 'main',
        component: () => import('./apps/20-words/pages/main/PageMain.vue'),
        meta: {
          title: 'Main | 20 Words',
          description: 'Add, memorize, and practice today\'s vocab.'
        }
      },
      {
        path: 'stats',
        component: () => import('./apps/20-words/pages/stats/PageStats.vue'),
        meta: {
          title: 'Stats | 20 Words',
          description: 'Daily added, memorized, and practiced word counts.'
        }
      },
      {
        path: 'settings',
        component: () => import('./apps/20-words/pages/settings/PageSettings.vue'),
        meta: {
          title: 'Settings | 20 Words',
          description: 'App settings.'
        }
      }
    ]
  },
  {
    slug: 'entity-relation-intuition',
    name: 'ER Diagram Intuition',
    description: 'Practice sketching simple entity-relationship diagrams for everyday business cases.',
    routes: [
      {
        path: '',
        component: () => import('./apps/entity-relation-intuition/app/App.vue'),
        meta: {
          title: 'ER Diagram Intuition',
          description: 'Build intuition for basic ER modeling by comparing your sketch to example solutions.'
        }
      },
      {
        path: 'stats',
        component: () => import('./apps/entity-relation-intuition/pages/stats/PageStats.vue'),
        meta: {
          title: 'Stats | ER Diagram Intuition',
          description: 'Cross-app daily usage stats.'
        }
      },
      {
        path: 'settings',
        component: () => import('./apps/entity-relation-intuition/pages/settings/PageSettings.vue'),
        meta: {
          title: 'Settings | ER Diagram Intuition',
          description: 'Language and app settings.'
        }
      }
    ]
  }
]
