import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RateLimiter } from '../../utils/rateLimiter'

vi.mock('@sentry/react', () => ({
  default: { captureMessage: vi.fn() },
  captureMessage: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('RateLimiter', () => {
  let limiter: RateLimiter

  beforeEach(() => {
    limiter = new RateLimiter()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows first request for a connection', () => {
    expect(limiter.allow('conn1', 'chat-message', false)).toBe(true)
  })

  it('allows admin bypass', () => {
    for (let i = 0; i < 100; i++) {
      expect(limiter.allow('conn1', 'chat-message', true)).toBe(true)
    }
  })

  it('blocks after exceeding threshold for chat-message', () => {
    for (let i = 0; i < 5; i++) {
      expect(limiter.allow('conn1', 'chat-message', false)).toBe(true)
    }
    expect(limiter.allow('conn1', 'chat-message', false)).toBe(false)
  })

  it('resets window after time passes', () => {
    for (let i = 0; i < 5; i++) {
      limiter.allow('conn1', 'chat-message', false)
    }
    expect(limiter.allow('conn1', 'chat-message', false)).toBe(false)

    vi.advanceTimersByTime(11_000)
    expect(limiter.allow('conn1', 'chat-message', false)).toBe(true)
  })

  it('mutes after 4 violations', () => {
    for (let batch = 0; batch < 4; batch++) {
      for (let i = 0; i < 5; i++) {
        limiter.allow('conn1', 'chat-message', false)
      }
      limiter.allow('conn1', 'chat-message', false)
      vi.advanceTimersByTime(11_000)
    }

    expect(limiter.allow('conn1', 'chat-message', false)).toBe(false)

    vi.advanceTimersByTime(31_000)
    expect(limiter.allow('conn1', 'chat-message', false)).toBe(true)
  })

  it('uses default limits for unknown message types', () => {
    for (let i = 0; i < 20; i++) {
      limiter.allow('conn1', 'unknown-type', false)
    }
    expect(limiter.allow('conn1', 'unknown-type', false)).toBe(false)
  })

  it('reset clears connection state', () => {
    for (let i = 0; i < 5; i++) {
      limiter.allow('conn1', 'chat-message', false)
    }
    expect(limiter.allow('conn1', 'chat-message', false)).toBe(false)

    limiter.reset('conn1')
    expect(limiter.allow('conn1', 'chat-message', false)).toBe(true)
  })

  it('tracks different connections independently', () => {
    for (let i = 0; i < 5; i++) {
      limiter.allow('conn1', 'chat-message', false)
    }
    expect(limiter.allow('conn1', 'chat-message', false)).toBe(false)

    expect(limiter.allow('conn2', 'chat-message', false)).toBe(true)
  })

  it('tracks different message types independently', () => {
    for (let i = 0; i < 5; i++) {
      limiter.allow('conn1', 'chat-message', false)
    }
    // vote has limit of 15, so should still pass
    expect(limiter.allow('conn1', 'vote', false)).toBe(true)
  })
})
