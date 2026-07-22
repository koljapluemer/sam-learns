// Ported from linguanodon's prepositions3d app/components/xr-mode.js.
import { AFRAME } from '../aframeGlobal'
import type { InteractionMode } from '../types'

export function registerXrMode(): void {
  if (AFRAME.components['xr-mode']) return

  AFRAME.registerComponent('xr-mode', {
    mode: 'desktop' as InteractionMode,

    init() {
      this.mode = 'desktop'
      this._onEnterVr = () => this.setMode('vr')
      this._onExitVr = () => this.setMode('desktop')
      this.el.addEventListener('enter-vr', this._onEnterVr)
      this.el.addEventListener('exit-vr', this._onExitVr)
      this.setMode('desktop')
    },

    remove() {
      this.el.removeEventListener('enter-vr', this._onEnterVr)
      this.el.removeEventListener('exit-vr', this._onExitVr)
    },

    setMode(mode: InteractionMode) {
      if (this.mode === mode) return
      this.mode = mode
      const desktopCamera = document.getElementById('desktop-camera')
      const vrCamera = document.getElementById('vr-camera')
      desktopCamera?.setAttribute('camera', `active: ${mode === 'desktop'}`)
      vrCamera?.setAttribute('camera', `active: ${mode === 'vr'}`)
      this.el.emit('interaction-mode-change', { mode })
    }
  })
}
