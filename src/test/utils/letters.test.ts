import { describe, it, expect } from 'vitest'
import {
  TURKISH_LETTERS,
  LOCALE_LETTER_POOLS,
  getLetterPoolLabel,
  getLetterPoolLabelKey,
  getRandomLetter,
  generateRoomCode,
} from '../../utils/letters'

describe('TURKISH_LETTERS', () => {
  it('has 28 letters', () => {
    expect(TURKISH_LETTERS).toHaveLength(28)
  })

  it('does not include Ğ', () => {
    expect(TURKISH_LETTERS).not.toContain('Ğ')
  })

  it('includes all expected Turkish letters', () => {
    expect(TURKISH_LETTERS).toContain('İ')
    expect(TURKISH_LETTERS).toContain('Ç')
    expect(TURKISH_LETTERS).toContain('Ş')
    expect(TURKISH_LETTERS).toContain('Ü')
    expect(TURKISH_LETTERS).toContain('Ö')
  })

  it('includes basic Latin letters', () => {
    expect(TURKISH_LETTERS).toContain('A')
    expect(TURKISH_LETTERS).toContain('Z')
  })
})

describe('LOCALE_LETTER_POOLS', () => {
  it('has all six locales', () => {
    expect(Object.keys(LOCALE_LETTER_POOLS)).toEqual(['tr', 'en', 'de', 'es', 'fr', 'pt'])
  })

  it('Turkish pool matches TURKISH_LETTERS', () => {
    expect(LOCALE_LETTER_POOLS.tr).toEqual(TURKISH_LETTERS)
  })

  it('German pool includes Ä, Ö, Ü', () => {
    expect(LOCALE_LETTER_POOLS.de).toContain('Ä')
    expect(LOCALE_LETTER_POOLS.de).toContain('Ö')
    expect(LOCALE_LETTER_POOLS.de).toContain('Ü')
  })

  it('Spanish pool includes Ñ', () => {
    expect(LOCALE_LETTER_POOLS.es).toContain('Ñ')
  })
})

describe('getLetterPoolLabel', () => {
  it('returns Turkish label for tr', () => {
    const label = getLetterPoolLabel('tr', TURKISH_LETTERS)
    expect(label).toContain('Türk Alfabesi')
    expect(label).toContain('28')
  })

  it('returns English label for en', () => {
    const label = getLetterPoolLabel('en', LOCALE_LETTER_POOLS.en)
    expect(label).toContain('English Alphabet')
  })

  it('falls back for unknown locale', () => {
    const label = getLetterPoolLabel('xx', TURKISH_LETTERS)
    expect(label).toContain('Alphabet')
  })
})

describe('getLetterPoolLabelKey', () => {
  it('returns correct key for tr', () => {
    expect(getLetterPoolLabelKey('tr')).toBe('settings.letterPoolTurkish')
  })

  it('returns correct key for de', () => {
    expect(getLetterPoolLabelKey('de')).toBe('settings.letterPoolGerman')
  })

  it('falls back to Turkish for unknown locale', () => {
    expect(getLetterPoolLabelKey('xx')).toBe('settings.letterPoolTurkish')
  })
})

describe('getRandomLetter', () => {
  it('returns a letter from the pool', () => {
    const letter = getRandomLetter()
    expect(TURKISH_LETTERS).toContain(letter)
  })

  it('returns a letter from custom pool', () => {
    const pool = ['A', 'B', 'C']
    const letter = getRandomLetter(pool)
    expect(pool).toContain(letter)
  })
})

describe('generateRoomCode', () => {
  it('returns a 4-character string', () => {
    expect(generateRoomCode()).toHaveLength(4)
  })

  it('contains only valid characters', () => {
    const valid = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    for (let i = 0; i < 100; i++) {
      const code = generateRoomCode()
      for (const ch of code) {
        expect(valid).toContain(ch)
      }
    }
  })

  it('generates different codes', () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateRoomCode()))
    expect(codes.size).toBeGreaterThan(1)
  })
})
