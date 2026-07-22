// Ported from linguanodon's prepositions3d app/components/game-ticker.js.
import { AFRAME } from '../aframeGlobal'
import type { Game } from '../game/game'

let activeGame: Game | null = null

export function setGameTickerGame(game: Game | null): void {
  activeGame = game
}

export function registerGameTicker(): void {
  if (AFRAME.components['game-ticker']) return

  AFRAME.registerComponent('game-ticker', {
    tick(time: number, delta: number) {
      activeGame?.tick(time, delta)
    }
  })
}
