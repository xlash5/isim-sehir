export type GamePhase =
  | 'lobby'
  | 'wheel'
  | 'answering'
  | 'grading'
  | 'round-results'
  | 'game-over'

export interface Player {
  id: string
  nickname: string
  isAdmin: boolean
  isReady: boolean
  score: number
}

export interface GameSettings {
  categories: string[]
  totalRounds: number
  roundDuration: number | null
  letterPool: string[]
}

export interface Answer {
  playerId: string
  category: string
  value: string
}

export interface Vote {
  voterId: string
  answerId: string
  isValid: boolean
}

export interface Round {
  letter: string
  answers: Answer[]
  votes: Vote[]
}

export interface GameRoom {
  code: string
  adminId: string
  players: Player[]
  settings: GameSettings
  phase: GamePhase
  currentRound: number
  currentLetter: string | null
  pendingLetter: string | null
  rounds: Round[]
}

export interface ChatMessage {
  playerId: string
  nickname: string
  text: string
  timestamp: number
}

export type PeerMessageType =
  | 'join-room'
  | 'player-ready'
  | 'game-start'
  | 'round-start'
  | 'answers-submit'
  | 'vote'
  | 'round-end'
  | 'chat-message'
  | 'settings-update'
  | 'player-disconnected'
  | 'admin-transfer'
  | 'room-state-sync'
  | 'heartbeat'
  | 'reconnect'
  | 'reconnect-accepted'

export interface PeerMessage {
  type: PeerMessageType
  senderId: string
  payload: unknown
}

export interface GradingItem {
  playerId: string
  nickname: string
  answers: { category: string; value: string; answerId: string }[]
}
