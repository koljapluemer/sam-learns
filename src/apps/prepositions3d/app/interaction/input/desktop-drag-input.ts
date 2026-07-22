// Ported from linguanodon's prepositions3d app/interaction/input/desktop-drag-input.js.
import { THREE } from '../../aframeGlobal'
import type { DragInputAdapter, DragInputEvent } from '../../types'

function getMouseNDC(evt: MouseEvent, canvas: HTMLCanvasElement): any {
  const rect = canvas.getBoundingClientRect()
  return new THREE.Vector2(((evt.clientX - rect.left) / rect.width) * 2 - 1, -((evt.clientY - rect.top) / rect.height) * 2 + 1)
}

export class DesktopDragInput implements DragInputAdapter {
  raycaster = new THREE.Raycaster()
  isActive = false
  private opts: { sceneEl: any; emit: (event: DragInputEvent) => void }
  private onCanvasMouseDown: (evt: MouseEvent) => void
  private onWindowMouseMove: (evt: MouseEvent) => void
  private onWindowMouseUp: (evt: MouseEvent) => void

  constructor(opts: { sceneEl: any; emit: (event: DragInputEvent) => void }) {
    this.opts = opts

    this.onCanvasMouseDown = (evt: MouseEvent) => {
      if (this.sceneEl.is('vr-mode')) return
      this.emit({ type: 'start', sourceId: 'mouse', ray: this.getMouseRay(evt) })
      this.isActive = true
    }

    this.onWindowMouseMove = (evt: MouseEvent) => {
      if (this.sceneEl.is('vr-mode')) return
      const ray = this.getMouseRay(evt)
      this.emit(this.isActive ? { type: 'move', sourceId: 'mouse', ray } : { type: 'hover', sourceId: 'mouse', ray })
    }

    this.onWindowMouseUp = (evt: MouseEvent) => {
      if (!this.isActive) return
      this.isActive = false
      this.emit({ type: 'end', sourceId: 'mouse', ray: this.getMouseRay(evt) })
    }

    this.opts.sceneEl.canvas.addEventListener('mousedown', this.onCanvasMouseDown)
    window.addEventListener('mousemove', this.onWindowMouseMove)
    window.addEventListener('mouseup', this.onWindowMouseUp)
  }

  dispose(): void {
    this.opts.sceneEl.canvas.removeEventListener('mousedown', this.onCanvasMouseDown)
    window.removeEventListener('mousemove', this.onWindowMouseMove)
    window.removeEventListener('mouseup', this.onWindowMouseUp)
  }

  get sceneEl() {
    return this.opts.sceneEl
  }

  emit(event: DragInputEvent): void {
    this.opts.emit(event)
  }

  getMouseRay(evt: MouseEvent): any {
    const mouse = getMouseNDC(evt, this.sceneEl.canvas)
    this.raycaster.setFromCamera(mouse, this.sceneEl.camera)
    return this.raycaster.ray.clone()
  }
}
