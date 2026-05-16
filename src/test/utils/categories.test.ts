import { describe, it, expect } from 'vitest'
import { CATEGORY_KEYS, isBuiltinCategory } from '../../utils/categories'

describe('CATEGORY_KEYS', () => {
  it('has 33 categories', () => {
    expect(CATEGORY_KEYS).toHaveLength(33)
  })

  it('includes isim_erkek', () => {
    expect(CATEGORY_KEYS).toContain('isim_erkek')
  })

  it('includes turistik', () => {
    expect(CATEGORY_KEYS).toContain('turistik')
  })

  it('all keys are unique', () => {
    expect(new Set(CATEGORY_KEYS).size).toBe(CATEGORY_KEYS.length)
  })
})

describe('isBuiltinCategory', () => {
  it('returns true for known categories', () => {
    expect(isBuiltinCategory('isim_erkek')).toBe(true)
    expect(isBuiltinCategory('sehir_turkiye')).toBe(true)
    expect(isBuiltinCategory('hayvan')).toBe(true)
  })

  it('returns false for unknown categories', () => {
    expect(isBuiltinCategory('unknown_category')).toBe(false)
    expect(isBuiltinCategory('')).toBe(false)
  })
})
