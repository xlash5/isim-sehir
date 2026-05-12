import type { Answer, Vote, Player } from '../types'

export function normalizeAnswer(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/[^a-zçğıöşü0-9]/gi, '')
    .trim()
}

export function calculateScore(
  answers: Answer[],
  votes: Vote[],
  allPlayers: Player[],
): Map<string, number> {
  const scores = new Map<string, number>()
  allPlayers.forEach((p) => scores.set(p.id, 0))

  const playerAnswers = new Map<string, Map<string, Answer>>()
  for (const answer of answers) {
    if (!playerAnswers.has(answer.playerId)) {
      playerAnswers.set(answer.playerId, new Map())
    }
    playerAnswers.get(answer.playerId)!.set(answer.category, answer)
  }

  for (const [playerId, catAnswers] of playerAnswers) {
    for (const [category, answer] of catAnswers) {
      if (!answer.value.trim()) continue

      const answerVotes = votes.filter((v) => v.answerId === answerId(answer))
      if (answerVotes.length === 0) continue

      const validVotes = answerVotes.filter((v) => v.isValid)
      const invalidVotes = answerVotes.filter((v) => !v.isValid)
      const isValid = validVotes.length > invalidVotes.length

      if (!isValid) continue

      const normalized = normalizeAnswer(answer.value)
      const isUnique = !Array.from(playerAnswers.entries()).some(
        ([otherId, otherCats]) =>
          otherId !== playerId &&
          otherCats.has(category) &&
          normalizeAnswer(otherCats.get(category)!.value) === normalized &&
          otherCats.get(category)!.value.trim() !== '',
      )

      const currentScore = scores.get(playerId) ?? 0
      scores.set(playerId, currentScore + (isUnique ? 10 : 5))
    }
  }

  return scores
}

function answerId(answer: Answer): string {
  return `${answer.playerId}-${answer.category}`
}
