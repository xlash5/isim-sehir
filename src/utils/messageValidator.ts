import type { PeerMessage, PeerMessageType, Answer } from '../types'

const VALID_TYPES = new Set<PeerMessageType>([
  'join-room', 'player-ready', 'game-start', 'round-start',
  'answers-submit', 'vote', 'round-end', 'chat-message',
  'settings-update', 'player-disconnected', 'admin-transfer',
  'room-state-sync', 'heartbeat', 'reconnect', 'reconnect-accepted',
  'admin-transfer-request', 'ping', 'pong', 'join-rejected', 'spectate-request',
])

function isString(v: unknown): v is string {
  return typeof v === 'string'
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isNumber(v: unknown): v is number {
  return typeof v === 'number' && !Number.isNaN(v)
}

function isBoolean(v: unknown): v is boolean {
  return typeof v === 'boolean'
}

function isAnswerArray(v: unknown): v is Answer[] {
  if (!Array.isArray(v)) return false
  return v.every(
    (item) =>
      isRecord(item) &&
      isString(item.playerId) && item.playerId.length > 0 &&
      isString(item.category) &&
      isString(item.value),
  )
}

const NICKNAME_MAX = 20
const TEXT_MAX = 500
const ANSWERS_MAX_ITEMS = 35

const validators: Record<string, (payload: unknown) => boolean> = {
  'join-room': (p) => {
    if (!isRecord(p)) return false
    if (!isString(p.id) || p.id.length === 0) return false
    if (!isString(p.nickname) || p.nickname.length === 0 || p.nickname.length > NICKNAME_MAX) return false
    return /^[a-zA-Z0-9 çÇğĞıİöÖşŞüÜ]+$/.test(p.nickname)
  },
  'player-ready': (p) => {
    if (!isRecord(p)) return false
    if (!isString(p.playerId) || p.playerId.length === 0) return false
    return isBoolean(p.ready)
  },
  'game-start': (p) => p === undefined || (isRecord(p) && Object.keys(p).length === 0),
  'round-start': (p) => {
    if (!isRecord(p)) return false
    return isString(p.letter) && p.letter.length > 0
  },
  'answers-submit': (p) => {
    if (!isRecord(p)) return false
    if (!Array.isArray(p.answers)) return false
    if (p.answers.length > ANSWERS_MAX_ITEMS) return false
    return isAnswerArray(p.answers)
  },
  'vote': (p) => {
    if (!isRecord(p)) return false
    if (!isString(p.voterId) || p.voterId.length === 0) return false
    if (!isString(p.answerId) || p.answerId.length === 0) return false
    return isBoolean(p.isValid)
  },
  'round-end': (p) => {
    if (!isRecord(p)) return false
    if (!isRecord(p.roundScores)) return false
    if (!Array.isArray(p.updatedPlayers)) return false
    return true
  },
  'chat-message': (p) => {
    if (!isRecord(p)) return false
    if (!isString(p.playerId) || p.playerId.length === 0) return false
    if (!isString(p.nickname) || p.nickname.length === 0) return false
    if (!isString(p.text) || p.text.length > TEXT_MAX) return false
    return isNumber(p.timestamp)
  },
  'settings-update': (p) => isRecord(p),
  'player-disconnected': (p) => {
    if (!isRecord(p)) return false
    return isString(p.playerId) && p.playerId.length > 0
  },
  'admin-transfer': (p) => {
    if (!isRecord(p)) return false
    return isString(p.newAdminId) && p.newAdminId.length > 0
  },
  'admin-transfer-request': (p) => {
    if (!isRecord(p)) return false
    return isString(p.newAdminId) && p.newAdminId.length > 0
  },
  'room-state-sync': (p) => {
    if (!isRecord(p)) return false
    return isRecord(p.room)
  },
  'heartbeat': (p) => p === undefined || (isRecord(p) && Object.keys(p).length === 0),
  'reconnect': (p) => {
    if (!isRecord(p)) return false
    if (!isString(p.playerId) || p.playerId.length === 0) return false
    return isString(p.nickname) && p.nickname.length > 0
  },
  'reconnect-accepted': (p) => {
    if (!isRecord(p)) return false
    if (!isRecord(p.room)) return false
    return p.timer === null || isNumber(p.timer)
  },
  'ping': (p) => p === undefined || (isRecord(p) && Object.keys(p).length === 0),
  'pong': (p) => p === undefined || (isRecord(p) && Object.keys(p).length === 0),
  'join-rejected': (p) => {
    if (!isRecord(p)) return false
    return isString(p.reason) && ['wrong-password', 'room-full', 'duplicate-nickname'].includes(p.reason)
  },
  'spectate-request': (p) => {
    if (!isRecord(p)) return false
    if (!isString(p.playerId) || p.playerId.length === 0) return false
    return isString(p.nickname) && p.nickname.length > 0
  },
}

export function validateMessage(data: unknown): PeerMessage | null {
  if (!isRecord(data)) return null

  const { type, senderId, payload } = data

  if (!isString(type) || !VALID_TYPES.has(type as PeerMessageType)) return null
  if (!isString(senderId) || senderId.length === 0) return null

  const validator = validators[type]
  if (!validator(payload)) return null

  return { type: type as PeerMessageType, senderId, payload }
}
