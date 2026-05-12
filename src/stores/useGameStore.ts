import { create } from 'zustand'
import type { GameRoom, Player, GameSettings, Round, Answer, Vote, ChatMessage, GamePhase, GradingItem } from '../types'
import { TURKISH_LETTERS } from '../utils/letters'

interface GameState {
  room: GameRoom | null
  localPlayerId: string | null
  localNickname: string | null
  answers: Map<string, string>
  gradingItems: GradingItem[]
  currentGradingIndex: number
  currentAnswerIndex: number
  myVotes: Record<string, boolean>
  chatMessages: ChatMessage[]
  timer: number | null
  isSubmitting: boolean
  scores: Record<string, number>

  setLocalPlayer: (id: string, nickname: string) => void
  createRoom: () => void
  joinRoom: (code: string) => void
  addPlayer: (player: Player) => void
  removePlayer: (playerId: string) => void
  setPlayerReady: (playerId: string, ready: boolean) => void
  updateSettings: (settings: Partial<GameSettings>) => void
  setPhase: (phase: GamePhase) => void
  startRound: (letter: string) => void
  setAnswer: (category: string, value: string) => void
  submitAnswers: () => Answer[]
  setGradingItems: (items: GradingItem[]) => void
  setVote: (answerId: string, isValid: boolean) => void
  addVote: (vote: Vote) => void
  setScores: (scores: Record<string, number>) => void
  setTimer: (value: number | null) => void
  tickTimer: () => void
  addChatMessage: (msg: ChatMessage) => void
  addRound: (round: Round) => void
  nextRound: () => void
  resetGame: () => void
  resetRoom: () => void
}

const defaultSettings: GameSettings = {
  categories: [],
  totalRounds: 3,
  roundDuration: 60,
  letterPool: TURKISH_LETTERS,
}

export const useGameStore = create<GameState>((set, get) => ({
  room: null,
  localPlayerId: null,
  localNickname: null,
  answers: new Map(),
  gradingItems: [],
  currentGradingIndex: 0,
  currentAnswerIndex: 0,
  myVotes: {},
  chatMessages: [],
  timer: null,
  isSubmitting: false,
  scores: {},

  setLocalPlayer: (id, nickname) => set({ localPlayerId: id, localNickname: nickname }),

  createRoom: () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const id = get().localPlayerId ?? crypto.randomUUID()
    const nickname = get().localNickname ?? 'Oyuncu'
    const player: Player = { id, nickname, isAdmin: true, isReady: false, score: 0 }
    const room: GameRoom = {
      code,
      adminId: id,
      players: [player],
      settings: { ...defaultSettings },
      phase: 'lobby',
      currentRound: 0,
      currentLetter: null,
      rounds: [],
    }
    set({ room, localPlayerId: id })
  },

  joinRoom: (code) => {
    const id = get().localPlayerId ?? crypto.randomUUID()
    const nickname = get().localNickname ?? 'Oyuncu'
    const player: Player = { id, nickname, isAdmin: false, isReady: false, score: 0 }
    set((state) => {
      if (!state.room) {
        const room: GameRoom = {
          code,
          adminId: '',
          players: [player],
          settings: { ...defaultSettings },
          phase: 'lobby',
          currentRound: 0,
          currentLetter: null,
          rounds: [],
        }
        return { room, localPlayerId: id }
      }
      const exists = state.room.players.find((p) => p.nickname === nickname)
      if (exists) return state
      return {
        room: { ...state.room, players: [...state.room.players, player] },
        localPlayerId: id,
      }
    })
  },

  addPlayer: (player) =>
    set((state) => {
      if (!state.room) return state
      const exists = state.room.players.find((p) => p.id === player.id)
      if (exists) return state
      return { room: { ...state.room, players: [...state.room.players, player] } }
    }),

  removePlayer: (playerId) =>
    set((state) => {
      if (!state.room) return state
      return {
        room: {
          ...state.room,
          players: state.room.players.filter((p) => p.id !== playerId),
        },
      }
    }),

  setPlayerReady: (playerId, ready) =>
    set((state) => {
      if (!state.room) return state
      return {
        room: {
          ...state.room,
          players: state.room.players.map((p) =>
            p.id === playerId ? { ...p, isReady: ready } : p,
          ),
        },
      }
    }),

  updateSettings: (settings) =>
    set((state) => {
      if (!state.room) return state
      return {
        room: {
          ...state.room,
          settings: { ...state.room.settings, ...settings },
        },
      }
    }),

  setPhase: (phase) =>
    set((state) => {
      if (!state.room) return state
      return { room: { ...state.room, phase } }
    }),

  startRound: (letter) =>
    set((state) => {
      if (!state.room) return state
      return {
        room: {
          ...state.room,
          currentLetter: letter,
          currentRound: state.room.currentRound + 1,
          phase: 'answering',
        },
        answers: new Map(),
        isSubmitting: false,
      }
    }),

  setAnswer: (category, value) =>
    set((state) => {
      const answers = new Map(state.answers)
      answers.set(category, value)
      return { answers }
    }),

  submitAnswers: () => {
    const state = get()
    const answers: Answer[] = []
    for (const [category, value] of state.answers) {
      answers.push({ playerId: state.localPlayerId!, category, value })
    }
    set({ isSubmitting: true })
    return answers
  },

  setGradingItems: (items) =>
    set({ gradingItems: items, currentGradingIndex: 0, currentAnswerIndex: 0, myVotes: {} }),

  setVote: (answerId, isValid) =>
    set((state) => ({ myVotes: { ...state.myVotes, [answerId]: isValid } })),

  addVote: (vote) =>
    set((state) => {
      if (!state.room) return state
      const rounds = [...state.room.rounds]
      const currentRound = rounds[rounds.length - 1]
      if (currentRound) {
        currentRound.votes.push(vote)
      }
      return { room: { ...state.room, rounds } }
    }),

  setScores: (scores) => set({ scores }),

  setTimer: (value) => set({ timer: value }),

  tickTimer: () =>
    set((state) => {
      if (state.timer !== null && state.timer > 0) {
        return { timer: state.timer - 1 }
      }
      return state
    }),

  addChatMessage: (msg) =>
    set((state) => ({ chatMessages: [...state.chatMessages, msg] })),

  addRound: (round) =>
    set((state) => {
      if (!state.room) return state
      return { room: { ...state.room, rounds: [...state.room.rounds, round] } }
    }),

  nextRound: () =>
    set((state) => {
      if (!state.room) return state
      return {
        room: {
          ...state.room,
          currentLetter: null,
          phase: 'wheel',
        },
        answers: new Map(),
        isSubmitting: false,
        myVotes: {},
        gradingItems: [],
        currentGradingIndex: 0,
        currentAnswerIndex: 0,
      }
    }),

  resetGame: () =>
    set((state) => {
      if (!state.room) return state
      return {
        room: {
          ...state.room,
          phase: 'lobby',
          currentRound: 0,
          currentLetter: null,
          rounds: [],
          players: state.room.players.map((p) => ({ ...p, isReady: false, score: 0 })),
        },
        answers: new Map(),
        gradingItems: [],
        currentGradingIndex: 0,
        currentAnswerIndex: 0,
        myVotes: {},
        timer: null,
        isSubmitting: false,
        scores: {},
      }
    }),

  resetRoom: () =>
    set({
      room: null,
      answers: new Map(),
      gradingItems: [],
      currentGradingIndex: 0,
      currentAnswerIndex: 0,
      myVotes: {},
      chatMessages: [],
      timer: null,
      isSubmitting: false,
      scores: {},
    }),
}))
