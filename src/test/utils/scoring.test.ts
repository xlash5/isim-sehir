import { describe, it, expect } from 'vitest'
import { normalizeAnswer, calculateScore } from '../../utils/scoring'
import type { Answer, Vote, Player } from '../../types'

describe('normalizeAnswer', () => {
  it('lowercases Turkish input', () => {
    expect(normalizeAnswer('İSTANBUL')).toBe('istanbul')
  })

  it('strips non-alphanumeric characters', () => {
    expect(normalizeAnswer('Merhaba! Dünya?')).toBe('merhabadünya')
  })

  it('handles Turkish special characters', () => {
    expect(normalizeAnswer('ÇÖĞÜŞİ')).toBe('çöğüşi')
  })

  it('trims whitespace', () => {
    expect(normalizeAnswer('  ali  ')).toBe('ali')
  })

  it('returns empty string for blank input', () => {
    expect(normalizeAnswer('')).toBe('')
  })

  it('returns empty string for only non-alphanumeric', () => {
    expect(normalizeAnswer('!@#$%^&*()')).toBe('')
  })
})

describe('calculateScore', () => {
  const players: Player[] = [
    { id: 'p1', nickname: 'Alice', isAdmin: true, isReady: false, score: 0, isSpectator: false },
    { id: 'p2', nickname: 'Bob', isAdmin: false, isReady: false, score: 0, isSpectator: false },
  ]

  it('awards 10 points for unique valid answer', () => {
    const answers: Answer[] = [
      { playerId: 'p1', category: 'city', value: 'Ankara' },
      { playerId: 'p2', category: 'city', value: 'Bursa' },
    ]
    const votes: Vote[] = [
      { voterId: 'p2', answerId: 'p1-city', isValid: true },
      { voterId: 'p1', answerId: 'p2-city', isValid: true },
    ]
    const scores = calculateScore(answers, votes, players)
    expect(scores.get('p1')).toBe(10)
    expect(scores.get('p2')).toBe(10)
  })

  it('awards 5 points for shared valid answer', () => {
    const answers: Answer[] = [
      { playerId: 'p1', category: 'city', value: 'Ankara' },
      { playerId: 'p2', category: 'city', value: 'Ankara' },
    ]
    const votes: Vote[] = [
      { voterId: 'p2', answerId: 'p1-city', isValid: true },
      { voterId: 'p1', answerId: 'p2-city', isValid: true },
    ]
    const scores = calculateScore(answers, votes, players)
    expect(scores.get('p1')).toBe(5)
    expect(scores.get('p2')).toBe(5)
  })

  it('awards 0 points for invalid answer', () => {
    const answers: Answer[] = [
      { playerId: 'p1', category: 'city', value: 'Ankara' },
    ]
    const votes: Vote[] = [
      { voterId: 'p2', answerId: 'p1-city', isValid: false },
    ]
    const scores = calculateScore(answers, votes, players)
    expect(scores.get('p1')).toBe(0)
  })

  it('awards 0 points for blank answer', () => {
    const answers: Answer[] = [
      { playerId: 'p1', category: 'city', value: '' },
    ]
    const scores = calculateScore(answers, [], players)
    expect(scores.get('p1')).toBe(0)
  })

  it('skips answers with no votes', () => {
    const answers: Answer[] = [
      { playerId: 'p1', category: 'city', value: 'Ankara' },
    ]
    const scores = calculateScore(answers, [], players)
    expect(scores.get('p1')).toBe(0)
  })

  it('handles mixed valid/invalid votes', () => {
    const answers: Answer[] = [
      { playerId: 'p1', category: 'city', value: 'Ankara' },
    ]
    const votes: Vote[] = [
      { voterId: 'p2', answerId: 'p1-city', isValid: true },
      { voterId: 'p2', answerId: 'p1-city', isValid: false },
    ]
    const scores = calculateScore(answers, votes, players)
    expect(scores.get('p1')).toBe(0)
  })

  it('normalizes answers before uniqueness check', () => {
    const answers: Answer[] = [
      { playerId: 'p1', category: 'city', value: 'İSTANBUL' },
      { playerId: 'p2', category: 'city', value: 'istanbul' },
    ]
    const votes: Vote[] = [
      { voterId: 'p2', answerId: 'p1-city', isValid: true },
      { voterId: 'p1', answerId: 'p2-city', isValid: true },
    ]
    const scores = calculateScore(answers, votes, players)
    expect(scores.get('p1')).toBe(5)
    expect(scores.get('p2')).toBe(5)
  })

  it('initializes all players with 0', () => {
    const scores = calculateScore([], [], players)
    expect(scores.get('p1')).toBe(0)
    expect(scores.get('p2')).toBe(0)
  })
})
