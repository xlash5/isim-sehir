import { describe, it, expect } from 'vitest'
import { sanitizeString } from '../../utils/sanitize'

describe('sanitizeString', () => {
  it('strips HTML tags', () => {
    expect(sanitizeString('<script>alert("xss")</script>', 100)).toBe('alert("xss")')
  })

  it('strips event handlers and HTML tags', () => {
    expect(sanitizeString('<img onerror="alert(1)" src=x>', 100)).toBe('')
  })

  it('strips javascript: protocol', () => {
    expect(sanitizeString('javascript:alert(1)', 100)).toBe('alert(1)')
  })

  it('strips data: protocol and nested HTML', () => {
    expect(sanitizeString('data:text/html,<script>', 100)).toBe('text/html,')
  })

  it('enforces max length', () => {
    const long = 'a'.repeat(200)
    expect(sanitizeString(long, 10)).toHaveLength(10)
  })

  it('returns empty string for empty input', () => {
    expect(sanitizeString('', 100)).toBe('')
  })

  it('trims whitespace', () => {
    expect(sanitizeString('  hello  ', 100)).toBe('hello')
  })

  it('handles only whitespace input', () => {
    expect(sanitizeString('   ', 100)).toBe('')
  })
})
