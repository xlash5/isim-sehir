# İsim Şehir — v3.0 Unit Testing

> **Priority:** P02 — critical for regression safety but scoped to not block P01
> **Version target:** v3.0
> **Status:** ✅ Implemented

## Overview

The project has zero automated tests. This spec covers **Tier 1 — Unit Tests**: pure logic functions and Zustand stores tested in isolation. No WebRTC or browser API mocking required.

## Requirements

### Utils

| Module | What to Test | Approx. Tests |
|---|---|---|
| `src/utils/scoring.ts` | — Normalize answer (Turkish lowercase, stripping)<br>— Score calculation: unique (10pts), shared (5pts), invalid (0pts), blank (0pts)<br>— Mixed scenarios | 10-15 |
| `src/utils/letters.ts` | — Pool generation (28 letters, Ğ excluded)<br>— Filtering to subset<br>— Locale-aware pool selection | 8-10 |
| `src/utils/categories.ts` | — Built-in list (33 items)<br>— Helper functions | 3-5 |
| `src/utils/sanitize.ts` | — XSS stripping<br>— Length limits<br>— Edge cases (empty, only whitespace, Unicode) | 8-10 |
| `src/utils/messageValidator.ts` | — Valid messages pass<br>— Invalid payloads reject (wrong types, missing fields, extra fields)<br>— Each PeerMessageType variant | 15-20 |
| `src/utils/rateLimiter.ts` | — Allow under threshold<br>— Block over threshold<br>— Mute after violations<br>— Admin bypass<br>— Reset | 10-12 |
| `src/utils/session.ts` | — Save/load/clear<br>— TTL expiry<br>— Corrupted data handling | 5-8 |
| `src/utils/history.ts` | — Add entry<br>— Max 50 entries enforcement<br>— Load empty | 5-8 |
| `src/utils/sounds.ts` | — Sound manager initialisation<br>— Play/toggle | 3-5 |

### Zustand Stores

| Store | What to Test | Approx. Tests |
|---|---|---|
| `useGameStore` | — Initial state<br>— Each action (createRoom, joinRoom, addPlayer, removePlayer, setReady, startGame, startRound, submitAnswer, vote, finalizeRound, etc.)<br>— State transitions (phase changes)<br>— Admin transfer | 25-35 |
| `usePeerStore` | — Initial state<br>— setPeer, addConnection, removeConnection<br>— Connection status transitions | 8-10 |
| `useNotificationStore` | — show/dismiss | 3-5 |

**Total unit tests:** ~100-130

## Technical Design

### Framework

| Level | Tool | Rationale |
|---|---|---|
| Unit | Vitest | Zero-config with Vite, fast, Jest-compatible API, built-in coverage |

### Vitest Configuration

```ts
// vitest.config.ts (or within vite.config.ts)
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/utils/**', 'src/stores/**'],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
})
```

### Directory Structure

```
src/
├── test/
│   ├── setup.ts              # Global test setup (mocks, matchers)
│   ├── utils/
│   │   ├── scoring.test.ts
│   │   ├── letters.test.ts
│   │   ├── categories.test.ts
│   │   ├── sanitize.test.ts
│   │   ├── messageValidator.test.ts
│   │   ├── rateLimiter.test.ts
│   │   ├── session.test.ts
│   │   ├── history.test.ts
│   │   └── sounds.test.ts
│   └── stores/
│       ├── useGameStore.test.ts
│       ├── usePeerStore.test.ts
│       └── useNotificationStore.test.ts
```

### Test Scripts (package.json)

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Dependencies to Add

| Package | Type | Purpose |
|---|---|---|
| `vitest` | devDep | Test runner |
| `@vitest/coverage-v8` | devDep | Coverage reporter |
| `@testing-library/react` | devDep | Zustand store test utilities (optional) |

### CI Integration

- Unit tests run on every PR and push to main via GitHub Actions.
- Fail CI on test failure.

## Files to Create

- `vitest.config.ts` (or merge into `vite.config.ts`)
- `src/test/setup.ts`
- All test files listed under `src/test/utils/` and `src/test/stores/`

## Files to Modify

- `package.json` — add test scripts, devDependencies
- `tsconfig.json` — include `vitest` types

## Acceptance Criteria

- [ ] `npm test` runs all unit tests and passes
- [ ] `npm run test:coverage` reports ≥80% statement coverage on utils and stores
- [ ] Tests run in CI on every PR (fail CI on test failure)
- [ ] Unit test suite completes in <20s
