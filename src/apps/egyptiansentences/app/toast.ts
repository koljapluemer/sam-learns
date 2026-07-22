// Small vanilla toast helper, ported unchanged from linguanodon's
// egyptiansentences app/toast.js - built on daisyUI's toast/alert classes
// (already used throughout this repo) rather than a Vue-reactive queue,
// since it's simple, self-contained DOM manipulation outside Vue's render.

export type ToastVariant = 'success' | 'error' | 'info'

const DISMISS_DELAY_MS = 2500

let container: HTMLDivElement | null = null

function getContainer(): HTMLDivElement {
  if (container) return container
  container = document.createElement('div')
  // toast-bottom (not toast-top) so this never overlaps the app's own header/subnav.
  container.className = 'toast toast-bottom toast-end z-50'
  document.body.appendChild(container)
  return container
}

export function showToast(message: string, variant: ToastVariant = 'info'): void {
  const alertEl = document.createElement('div')
  alertEl.className = `alert alert-${variant} shadow-sm`
  alertEl.textContent = message

  const host = getContainer()
  host.appendChild(alertEl)
  window.setTimeout(() => alertEl.remove(), DISMISS_DELAY_MS)
}
