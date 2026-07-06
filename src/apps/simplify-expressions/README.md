## Simplify Expressions

High-school expression simplification tutor built with Vue 3, TypeScript, Vite, Tailwind CSS, DaisyUI, Vue Router, Vue I18n, MathLive, KaTeX, Cortex Compute Engine, lucide icons, and Dexie-ready project structure.

The app generates short algebra exercises, accepts math input through MathLive, renders expressions with KaTeX, and grades answers with the Cortex Compute Engine. A response must be mathematically equivalent and simpler than the original expression, not just a copy.

## Development

```bash
npm install
npm run dev
npm test
npm run lint:fix
npm run build
```

`npm test` runs the Vitest unit tests, including parsing and implicit-multiplication cases in `src/entities/expression-exercise/mathEngine.test.ts`.

## I18n Linting

Vue template raw-text checks are enabled as ESLint warnings through `@intlify/eslint-plugin-vue-i18n`.

Disable the warning locally when needed:

```bash
I18N_RAW_TEXT=off npm run lint
```

Keep product copy in `src/app/i18n.ts`. The default locale is German, and the selected locale is stored in `localStorage`.

## Grading Policy

The MVP uses expanded polynomial form as the simplification convention:

- expand parentheses
- evaluate numeric constants
- combine like terms
- simplify repeated products into powers where generated exercises expect that
- do not require factoring

An answer passes when it is equivalent to the exercise, has lower AST complexity than the original, and is no more complex than the generated target answer within a small tolerance.
