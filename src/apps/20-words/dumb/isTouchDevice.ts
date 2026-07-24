export function isTouchDevice(): boolean {
  return window.matchMedia('(hover: none)').matches
}
