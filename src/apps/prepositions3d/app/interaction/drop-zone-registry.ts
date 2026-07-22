// Ported from linguanodon's prepositions3d app/interaction/drop-zone-registry.js.
import type { DropZoneHandle } from '../types'

export function getUnlockedDropZones(): DropZoneHandle[] {
  return Array.from(document.querySelectorAll('[drop-zone]'))
    .map((el: any) => ({
      el,
      component: el.components['drop-zone']
    }))
    .filter((zone) => Boolean(zone.component?.isUnlocked))
    .map(({ el, component }) => ({
      el,
      hitMesh: component.hitMesh,
      setHighlight: (active: boolean) => component.setHighlight(active)
    }))
}
