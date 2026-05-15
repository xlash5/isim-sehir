export function sanitizeString(input: string, maxLength: number): string {
  let s = input
  s = s.replace(/<[^>]*>/g, '')
  s = s.replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
  s = s.replace(/\b(javascript|data)\s*:/gi, '')
  s = s.trim()
  if (s.length > maxLength) {
    s = s.slice(0, maxLength)
  }
  return s
}
