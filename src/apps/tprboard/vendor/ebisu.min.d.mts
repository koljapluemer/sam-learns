// Type declarations for the vendored ebisu.min.mjs (Bayesian Ebisu memory
// model - https://fasiha.github.io/ebisu/) - linguanodon vendors this same
// minified build rather than depending on an npm package, so we do too
// (this migration keeps each app's own scheduling library as-is). A
// same-basename .d.ts (not a `declare module` wrapper) is picked up by TS
// for any relative import of ebisu.min.mjs, regardless of the importer's path.
export function defaultModel(t: number, alpha?: number, beta?: number): [number, number, number]
export function predictRecall(model: [number, number, number], t: number, exact?: boolean): number
export function updateRecall(
  model: [number, number, number],
  successes: number,
  total: number,
  t: number
): [number, number, number]
