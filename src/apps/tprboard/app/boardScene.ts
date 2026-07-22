// Port of linguanodon's tprboard app/board-scene.js. linguanodon's own
// comment noted its JSDoc THREE typing was loose because it had no local
// `three` package to resolve types against (loaded via CDN import map at
// runtime); this repo has a real `three` npm dependency, so this port uses
// real THREE types throughout instead of carrying that same limitation
// forward. Logic/tuning constants are otherwise unchanged.
//
// `dispose()` is new (not in the original, which only ever ran inside a
// full-page Django template, never unmounted) - it tears down the renderer
// and the window resize listener so a Vue route change doesn't leak a
// WebGL context or an animation loop.
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { shuffled } from './utils'
import type { PlacedObject, RelationshipEffect, TaskCandidate } from './types'

type SceneObject = PlacedObject & {
  wrapper: THREE.Group
  homePosition: THREE.Vector3
  modelBoundsCenter: THREE.Vector3
  modelHalfExtents: THREE.Vector3
  radius: number
  wigglePhase: number
  wiggleStrength: number
  baseScale: number
  effectScale: number
  highlightStrength: number
}

type DragState = {
  object: SceneObject
  pointerId: number
  grabOffset: THREE.Vector3
}

type BoardSceneOptions = {
  modelsBaseUrl: string
  onIncorrectDrop?: () => void
  onTaskCompleted?: () => void
}

const CAMERA_POSITION = new THREE.Vector3(0, 18, 15)
const CAMERA_ROTATION = new THREE.Euler(-0.98, 0, 0, 'XYZ')
const BOARD_CELLS = [
  new THREE.Vector3(-4, 0, -4),
  new THREE.Vector3(0, 0, -4),
  new THREE.Vector3(4, 0, -4),
  new THREE.Vector3(-4, 0, 0),
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(4, 0, 0),
  new THREE.Vector3(-4, 0, 4),
  new THREE.Vector3(0, 0, 4),
  new THREE.Vector3(4, 0, 4)
]
const BOARD_CELL_SPACING = 4
const BOARD_FIELD_SIZE = 3.6
const BOARD_OBJECT_AREA_FILL_RATIO = 0.75
const BOARD_OBJECT_BASE_SCALE = BOARD_FIELD_SIZE * Math.sqrt(BOARD_OBJECT_AREA_FILL_RATIO)
const HOVER_SCALE = 1.08
const HOVER_DAMPING = 16
const DRAG_LIFT = 0.9
const WIGGLE_SPEED = 26
const WIGGLE_DAMPING = 14
const WIGGLE_ANGLE = 0.14
const SPAWN_YAW_VARIATION = Math.PI / 6
const DISAPPEAR_DURATION_SECONDS = 0.18
const DESTRUCT_DURATION_SECONDS = 0.24
const DROP_TARGET_FIELD_HALF_SPAN = BOARD_CELL_SPACING / 2
const TOON_GRADIENT_STEPS = new Uint8Array([32, 96, 160, 255])

function createToonGradientMap(): THREE.DataTexture {
  const gradientMap = new THREE.DataTexture(TOON_GRADIENT_STEPS, TOON_GRADIENT_STEPS.length, 1, THREE.RedFormat)
  gradientMap.colorSpace = THREE.NoColorSpace
  gradientMap.minFilter = THREE.NearestFilter
  gradientMap.magFilter = THREE.NearestFilter
  gradientMap.generateMipmaps = false
  gradientMap.needsUpdate = true
  return gradientMap
}

export class BoardScene {
  #boardPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  #camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
  #ambientLight = new THREE.AmbientLight(0xfff6eb, 1.05)
  #fillLight = new THREE.DirectionalLight(0xe8edf8, 0.95)
  #grabPoint = new THREE.Vector3()
  #boardBaseMaterial = new THREE.MeshBasicMaterial({ color: 0xc4b8a4 })
  #boardDarkMaterial = new THREE.MeshBasicMaterial({ color: 0xcab89d })
  #boardLightMaterial = new THREE.MeshBasicMaterial({ color: 0xf3e6cf })
  #hoverableObjects: SceneObject[] = []
  #keyLight = new THREE.DirectionalLight(0xfff1d6, 2.6)
  #modelsBaseUrl: string
  #onIncorrectDrop: (() => void) | undefined
  #onTaskCompleted: (() => void) | undefined
  #planeIntersection = new THREE.Vector3()
  #pointer = new THREE.Vector2(2, 2)
  #raycaster = new THREE.Raycaster()
  #renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  #scene = new THREE.Scene()
  #sceneRoot: HTMLDivElement
  #spawnLookTarget = new THREE.Vector3()
  #toonGradientMap = createToonGradientMap()

