export type ConnectionStatus = 'idle' | 'connected' | 'reconnecting' | 'disconnected'

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
  isSpectator: boolean
}

export interface GameSettings {
  categories: string[]
  totalRounds: number
  roundDuration: number | null
  letterPool: string[]
  customCategories: string[]
  roomPassword?: string
  locale?: string
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
  | 'admin-transfer-request'
  | 'ping'
  | 'pong'
  | 'join-rejected'
  | 'spectate-request'
  | 'countdown-sync'
  | 'countdown-cancel'

export interface JoinRoomPayload {
  id: string
  nickname: string
  password?: string
  isSpectator?: boolean
}

export interface CountdownSyncPayload {
  remaining: number
}

export interface SpectateRequestPayload {
  playerId: string
  nickname: string
}

export interface JoinRejectedPayload {
  reason: 'wrong-password' | 'room-full' | 'duplicate-nickname'
}

export interface PlayerReadyPayload {
  playerId: string
  ready: boolean
}

export interface RoundStartPayload {
  letter: string
}

export interface AnswersSubmitPayload {
  answers: Answer[]
}

export interface RoundEndPayload {
  roundScores: Record<string, number>
  updatedPlayers: Player[]
}

export interface PlayerDisconnectedPayload {
  playerId: string
}

export interface AdminTransferPayload {
  newAdminId: string
}

export interface RoomStateSyncPayload {
  room: GameRoom
}

export interface ReconnectPayload {
  playerId: string
  nickname: string
}

export interface ReconnectAcceptedPayload {
  room: GameRoom
  timer: number | null
}

export type SettingsUpdatePayload = Record<string, unknown>

export interface PeerMessagePayloadMap {
  'join-room': JoinRoomPayload
  'player-ready': PlayerReadyPayload
  'game-start': Record<string, never>
  'round-start': RoundStartPayload
  'answers-submit': AnswersSubmitPayload
  'vote': Vote
  'round-end': RoundEndPayload
  'chat-message': ChatMessage
  'settings-update': SettingsUpdatePayload
  'player-disconnected': PlayerDisconnectedPayload
  'admin-transfer': AdminTransferPayload
  'room-state-sync': RoomStateSyncPayload
  'heartbeat': Record<string, never>
  'reconnect': ReconnectPayload
  'reconnect-accepted': ReconnectAcceptedPayload
  'admin-transfer-request': AdminTransferPayload
  'ping': Record<string, never>
  'pong': Record<string, never>
  'join-rejected': JoinRejectedPayload
  'spectate-request': SpectateRequestPayload
  'countdown-sync': CountdownSyncPayload
  'countdown-cancel': Record<string, never>
}

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

export interface HistoryAnswer {
  category: string
  value: string
  points: number
}

export interface HistoryPlayer {
  nickname: string
  rank: number
  score: number
}

export interface HistoryRound {
  round: number
  letter: string
  yourAnswers: HistoryAnswer[]
}

export interface GameHistoryEntry {
  id: string
  date: string
  roomCode: string
  playerCount: number
  totalRounds: number
  yourNickname: string
  yourRank: number
  yourScore: number
  players: HistoryPlayer[]
  rounds: HistoryRound[]
}
