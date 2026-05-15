import type { GameRoom, GameHistoryEntry, HistoryRound, HistoryAnswer, HistoryPlayer, Answer, Vote } from '../types'
import { normalizeAnswer } from './scoring'

const HISTORY_KEY = 'isim-sehir-history'
const MAX_ENTRIES = 50

function answerId(answer: Answer): string {
  return `${answer.playerId}-${answer.category}`
}

function computePoints(
  playerId: string,
  answers: Answer[],
  votes: Vote[],
): Map<string, number> {
  const points = new Map<string, number>()

  const playerAnswers = new Map<string, Map<string, Answer>>()
  for (const answer of answers) {
    if (!playerAnswers.has(answer.playerId)) {
      playerAnswers.set(answer.playerId, new Map())
    }
    playerAnswers.get(answer.playerId)!.set(answer.category, answer)
  }

  const myAnswers = playerAnswers.get(playerId)
  if (!myAnswers) return points

  for (const [category, answer] of myAnswers) {
    if (!answer.value.trim()) {
      points.set(category, 0)
      continue
    }

    const answerVotes = votes.filter((v) => v.answerId === answerId(answer))
    if (answerVotes.length === 0) {
      points.set(category, 0)
      continue
    }

    const validVotes = answerVotes.filter((v) => v.isValid)
    const invalidVotes = answerVotes.filter((v) => !v.isValid)
    if (!(validVotes.length > invalidVotes.length)) {
      points.set(category, 0)
      continue
    }

    const normalized = normalizeAnswer(answer.value)
    const isUnique = !Array.from(playerAnswers.entries()).some(
      ([otherId, otherCats]) =>
        otherId !== playerId &&
        otherCats.has(category) &&
        normalizeAnswer(otherCats.get(category)!.value) === normalized &&
        otherCats.get(category)!.value.trim() !== '',
    )

    points.set(category, isUnique ? 10 : 5)
  }

  return points
}

export function saveGameToHistory(room: GameRoom, localPlayerId: string, localNickname: string) {
  try {
    const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score)
    const yourRank = sortedPlayers.findIndex((p) => p.id === localPlayerId) + 1
    const yourScore = sortedPlayers.find((p) => p.id === localPlayerId)?.score ?? 0

    const historyPlayers: HistoryPlayer[] = sortedPlayers.map((p, i) => ({
      nickname: p.nickname,
      rank: i + 1,
      score: p.score,
    }))

    const historyRounds: HistoryRound[] = room.rounds.map((round, i) => {
      const points = computePoints(localPlayerId, round.answers, round.votes)
      const yourAnswers: HistoryAnswer[] = []

      for (const cat of room.settings.categories) {
        const playerAnswer = round.answers.find(
          (a) => a.playerId === localPlayerId && a.category === cat,
        )
        yourAnswers.push({
          category: cat,
          value: playerAnswer?.value ?? '',
          points: points.get(cat) ?? 0,
        })
      }

      return {
        round: i + 1,
        letter: round.letter,
        yourAnswers,
      }
    })

    const entry: GameHistoryEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      roomCode: room.code,
      playerCount: room.players.length,
      totalRounds: room.settings.totalRounds,
      yourNickname: localNickname,
      yourRank,
      yourScore,
      players: historyPlayers,
      rounds: historyRounds,
    }

    const existing = getGameHistory()
    existing.push(entry)
    while (existing.length > MAX_ENTRIES) {
      existing.shift()
    }

    localStorage.setItem(HISTORY_KEY, JSON.stringify(existing))
  } catch {
    /* localStorage may be full or unavailable */
  }
}

export function getGameHistory(): GameHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as GameHistoryEntry[]
  } catch {
    return []
  }
}

export function clearGameHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY)
  } catch {
    /* noop */
  }
}