  #activeTask: TaskCandidate | null = null
  #boardCreated = false
  #dragState: DragState | null = null
  #dropTargetObject: SceneObject | null = null
  #hoveredObject: SceneObject | null = null
  #isResolvingRound = false
  #lastFrameTime = performance.now()
  #animationFrameId: number | null = null

  constructor(sceneRoot: HTMLDivElement, options: BoardSceneOptions) {
    this.#onIncorrectDrop = options.onIncorrectDrop
    this.#onTaskCompleted = options.onTaskCompleted
    this.#modelsBaseUrl = options.modelsBaseUrl
    this.#sceneRoot = sceneRoot

    this.#camera.position.copy(CAMERA_POSITION)
    this.#camera.rotation.copy(CAMERA_ROTATION)

    this.#renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.#renderer.setSize(1, 1, false)
    this.#sceneRoot.appendChild(this.#renderer.domElement)

    this.#scene.add(this.#ambientLight)

    this.#keyLight.position.set(6, 12, 8)
    this.#scene.add(this.#keyLight)

    this.#fillLight.position.set(-5, 8, -6)
    this.#scene.add(this.#fillLight)

    window.addEventListener('resize', this.#resizeRenderer)
    this.#renderer.domElement.addEventListener('pointerdown', this.#handlePointerDown)
    this.#renderer.domElement.addEventListener('pointermove', this.#handlePointerMove)
    this.#renderer.domElement.addEventListener('pointerup', this.#handlePointerUp)
    this.#renderer.domElement.addEventListener('pointercancel', this.#handlePointerCancel)
    this.#renderer.domElement.addEventListener('pointerleave', this.#clearHoveredObject)

    this.#animationFrameId = window.requestAnimationFrame(this.#animate)
  }

  async initialize(placedObjects: PlacedObject[]): Promise<void> {
    if (!this.#boardCreated) {
      this.#createBoard()
      this.#boardCreated = true
    }

    this.#clearPlacedObjects()
    await this.#placeObjects(placedObjects)
    this.#isResolvingRound = false
    this.#resizeRenderer()
  }

  setActiveTask(task: TaskCandidate | null): void {
    this.#activeTask = task
  }

  // Not in the original (see file header) - releases the WebGL context and
  // stops the render loop when the Vue component unmounts.
  dispose(): void {
    if (this.#animationFrameId !== null) {
      window.cancelAnimationFrame(this.#animationFrameId)
      this.#animationFrameId = null
    }

    window.removeEventListener('resize', this.#resizeRenderer)
    this.#renderer.domElement.removeEventListener('pointerdown', this.#handlePointerDown)
    this.#renderer.domElement.removeEventListener('pointermove', this.#handlePointerMove)
    this.#renderer.domElement.removeEventListener('pointerup', this.#handlePointerUp)
    this.#renderer.domElement.removeEventListener('pointercancel', this.#handlePointerCancel)
    this.#renderer.domElement.removeEventListener('pointerleave', this.#clearHoveredObject)

    this.#clearPlacedObjects()
    this.#renderer.dispose()
    this.#renderer.domElement.remove()
  }

  #animate = (now: number) => {
    const deltaSeconds = Math.min((now - this.#lastFrameTime) / 1000, 0.05)
    this.#lastFrameTime = now

    this.#hoverableObjects.forEach((sceneObject) => {
      const isHighlighted =
        (!this.#dragState && sceneObject === this.#hoveredObject) ||
        (this.#dragState !== null && sceneObject === this.#dropTargetObject)

      sceneObject.highlightStrength = THREE.MathUtils.damp(sceneObject.highlightStrength, isHighlighted ? 1 : 0, HOVER_DAMPING, deltaSeconds)
      sceneObject.wiggleStrength = THREE.MathUtils.damp(sceneObject.wiggleStrength, 0, WIGGLE_DAMPING, deltaSeconds)
      sceneObject.wigglePhase += deltaSeconds * WIGGLE_SPEED
      sceneObject.wrapper.rotation.z = Math.sin(sceneObject.wigglePhase) * sceneObject.wiggleStrength * WIGGLE_ANGLE

      this.#applySceneObjectScale(sceneObject)
    })

    this.#renderer.render(this.#scene, this.#camera)
    this.#animationFrameId = window.requestAnimationFrame(this.#animate)
  }

  #applySceneObjectScale(sceneObject: SceneObject): void {
    const highlightScale = THREE.MathUtils.lerp(1, HOVER_SCALE, sceneObject.highlightStrength)
    sceneObject.wrapper.scale.setScalar(sceneObject.baseScale * sceneObject.effectScale * highlightScale)
  }

  #clearHoveredObject = () => {
    if (this.#dragState || this.#isResolvingRound) {
      return
    }

    this.#pointer.set(2, 2)
    this.#hoveredObject = null
  }

  #clearPlacedObjects(): void {
    this.#hoverableObjects.forEach((sceneObject) => {
      sceneObject.wrapper.removeFromParent()
    })
    this.#hoverableObjects.length = 0
    this.#dragState = null
    this.#dropTargetObject = null
    this.#hoveredObject = null
    this.#pointer.set(2, 2)
  }

  #createBoard(): void {
    const boardBase = new THREE.Mesh(new THREE.PlaneGeometry(BOARD_CELL_SPACING * 3.25, BOARD_CELL_SPACING * 3.25), this.#boardBaseMaterial)
    const squareGeometry = new THREE.PlaneGeometry(BOARD_FIELD_SIZE, BOARD_FIELD_SIZE)

    boardBase.rotation.x = -Math.PI / 2
    boardBase.position.set(0, -0.03, 0)
    this.#scene.add(boardBase)

    BOARD_CELLS.forEach((cell, index) => {
      const row = Math.floor(index / 3)
      const column = index % 3
      const square = new THREE.Mesh(squareGeometry, (row + column) % 2 === 0 ? this.#boardLightMaterial : this.#boardDarkMaterial)

      square.rotation.x = -Math.PI / 2
      square.position.set(cell.x, -0.02, cell.z)
      this.#scene.add(square)
    })
  }

  #createToonMaterial(source: THREE.Material): THREE.MeshToonMaterial {
    const material = source as THREE.MeshStandardMaterial | THREE.MeshBasicMaterial | THREE.MeshLambertMaterial

    return new THREE.MeshToonMaterial({
      alphaTest: 'alphaTest' in material ? material.alphaTest : 0,
      color: 'color' in material ? material.color.clone() : new THREE.Color(0xffffff),
      gradientMap: this.#toonGradientMap,
      map: 'map' in material ? material.map : null,
      opacity: material.opacity,
      side: material.side,
      transparent: material.transparent,
      vertexColors: material.vertexColors
    })
  }

  #applyToonShading(model: THREE.Object3D): void {
    model.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) {
        return
      }

      if (Array.isArray(child.material)) {
        child.material = child.material.map((material) => this.#createToonMaterial(material))
        return
      }

      child.material = this.#createToonMaterial(child.material)
    })
  }

  #findSceneObject(target: THREE.Object3D | null): SceneObject | null {
    let current: THREE.Object3D | null = target

    while (current) {
      const sceneObject = current.userData.sceneObject as SceneObject | undefined

      if (sceneObject) {
        return sceneObject
      }

      current = current.parent
    }

    return null
  }

  #findDropTarget(draggedObject: SceneObject, boardPoint: THREE.Vector3): SceneObject | null {
    const fieldCandidates: SceneObject[] = []

    this.#hoverableObjects.forEach((sceneObject) => {
      if (sceneObject === draggedObject || !sceneObject.wrapper.visible) {
        return
      }

      if (
        Math.abs(boardPoint.x - sceneObject.homePosition.x) <= DROP_TARGET_FIELD_HALF_SPAN &&
        Math.abs(boardPoint.z - sceneObject.homePosition.z) <= DROP_TARGET_FIELD_HALF_SPAN
      ) {
        fieldCandidates.push(sceneObject)
      }
    })

    if (fieldCandidates.length > 0) {
      let closestTarget = fieldCandidates[0]
      let closestDistanceSquared = boardPoint.distanceToSquared(closestTarget.homePosition)

      fieldCandidates.slice(1).forEach((sceneObject) => {
        const distanceSquared = boardPoint.distanceToSquared(sceneObject.homePosition)

        if (distanceSquared < closestDistanceSquared) {
          closestTarget = sceneObject
          closestDistanceSquared = distanceSquared
        }
      })

      return closestTarget
    }

    let bestTarget: SceneObject | null = null
    let bestDistanceSquared = Number.POSITIVE_INFINITY

    this.#hoverableObjects.forEach((sceneObject) => {
      if (sceneObject === draggedObject || !sceneObject.wrapper.visible) {
        return
      }

      const dx = draggedObject.wrapper.position.x - sceneObject.wrapper.position.x
      const dz = draggedObject.wrapper.position.z - sceneObject.wrapper.position.z
      const distanceSquared = dx * dx + dz * dz
      const collisionDistance = draggedObject.radius * draggedObject.baseScale + sceneObject.radius * sceneObject.baseScale

      if (distanceSquared > collisionDistance * collisionDistance) {
        return
      }

      if (distanceSquared < bestDistanceSquared) {
        bestDistanceSquared = distanceSquared
        bestTarget = sceneObject
      }
    })

    return bestTarget
  }

  #handlePointerCancel = (event: PointerEvent) => {
    void this.#stopDrag(event, false)
  }

  #handlePointerDown = (event: PointerEvent) => {
    this.#startDrag(event)
  }

  #handlePointerMove = (event: PointerEvent) => {
    if (!this.#setPointerFromEvent(event)) {
      return
    }

    if (this.#dragState?.pointerId === event.pointerId) {
      this.#updateDraggedObjectPosition()
      return
    }

    this.#updateHoveredObject()
  }

  #handlePointerUp = (event: PointerEvent) => {
    void this.#stopDrag(event, true)
  }

  #hideSceneObject(sceneObject: SceneObject): void {
    sceneObject.wrapper.visible = false
    sceneObject.highlightStrength = 0
    sceneObject.wiggleStrength = 0
    sceneObject.effectScale = 1
    this.#applySceneObjectScale(sceneObject)
  }

  #measureModelRadius(model: THREE.Object3D): { center: THREE.Vector3; halfExtents: THREE.Vector3; radius: number } {
    const box = new THREE.Box3().setFromObject(model)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())

    return {
      center,
      halfExtents: new THREE.Vector3(Math.max(size.x / 2, 1e-6), Math.max(size.y / 2, 1e-6), Math.max(size.z / 2, 1e-6)),
      radius: Math.max(size.x, size.z) * 0.45
    }
  }

  #holdAnchorToLocalPosition(sceneObject: SceneObject): THREE.Vector3 {
    const holdPlacement = sceneObject.record.hold

    if (!holdPlacement) {
      return new THREE.Vector3()
    }

    const [anchorX, anchorY, anchorZ] = holdPlacement.anchor

    return sceneObject.modelBoundsCenter
      .clone()
      .add(new THREE.Vector3(anchorX * sceneObject.modelHalfExtents.x, anchorY * sceneObject.modelHalfExtents.y, anchorZ * sceneObject.modelHalfExtents.z))
  }

  #orientSpawnedObjectTowardCamera(wrapper: THREE.Object3D): void {
    this.#spawnLookTarget.set(this.#camera.position.x, wrapper.position.y, this.#camera.position.z)
    wrapper.lookAt(this.#spawnLookTarget)
    wrapper.rotateY(THREE.MathUtils.randFloatSpread(SPAWN_YAW_VARIATION * 2))
  }

  async #loadModel(modelPath: string) {
    const manager = new THREE.LoadingManager()
    const modelFolder = modelPath.slice(0, modelPath.lastIndexOf('/'))

    manager.setURLModifier((url) => {
      if (url.endsWith('Textures/colormap.png')) {
        return `${this.#modelsBaseUrl}${modelFolder}/colormap.png`
      }

      return url
    })

    const loader = new GLTFLoader(manager)

    return loader.loadAsync(`${this.#modelsBaseUrl}${modelPath}`)
  }

  async #placeObjects(placedObjects: PlacedObject[]): Promise<void> {
    const occupiedCells = shuffled(BOARD_CELLS).slice(0, placedObjects.length)

    await Promise.all(
      placedObjects.map(async ({ name: objectName, record }, index) => {
        const cell = occupiedCells[index]

        if (!cell) {
          throw new Error('Not enough grid cells available for the selected objects.')
        }

        const gltf = await this.#loadModel(record.model)
        const wrapper = new THREE.Group()
        this.#applyToonShading(gltf.scene)

        const { center, halfExtents, radius } = this.#measureModelRadius(gltf.scene)

        wrapper.add(gltf.scene)
        wrapper.position.copy(cell)
        this.#orientSpawnedObjectTowardCamera(wrapper)

        const sceneObject: SceneObject = {
          name: objectName,
          record,
          wrapper,
          homePosition: cell.clone(),
          modelBoundsCenter: center,
          modelHalfExtents: halfExtents,
          radius,
          wigglePhase: Math.random() * Math.PI * 2,
          wiggleStrength: 0,
          baseScale: BOARD_OBJECT_BASE_SCALE,
          effectScale: 1,
          highlightStrength: 0
        }

        wrapper.userData.sceneObject = sceneObject
        this.#hoverableObjects.push(sceneObject)
        this.#applySceneObjectScale(sceneObject)
        this.#scene.add(wrapper)
      })
    )
  }

  #projectPointerToBoard(): THREE.Vector3 | null {
    this.#raycaster.setFromCamera(this.#pointer, this.#camera)
    return this.#raycaster.ray.intersectPlane(this.#boardPlane, this.#planeIntersection)
  }

  #resizeRenderer = () => {
    const { clientWidth, clientHeight } = this.#sceneRoot

    if (!clientWidth || !clientHeight) {
      return
    }

    this.#camera.aspect = clientWidth / clientHeight
    this.#camera.updateProjectionMatrix()
    this.#renderer.setSize(clientWidth, clientHeight, true)
    this.#renderer.render(this.#scene, this.#camera)
  }

  #runAnimation(durationSeconds: number, onFrame: (progress: number) => void): Promise<void> {
    return new Promise((resolve) => {
      if (durationSeconds <= 0) {
        onFrame(1)
        resolve()
        return
      }

      const startTime = performance.now()

      const tick = (now: number) => {
        const progress = Math.min((now - startTime) / (durationSeconds * 1000), 1)
        onFrame(progress)

        if (progress < 1) {
          window.requestAnimationFrame(tick)
          return
        }

        resolve()
      }

      window.requestAnimationFrame(tick)
    })
  }

  #setPointerFromEvent(event: PointerEvent): boolean {
    const bounds = this.#renderer.domElement.getBoundingClientRect()

    if (!bounds.width || !bounds.height) {
      return false
    }

    this.#pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1
    this.#pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1

    return true
  }

  #startDrag(event: PointerEvent): void {
    if (this.#dragState || this.#isResolvingRound || !this.#activeTask) {
      return
    }

    if (!this.#setPointerFromEvent(event)) {
      return
    }

    this.#updateHoveredObject()

    if (!this.#hoveredObject) {
      return
    }

    const point = this.#projectPointerToBoard()

    if (!point) {
      return
    }

    const object = this.#hoveredObject
    this.#dragState = {
      object,
      pointerId: event.pointerId,
      grabOffset: this.#grabPoint.copy(object.wrapper.position).sub(point).clone()
    }
    object.wrapper.position.y = DRAG_LIFT
    this.#hoveredObject = null
    this.#renderer.domElement.setPointerCapture(event.pointerId)
    this.#updateDraggedObjectPosition()
  }

  async #stopDrag(event: PointerEvent, countIncorrectDrop: boolean): Promise<void> {
    if (!this.#dragState || this.#dragState.pointerId !== event.pointerId) {
      return
    }

    if (this.#setPointerFromEvent(event)) {
      this.#updateDraggedObjectPosition()
    }

    if (this.#renderer.domElement.hasPointerCapture(event.pointerId)) {
      this.#renderer.domElement.releasePointerCapture(event.pointerId)
    }

    const draggedObject = this.#dragState.object
    const dropTarget = this.#dropTargetObject

    this.#dragState = null
    this.#dropTargetObject = null

    if (!this.#isSuccessfulDrop(draggedObject, dropTarget)) {
      draggedObject.wrapper.position.copy(draggedObject.homePosition)
      this.#updateHoveredObject()

      if (countIncorrectDrop && dropTarget) {
        this.#onIncorrectDrop?.()
      }

      return
    }

    this.#isResolvingRound = true
    this.#hoveredObject = null
    draggedObject.wrapper.position.y = draggedObject.homePosition.y
    this.#onTaskCompleted?.()
    await this.#resolveSuccessfulDrop(draggedObject, dropTarget as SceneObject)
  }

  #triggerWiggle(sceneObject: SceneObject): void {
    sceneObject.wiggleStrength = 1
  }

  async #applyDisappearEffect(sceneObject: SceneObject): Promise<void> {
    sceneObject.highlightStrength = 0

    await this.#runAnimation(DISAPPEAR_DURATION_SECONDS, (progress) => {
      sceneObject.effectScale = THREE.MathUtils.lerp(1, 0.12, progress * progress)
    })

    this.#hideSceneObject(sceneObject)
  }

  async #applyDestructEffect(sceneObject: SceneObject): Promise<void> {
    sceneObject.highlightStrength = 0

    const startPosition = sceneObject.wrapper.position.clone()

    await this.#runAnimation(DESTRUCT_DURATION_SECONDS, (progress) => {
      const intensity = 1 - progress
      const pulse = 1 + Math.sin(progress * Math.PI * 4.5) * 0.26 + intensity * 0.2

      sceneObject.effectScale = pulse
      sceneObject.wrapper.position.set(
        startPosition.x + THREE.MathUtils.randFloatSpread(0.42 * intensity),
        startPosition.y + THREE.MathUtils.randFloatSpread(0.2 * intensity),
        startPosition.z + THREE.MathUtils.randFloatSpread(0.42 * intensity)
      )
    })

    sceneObject.wrapper.position.copy(startPosition)
    this.#hideSceneObject(sceneObject)
  }

  #applyHeldEffect(sourceObject: SceneObject, targetObject: SceneObject): Promise<void> {
    const holdPlacement = targetObject.record.hold

    if (!holdPlacement) {
      return this.#applyDisappearEffect(sourceObject)
    }

    targetObject.wrapper.add(sourceObject.wrapper)
    sourceObject.wrapper.position.copy(this.#holdAnchorToLocalPosition(targetObject))
    sourceObject.wrapper.rotation.set(0, 0, 0)
    sourceObject.baseScale = holdPlacement.scale
    sourceObject.effectScale = 1
    sourceObject.highlightStrength = 0
    this.#applySceneObjectScale(sourceObject)

    return Promise.resolve()
  }

  #applyRelationshipEffect(effect: RelationshipEffect, sceneObject: SceneObject, counterpartObject: SceneObject): Promise<void> {
    switch (effect) {
      case 'NOTHING':
        return Promise.resolve()
      case 'RETURN':
        sceneObject.wrapper.position.copy(sceneObject.homePosition)
        return Promise.resolve()
      case 'DISAPPEAR':
        return this.#applyDisappearEffect(sceneObject)
      case 'DESTRUCT':
        return this.#applyDestructEffect(sceneObject)
      case 'WIGGLE':
        this.#triggerWiggle(sceneObject)
        return Promise.resolve()
      case 'HELD':
        return this.#applyHeldEffect(sceneObject, counterpartObject)
      default:
        return Promise.resolve()
    }
  }

  #isSuccessfulDrop(draggedObject: SceneObject, dropTarget: SceneObject | null): boolean {
    if (!this.#activeTask || !dropTarget) {
      return false
    }

    return draggedObject.name === this.#activeTask.sourceName && dropTarget.name === this.#activeTask.targetName
  }

  async #resolveSuccessfulDrop(draggedObject: SceneObject, dropTarget: SceneObject): Promise<void> {
    if (!this.#activeTask) {
      return
    }

    await Promise.all([
      this.#applyRelationshipEffect(this.#activeTask.sourceEffect, draggedObject, dropTarget),
      this.#applyRelationshipEffect(this.#activeTask.targetEffect, dropTarget, draggedObject)
    ])
  }

  #updateDraggedObjectPosition(): void {
    if (!this.#dragState) {
      return
    }

    const point = this.#projectPointerToBoard()

    if (!point) {
      return
    }

    this.#dragState.object.wrapper.position.copy(point).add(this.#dragState.grabOffset)
    this.#dragState.object.wrapper.position.y = DRAG_LIFT
    this.#dropTargetObject = this.#findDropTarget(this.#dragState.object, point)
  }

  #updateHoveredObject(): void {
    if (this.#dragState || this.#isResolvingRound) {
      this.#hoveredObject = null
      return
    }

    this.#raycaster.setFromCamera(this.#pointer, this.#camera)

    const intersections = this.#raycaster.intersectObjects(
      this.#hoverableObjects.map(({ wrapper }) => wrapper),
      true
    )

    this.#hoveredObject = this.#findSceneObject(intersections[0]?.object ?? null)
  }
}
