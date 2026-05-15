const TYPE_LIMITS: Record<string, { maxHits: number; windowMs: number }> = {
  'chat-message': { maxHits: 5, windowMs: 10_000 },
  'vote': { maxHits: 15, windowMs: 10_000 },
  'player-ready': { maxHits: 3, windowMs: 5_000 },
  'settings-update': { maxHits: 2, windowMs: 5_000 },
}

const DEFAULT_LIMIT = { maxHits: 20, windowMs: 10_000 }
const VIOLATION_WINDOW_MS = 60_000
const MUTE_DURATION_MS = 30_000
const MUTE_VIOLATION_THRESHOLD = 4

interface RateEntry {
  timestamps: Map<string, number[]>
  violations: number[]
  mutedUntil: number
}

export class RateLimiter {
  private entries = new Map<string, RateEntry>()

  allow(connId: string, msgType: string, isAdmin: boolean): boolean {
    if (isAdmin) return true

    const now = Date.now()
    let entry = this.entries.get(connId)
    if (!entry) {
      entry = { timestamps: new Map(), violations: [], mutedUntil: 0 }
      this.entries.set(connId, entry)
    }

    if (now < entry.mutedUntil) return false

    entry.violations = entry.violations.filter(t => now - t < VIOLATION_WINDOW_MS)

    const { maxHits, windowMs } = TYPE_LIMITS[msgType] ?? DEFAULT_LIMIT
    let hits = entry.timestamps.get(msgType)
    if (!hits) {
      hits = []
      entry.timestamps.set(msgType, hits)
    }
    hits = hits.filter(t => now - t < windowMs)
    entry.timestamps.set(msgType, hits)

    if (hits.length >= maxHits) {
      entry.violations.push(now)
      if (entry.violations.length >= MUTE_VIOLATION_THRESHOLD) {
        entry.mutedUntil = now + MUTE_DURATION_MS
        console.warn(`[RateLimiter] ${connId} muted for ${MUTE_DURATION_MS}ms (${entry.violations.length} violations)`)
      } else {
        console.warn(`[RateLimiter] ${connId} violation ${entry.violations.length} on ${msgType}`)
      }
      return false
    }

    hits.push(now)
    return true
  }

  reset(connId: string): void {
    this.entries.delete(connId)
  }
}
