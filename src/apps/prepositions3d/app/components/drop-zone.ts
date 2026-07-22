// Ported from linguanodon's prepositions3d app/components/drop-zone.js.
import { AFRAME, THREE } from '../aframeGlobal'

const RING_IDLE_COLOR = '#00cfff'
const RING_ACTIVE_COLOR = '#ffdd00'
const RING_IDLE_OPACITY = 0.7
const RING_ACTIVE_OPACITY = 0.95
const RING_IDLE_SCALE = 1
const RING_PULSE_SCALE = 1.08
const DROP_TARGET_CLASS = 'drop-target'

export function registerDropZone(): void {
  if (AFRAME.components['drop-zone']) return

  AFRAME.registerComponent('drop-zone', {
    schema: {
      label: { type: 'string' },
      radius: { type: 'number', default: 0.24 }
    },

    ring: null as any,
    hitMesh: null as any,
    isUnlocked: false,
    isHighlighted: false,

    init() {
      // Invisible hit disc for raycasting
      const geo = new THREE.CylinderGeometry(this.data.radius, this.data.radius, 0.05, 32)
      const mat = new THREE.MeshBasicMaterial({ visible: false })
      this.hitMesh = new THREE.Mesh(geo, mat)
      this.hitMesh.el = this.el
      this.el.object3D.add(this.hitMesh)

      // Visible ring indicator
      const ring = document.createElement('a-torus')
      ring.setAttribute('radius', String(this.data.radius * 0.85))
      ring.setAttribute('radius-tubular', '0.012')
      ring.setAttribute('rotation', '-90 0 0')
      ring.setAttribute('material', `color: ${RING_IDLE_COLOR}; opacity: ${RING_IDLE_OPACITY}; transparent: true; shader: flat`)
      this.el.appendChild(ring)
      this.ring = ring
      this.setUnlocked(false)
    },

    setUnlocked(unlocked: boolean) {
      this.isUnlocked = unlocked
      this.hitMesh.visible = unlocked
      this.el.classList.toggle(DROP_TARGET_CLASS, unlocked)
      if (!this.ring) return
      this.ring.object3D.visible = unlocked
      if (!unlocked) this.setHighlight(false)
    },

    setHighlight(active: boolean) {
      if (!this.ring) return
      this.isHighlighted = active
      const color = active ? RING_ACTIVE_COLOR : RING_IDLE_COLOR
      const opacity = active ? RING_ACTIVE_OPACITY : RING_IDLE_OPACITY
      this.ring.setAttribute('material', `color: ${color}; opacity: ${opacity}; transparent: true; shader: flat`)
      this.ring.object3D.scale.setScalar(active ? RING_PULSE_SCALE : RING_IDLE_SCALE)
    },

    tick(time: number) {
      if (!this.isUnlocked || !this.ring || this.isHighlighted) return
      const t = (Math.sin(time * 0.003) + 1) / 2
      const scale = THREE.MathUtils.lerp(RING_IDLE_SCALE, RING_PULSE_SCALE, t)
      this.ring.object3D.scale.setScalar(scale)
    }
  })
}
