const SESSION_KEY = 'isim-sehir-session'
const SESSION_TTL = 60 * 60 * 1000

export interface PersistedSession {
  peerId: string
  playerId: string
  nickname: string
  roomCode: string
  timestamp: number
}

export function saveSession(peerId: string, playerId: string, nickname: string, roomCode: string) {
  try {
    const session: PersistedSession = { peerId, playerId, nickname, roomCode, timestamp: Date.now() }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    /* localStorage may be full or unavailable */
  }
}

export function loadSession(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as PersistedSession
    if (!session.peerId || !session.playerId || !session.nickname || !session.roomCode) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    if (Date.now() - session.timestamp > SESSION_TTL) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return session
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    /* noop */
  }
}
