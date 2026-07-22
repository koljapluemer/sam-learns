// Ported from linguanodon's prepositions3d app/components/draggable.js.
import { AFRAME } from '../aframeGlobal'
import { getUnlockedDropZones } from '../interaction/drop-zone-registry'
import { DesktopDragInput } from '../interaction/input/desktop-drag-input'
import { VrDragInput } from '../interaction/input/vr-drag-input'
import { MugDragController } from '../interaction/mug-drag-controller'

export function registerDraggable(): void {
  if (AFRAME.components['draggable']) return

  AFRAME.registerComponent('draggable', {
    controller: null as MugDragController | null,
    desktopInput: null as DesktopDragInput | null,
    vrInput: null as VrDragInput | null,

    init() {
      const sceneEl = this.el.sceneEl

      this.controller = new MugDragController({
        mugEl: this.el,
        sceneEl,
        getDropZones: getUnlockedDropZones,
        refreshInputRaycasters: () => this.vrInput?.refreshRaycasters()
      })

      this.desktopInput = new DesktopDragInput({
        sceneEl,
        emit: (event) => this.controller.handleInput(event)
      })

      this.vrInput = new VrDragInput({
        mugEl: this.el,
        sceneEl,
        emit: (event) => this.controller.handleInput(event)
      })
    },

    remove() {
      this.desktopInput.dispose()
      this.vrInput.dispose()
      this.controller.dispose()
    },

    tick(time: number, delta: number) {
      this.vrInput.tick()
      this.controller.tick(time, delta)
    },

    setInteractionEnabled(enabled: boolean) {
      this.controller.setInteractionEnabled(enabled)
    },

    snapBack() {
      this.controller.snapBack()
    },

    resetToStartWithFade(onComplete?: () => void) {
      this.controller.resetToStartWithFade(onComplete)
    }
  })
}
