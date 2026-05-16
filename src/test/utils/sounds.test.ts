import { describe, it, expect, beforeEach, vi } from 'vitest'
import { isSoundEnabled, setSoundEnabled, playSound } from '../../utils/sounds'

const STORAGE_KEY = 'isim-sehir-sound'

beforeEach(() => {
  localStorage.clear()
})

describe('sounds', () => {
  it('returns false when no preference is set', () => {
    expect(isSoundEnabled()).toBe(false)
  })

  it('returns true after enabling', () => {
    setSoundEnabled(true)
    expect(isSoundEnabled()).toBe(true)
  })

  it('returns false after disabling', () => {
    setSoundEnabled(true)
    setSoundEnabled(false)
    expect(isSoundEnabled()).toBe(false)
  })

  it('persists to localStorage', () => {
    setSoundEnabled(true)
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true')
  })

  it('does not throw when playing sound without AudioContext', () => {
    setSoundEnabled(true)
    expect(() => playSound('wheel-tick')).not.toThrow()
    expect(() => playSound('chat-message')).not.toThrow()
    expect(() => playSound('game-over-victory')).not.toThrow()
  })

  it('does not play sound when disabled', () => {
    setSoundEnabled(false)
    expect(() => playSound('wheel-tick')).not.toThrow()
  })
})
