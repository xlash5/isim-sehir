import { useGameStore } from '../../stores/useGameStore'
import { validateMessage } from '../../utils/messageValidator'
import { RateLimiter } from '../../utils/rateLimiter'
import { sanitizeString } from '../../utils/sanitize'
import type { PeerMessage, Player, GameRoom } from '../../types'

export function resetGameStore(): void {
  useGameStore.setState({
    room: null,
    localPlayerId: null,
    localNickname: null,
    answers: new Map(),
    submittedPlayers: [],
    gradingItems: [],
    myVotes: {},
    chatMessages: [],
    timer: null,
    isSubmitting: false,
    scores: {},
    joinRejectedReason: null,
    countdown: null,
    settingsEditMode: false,
  })
}

export function makePlayer(id: string, nickname: string, overrides: Partial<Player> = {}): Player {
  return { id, nickname, isAdmin: false, isReady: false, score: 0, isSpectator: false, ...overrides }
}

export function createRateLimiter(): RateLimiter {
  return new RateLimiter()
}

export function processMessage(
  senderId: string,
  message: PeerMessage,
  rateLimiter?: RateLimiter,
): PeerMessage[] {
  const validated = validateMessage(message)
  if (!validated) return []

  const store = useGameStore.getState()
  const isAdmin = store.room?.adminId === validated.senderId

  if (rateLimiter && !rateLimiter.allow(senderId, validated.type, isAdmin)) {
    return []
  }

  const responses: PeerMessage[] = []

  switch (validated.type) {
    case 'join-room': {
      const payload = validated.payload as { id: string; nickname: string; password?: string; isSpectator?: boolean }
      const roomPassword = store.room?.settings.roomPassword
      if (roomPassword && payload.password !== roomPassword) {
        responses.push({
          type: 'join-rejected',
          senderId: store.localPlayerId!,
          payload: { reason: 'wrong-password' },
        })
        break
      }
      const cleanNickname = sanitizeString(payload.nickname, 20)
      const isSpectator = payload.isSpectator ?? false
      store.addPlayer({
        id: payload.id,
        nickname: cleanNickname,
        isAdmin: false,
        isReady: false,
        score: 0,
        isSpectator,
      })
      if (useGameStore.getState().room?.adminId === useGameStore.getState().localPlayerId) {
        const fresh = useGameStore.getState()
        responses.push({
          type: 'room-state-sync',
          senderId: fresh.localPlayerId!,
          payload: { room: JSON.parse(JSON.stringify(fresh.room)) },
        })
      }
      break
    }
    case 'room-state-sync': {
      const payload = validated.payload as { room: GameRoom }
      useGameStore.setState({ room: payload.room })
      break
    }
    case 'player-ready': {
      const payload = validated.payload as { playerId: string; ready: boolean }
      store.setPlayerReady(payload.playerId, payload.ready)
      break
    }
    case 'game-start': {
      store.setPhase('wheel')
      break
    }
    case 'round-start': {
      const payload = validated.payload as { letter: string }
      store.setPendingLetter(payload.letter)
      break
    }
    case 'answers-submit': {
      const payload = validated.payload as { answers: import('../../types').Answer[] }
      store.pushAnswersToRound(payload.answers)
      store.markPlayerSubmitted(validated.senderId)
      break
    }
    case 'vote': {
      store.addVote(validated.payload as import('../../types').Vote)
      break
    }
    case 'round-end': {
      const payload = validated.payload as { roundScores: Record<string, number>; updatedPlayers: Player[] }
      store.setScores(payload.roundScores)
      store.updatePlayers(payload.updatedPlayers)
      const state = useGameStore.getState()
      if (state.room && state.room.currentRound >= state.room.settings.totalRounds) {
        store.setPhase('game-over')
      } else {
        store.setPhase('round-results')
      }
      break
    }
    case 'reconnect': {
      const payload = validated.payload as { playerId: string; nickname: string }
      const cleanNickname = sanitizeString(payload.nickname, 20)
      store.addPlayer({
        id: payload.playerId,
        nickname: cleanNickname,
        isAdmin: false,
        isReady: false,
        score: 0,
        isSpectator: false,
      })
      if (useGameStore.getState().room?.adminId === useGameStore.getState().localPlayerId) {
        const fresh = useGameStore.getState()
        responses.push({
          type: 'reconnect-accepted',
          senderId: fresh.localPlayerId!,
          payload: { room: JSON.parse(JSON.stringify(fresh.room)), timer: fresh.timer },
        })
      }
      break
    }
    case 'reconnect-accepted': {
      const payload = validated.payload as { room: GameRoom; timer: number | null }
      useGameStore.setState({ room: payload.room, timer: payload.timer ?? null })
      break
    }
    case 'admin-transfer': {
      const payload = validated.payload as { newAdminId: string }
      store.transferAdmin(payload.newAdminId)
      break
    }
    case 'player-disconnected': {
      const { playerId } = validated.payload as { playerId: string }
      const currentState = useGameStore.getState()
      const wasAdmin = currentState.room?.adminId === playerId
      store.removePlayer(playerId)
      if (wasAdmin) {
        const fresh = useGameStore.getState()
        const remaining = (fresh.room?.players ?? []).filter((p) => !p.isSpectator)
        if (remaining.length > 0) {
          const newAdmin = remaining[0]
          store.transferAdmin(newAdmin.id)
          responses.push({
            type: 'admin-transfer',
            senderId: currentState.localPlayerId!,
            payload: { newAdminId: newAdmin.id },
          })
        }
      }
      break
    }
    case 'chat-message': {
      store.addChatMessage(validated.payload as import('../../types').ChatMessage)
      break
    }
    case 'join-rejected': {
      store.setJoinRejected((validated.payload as { reason: string }).reason)
      break
    }
    case 'settings-update': {
      store.updateSettings(validated.payload as Record<string, unknown>)
      break
    }
    case 'spectate-request': {
      const payload = validated.payload as { playerId: string; nickname: string }
      const cleanSpNickname = sanitizeString(payload.nickname, 20)
      store.addPlayer({
        id: payload.playerId,
        nickname: cleanSpNickname,
        isAdmin: false,
        isReady: false,
        score: 0,
        isSpectator: true,
      })
      if (useGameStore.getState().room?.adminId === useGameStore.getState().localPlayerId) {
        const fresh = useGameStore.getState()
        responses.push({
          type: 'room-state-sync',
          senderId: fresh.localPlayerId!,
          payload: { room: JSON.parse(JSON.stringify(fresh.room)) },
        })
      }
      break
    }
    case 'countdown-sync': {
      store.setCountdown((validated.payload as { remaining: number }).remaining)
      break
    }
    case 'countdown-cancel': {
      store.setCountdown(null)
      break
    }
    default:
      break
  }

  return responses
}
