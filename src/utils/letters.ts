export const TURKISH_LETTERS: string[] = [
  'A', 'B', 'C', 'Ç', 'D', 'E', 'F', 'G', 'H', 'I',
  'İ', 'J', 'K', 'L', 'M', 'N', 'O', 'Ö', 'P', 'R',
  'S', 'Ş', 'T', 'U', 'Ü', 'V', 'Y', 'Z',
]

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
