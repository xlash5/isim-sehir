import { vi } from 'vitest'

Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
    }),
  },
})

class LocalStorageMock {
  private store: Record<string, string> = {}
  getItem(key: string): string | null {
    return this.store[key] ?? null
  }
  setItem(key: string, value: string): void {
    this.store[key] = value
  }
  removeItem(key: string): void {
    delete this.store[key]
  }
  clear(): void {
    this.store = {}
  }
}

if (!globalThis.localStorage) {
  Object.defineProperty(globalThis, 'localStorage', { value: new LocalStorageMock() })
}

vi.mock('@sentry/react', () => ({
  default: { captureMessage: vi.fn() },
  captureMessage: vi.fn(),
}))
