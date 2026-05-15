export const TURKISH_LETTERS: string[] = [
  'A', 'B', 'C', 'Ç', 'D', 'E', 'F', 'G', 'H', 'I',
  'İ', 'J', 'K', 'L', 'M', 'N', 'O', 'Ö', 'P', 'R',
  'S', 'Ş', 'T', 'U', 'Ü', 'V', 'Y', 'Z',
]

export const LOCALE_LETTER_POOLS: Record<string, string[]> = {
  tr: TURKISH_LETTERS,
  en: [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'],
  de: [...'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ'],
  es: [...'ABCDEFGHIJKLMNOPQRSTUVWXYZÑ'],
  fr: [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'],
  pt: [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'],
}

const ALPHABET_NAMES: Record<string, string> = {
  tr: 'Türk Alfabesi',
  en: 'English Alphabet',
  de: 'Deutsches Alphabet',
  es: 'Alfabeto Español',
  fr: 'Alphabet Français',
  pt: 'Alfabeto Português',
}

const LETTER_COUNT_WORDS: Record<string, string> = {
  tr: 'harf',
  en: 'letters',
  de: 'Buchstaben',
  es: 'letras',
  fr: 'lettres',
  pt: 'letras',
}

export function getLetterPoolLabel(locale: string, pool: string[]): string {
  const name = ALPHABET_NAMES[locale] ?? 'Alphabet'
  const word = LETTER_COUNT_WORDS[locale] ?? 'letters'
  return `${name} (${pool.length} ${word})`
}

export const LOCALE_TO_LETTER_POOL_KEY: Record<string, string> = {
  tr: 'settings.letterPoolTurkish',
  en: 'settings.letterPoolEnglish',
  de: 'settings.letterPoolGerman',
  es: 'settings.letterPoolSpanish',
  fr: 'settings.letterPoolFrench',
  pt: 'settings.letterPoolPortuguese',
}

export function getLetterPoolLabelKey(locale: string): string {
  return LOCALE_TO_LETTER_POOL_KEY[locale] ?? 'settings.letterPoolTurkish'
}

export function getRandomLetter(pool?: string[]): string {
  const letters = pool ?? TURKISH_LETTERS
  return letters[Math.floor(Math.random() * letters.length)]
}

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateRoomCode(): string {
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)]
  }
  return code
}
