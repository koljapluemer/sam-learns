import { ref } from 'vue'

// Pointer-events drag and drop that works the same for mouse, touch and pen.
// Draggables are also drop targets: bind() each element and mark it with
// `data-drop-id`. Pointer capture keeps move/up events on the dragged element
// wherever the pointer goes; on release, the element under the pointer (other
// than the dragged one) is the drop target. Elements need `touch-action: none`
// so touch drags don't scroll the page.
export function usePointerDrag(onDrop: (sourceId: string, targetId: string) => void) {
  const draggingId = ref<string | null>(null)
  const offset = ref({ x: 0, y: 0 })
  let start = { x: 0, y: 0 }

  function reset() {
    draggingId.value = null
    offset.value = { x: 0, y: 0 }
  }

  function dropTargetAt(x: number, y: number, sourceId: string): string | undefined {
    return document
      .elementsFromPoint(x, y)
      .map((element) => element.closest<HTMLElement>('[data-drop-id]')?.dataset.dropId)
      .find((id) => id !== undefined && id !== sourceId)
  }

  function bind(id: string) {
    return {
      onPointerdown(event: PointerEvent) {
        if (!event.isPrimary || event.button !== 0) return
        ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
        draggingId.value = id
        start = { x: event.clientX, y: event.clientY }
      },
      onPointermove(event: PointerEvent) {
        if (draggingId.value !== id) return
        offset.value = { x: event.clientX - start.x, y: event.clientY - start.y }
      },
      onPointerup(event: PointerEvent) {
        if (draggingId.value !== id) return
        reset()
        const targetId = dropTargetAt(event.clientX, event.clientY, id)
        if (targetId) onDrop(id, targetId)
      },
      onPointercancel: reset
    }
  }

  return { draggingId, offset, bind }
}
