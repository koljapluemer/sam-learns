// Ported from linguanodon's prepositions3d app/components/shadow-catcher.js.
import { AFRAME, THREE } from '../aframeGlobal'

export function registerShadowCatcher(): void {
  if (AFRAME.components['shadow-catcher']) return

  AFRAME.registerComponent('shadow-catcher', {
    schema: {
      opacity: { type: 'number', default: 0.35 }
    },

    init() {
      this.el.addEventListener('object3dset', () => this._applyMaterial())
      this._applyMaterial()
    },

    _applyMaterial() {
      const mesh = this.el.getObject3D('mesh')
      if (!mesh) return
      mesh.material = new THREE.ShadowMaterial({ opacity: this.data.opacity })
      mesh.receiveShadow = true
    }
  })
}
