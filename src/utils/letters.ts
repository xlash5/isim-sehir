export const TURKISH_LETTERS: string[] = [
  'A', 'B', 'C', 'Ç', 'D', 'E', 'F', 'G', 'H', 'I',
  'İ', 'J', 'K', 'L', 'M', 'N', 'O', 'Ö', 'P', 'R',
  'S', 'Ş', 'T', 'U', 'Ü', 'V', 'Y', 'Z',
]

export function getRandomLetter(pool?: string[]): string {
  const letters = pool ?? TURKISH_LETTERS
  return letters[Math.floor(Math.random() * letters.length)]
}

export function generateRoomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
