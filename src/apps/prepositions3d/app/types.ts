// Ported from linguanodon's prepositions3d app/types.d.ts.
//
// THREE/A-Frame internals below are intentionally typed as `any`. A-Frame
// registers its own bundled three.js instance on the global `AFRAME.THREE`
// at runtime (see app/aframeThree.ts) - it isn't the `three` npm package
// installed for tprboard, and neither ships installable .d.ts files in the
// versions used here, so there is no real type source to check against.
// This mirrors the original's own admission that its THREE types were loose.

export type ZoneId = string
export type GlossKey = string
export type LanguageCode = string
export type GameState = 'idle' | 'playing' | 'feedback'

export type Zone = {
  key: ZoneId
  pos: { x: number; y: number; z: number }
  glossKeys: GlossKey[]
}

export type InteractionMode = 'desktop' | 'vr'
export type TaskExecutionMode = InteractionMode | 'mixed'

export type DragInputEvent =
  | { type: 'start'; sourceId: string; ray: any }
  | { type: 'move'; sourceId: string; ray: any }
  | { type: 'hover'; sourceId: string; ray: any }
  | { type: 'end'; sourceId: string; ray: any }
  | { type: 'cancel'; sourceId: string; reason: string }

export type DragInputAdapter = {
  dispose(): void
  tick?(time: number): void
}

export type DropZoneHandle = {
  el: any
  hitMesh: any
  setHighlight(active: boolean): void
}
