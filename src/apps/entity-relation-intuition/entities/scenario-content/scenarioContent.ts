export type LocalizedText = { en: string; de: string }
export type ScenarioExample = { diagram: LocalizedText }
export type Scenario = { id: string; prompt: LocalizedText; examples: ScenarioExample[] }

let scenariosPromise: Promise<Scenario[]> | null = null

export function getScenarios(): Promise<Scenario[]> {
  if (!scenariosPromise) {
    scenariosPromise = fetch('/data/entity-relation-intuition/scenarios.json').then((response) => response.json())
  }
  return scenariosPromise
}
