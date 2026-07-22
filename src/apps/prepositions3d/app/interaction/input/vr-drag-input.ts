// Ported from linguanodon's prepositions3d app/interaction/input/vr-drag-input.js.
import type { DragInputAdapter, DragInputEvent } from '../../types'

export class VrDragInput implements DragInputAdapter {
  activeControllerEl: any = null
  private opts: { mugEl: any; sceneEl: any; emit: (event: DragInputEvent) => void }
  private controllerEls: any[]
  private onMugCursorMouseDown: (evt: Event) => void
  private onMugCursorMouseUp: (evt: Event) => void
  private onControllerRelease: (evt: Event) => void
  private onControllerDisconnected: (evt: Event) => void
  private onSceneExitVr: () => void

  constructor(opts: { mugEl: any; sceneEl: any; emit: (event: DragInputEvent) => void }) {
    this.opts = opts
    this.controllerEls = Array.from(document.querySelectorAll('#left-controller, #right-controller'))

    this.onMugCursorMouseDown = (evt: Event) => {
      if (!this.sceneEl.is('vr-mode')) return
      const controllerEl = this.getCursorController(evt)
      if (!controllerEl) return
      this.activeControllerEl = controllerEl
      this.emit({ type: 'start', sourceId: controllerEl.id, ray: this.getControllerRay(controllerEl) })
    }

    this.onMugCursorMouseUp = (evt: Event) => {
      if (!this.sceneEl.is('vr-mode')) return
      const controllerEl = this.getCursorController(evt)
      if (!controllerEl) return
      this.end(controllerEl)
    }

    this.onControllerRelease = (evt: Event) => {
      const controllerEl = evt.currentTarget as any
      if (!controllerEl) return
      this.end(controllerEl)
    }

    this.onControllerDisconnected = (evt: Event) => {
      const controllerEl = evt.currentTarget as any
      if (!controllerEl || controllerEl !== this.activeControllerEl) return
      this.emit({ type: 'cancel', sourceId: controllerEl.id, reason: 'controllerdisconnected' })
      this.activeControllerEl = null
    }

    this.onSceneExitVr = () => {
      if (!this.activeControllerEl) return
      this.emit({ type: 'cancel', sourceId: this.activeControllerEl.id, reason: 'exit-vr' })
      this.activeControllerEl = null
    }

    this.opts.mugEl.addEventListener('mousedown', this.onMugCursorMouseDown)
    this.opts.mugEl.addEventListener('mouseup', this.onMugCursorMouseUp)
    this.opts.sceneEl.addEventListener('exit-vr', this.onSceneExitVr)
    this.controllerEls.forEach((controllerEl) => {
      controllerEl.addEventListener('selectend', this.onControllerRelease)
      controllerEl.addEventListener('triggerup', this.onControllerRelease)
      controllerEl.addEventListener('controllerdisconnected', this.onControllerDisconnected)
    })
  }

  tick(): void {
    if (!this.sceneEl.is('vr-mode')) return

    if (this.activeControllerEl) {
      try {
        this.emit({ type: 'move', sourceId: this.activeControllerEl.id, ray: this.getControllerRay(this.activeControllerEl) })
      } catch {
        this.emit({ type: 'cancel', sourceId: this.activeControllerEl.id, reason: 'controller-ray-unavailable' })
        this.activeControllerEl = null
      }
      return
    }

    const hoverController = this.controllerEls.find((controllerEl) => {
      try {
        const ray = this.getControllerRay(controllerEl)
        controllerEl.components.raycaster?.raycaster.ray.copy(ray)
        return controllerEl.components.raycaster?.raycaster.intersectObject(this.opts.mugEl.object3D, true).length
      } catch {
        return false
      }
    })
    if (!hoverController) return
    this.emit({ type: 'hover', sourceId: hoverController.id, ray: this.getControllerRay(hoverController) })
  }

  dispose(): void {
    this.opts.mugEl.removeEventListener('mousedown', this.onMugCursorMouseDown)
    this.opts.mugEl.removeEventListener('mouseup', this.onMugCursorMouseUp)
    this.opts.sceneEl.removeEventListener('exit-vr', this.onSceneExitVr)
    this.controllerEls.forEach((controllerEl) => {
      controllerEl.removeEventListener('selectend', this.onControllerRelease)
      controllerEl.removeEventListener('triggerup', this.onControllerRelease)
      controllerEl.removeEventListener('controllerdisconnected', this.onControllerDisconnected)
    })
  }

  get sceneEl() {
    return this.opts.sceneEl
  }

  emit(event: DragInputEvent): void {
    this.opts.emit(event)
  }

  getCursorController(evt: Event): any {
    const { cursorEl } = (evt as CustomEvent<{ cursorEl?: Element }>).detail ?? {}
    return this.controllerEls.find((controllerEl) => controllerEl === cursorEl) ?? null
  }

  end(controllerEl: any): void {
    if (this.activeControllerEl !== controllerEl) return
    try {
      this.emit({ type: 'end', sourceId: controllerEl.id, ray: this.getControllerRay(controllerEl) })
    } catch {
      this.emit({ type: 'cancel', sourceId: controllerEl.id, reason: 'controller-ray-unavailable-on-release' })
    }
    this.activeControllerEl = null
  }

  getControllerRay(controllerEl: any): any {
    const raycasterComponent = controllerEl.components.raycaster
    if (!raycasterComponent) {
      throw new Error(`Controller "${controllerEl.id}" is missing the raycaster component.`)
    }

    raycasterComponent.updateOriginDirection()
    return raycasterComponent.raycaster.ray.clone()
  }
}
