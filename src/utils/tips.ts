export type TipEvent = 'first-ready' | 'game-started' | 'first-grading'

const TIP_POOL: Record<TipEvent, string> = {
  'first-ready': 'tip.ready',
  'game-started': 'tip.gameStarted',
  'first-grading': 'tip.grading',
}

const shownTips = new Set<string>()

export function getTipForEvent(event: TipEvent): string | null {
  if (shownTips.has(event)) return null
  shownTips.add(event)
  return TIP_POOL[event]
}

export function resetTips(): void {
  shownTips.clear()
}
