# İsim Şehir — v3.0 Testing Strategy

> **Priority:** P02 — critical for regression safety but scoped to not block P01
> **Version target:** v3.0
> **Status:** 🔵 Draft

## Overview

The project has zero automated tests. For a real-time multiplayer game with complex state propagation (Zustand stores + PeerJS mesh), this is a significant risk. This spec introduces a three-tier testing strategy: unit, integration, and E2E.

## Requirements

### Tier 1 — Unit Tests (Priority: highest)

Test pure logic functions and Zustand stores in isolation. No WebRTC or browser API mocking required.

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

**Zustand store tests:**

| Store | What to Test | Approx. Tests |
|---|---|---|
| `useGameStore` | — Initial state<br>— Each action (createRoom, joinRoom, addPlayer, removePlayer, setReady, startGame, startRound, submitAnswer, vote, finalizeRound, etc.)<br>— State transitions (phase changes)<br>— Admin transfer | 25-35 |
| `usePeerStore` | — Initial state<br>— setPeer, addConnection, removeConnection<br>— Connection status transitions | 8-10 |
| `useNotificationStore` | — show/dismiss | 3-5 |

**Total unit tests:** ~100-130

### Tier 2 — Integration Tests (Priority: medium)

Test store interactions and peer message handling without actual WebRTC.

| Scenario | What to Test |
|---|---|
| **Player joins room** | Dispatch `join-room` → admin adds player → `room-state-sync` sent → joiner applies state |
| **Ready flow** | Player readies → `player-ready` broadcast → all stores update → countdown triggers when all ready |
| **Full round cycle** | Start game → round start → submit answers → grading → finalize → results |
| **Admin transfer** | Admin disconnect detected → new admin adopts peer ID → state sync |
| **Reconnection** | Player refreshes → reconnect message → admin sends state → player resumes |
| **Rate limiting** | Spam messages blocked after threshold → mute after violations |
| **Input sanitisation** | XSS payload in nickname → stripped before broadcast |

Approach:
- Create a **test helper** that instantiates multiple `useGameStore` instances (simulating peers) and pipes messages between them via a mock transport.
- Use Vitest's `fakeTimers` for timer-dependent scenarios (countdown, heartbeat).

**Total integration tests:** ~15-25

### Tier 3 — End-to-End Tests (Priority: low)

Browser-level tests using Playwright with actual PeerJS connections.

| Scenario | What to Test |
|---|---|
| **Create & join room** | Open 2 browser tabs, create room in one, join with code in the other |
| **Full 2-player game** | Play through lobby → wheel → answer → grade → results → game over |
| **Admin disconnect** | Close admin tab, verify remaining player becomes admin |
| **Page refresh** | Refresh player tab mid-game, verify reconnection |
| **Spectator mode** | Join as spectator, verify read-only constraints |
| **Responsive layout** | Check mobile viewport rendering |

- 2-3 smoke tests, not a full suite.
- Run in CI on push to main.

## Technical Design

### Framework

| Level | Tool | Rationale |
|---|---|---|
| Unit | Vitest | Zero-config with Vite, fast, Jest-compatible API, built-in coverage |
| Integration | Vitest | Same as unit — no extra tooling |
| E2E | Playwright | Industry standard, reliable, cross-browser, TypeScript-native |

### Vitest Configuration

```ts
// vitest.config.ts (or within vite.config.ts)
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom', // for Zustand store tests that reference browser APIs
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
│   │
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
│   │
│   ├── stores/
│   │   ├── useGameStore.test.ts
│   │   ├── usePeerStore.test.ts
│   │   └── useNotificationStore.test.ts
│   │
│   └── integration/
│       ├── peerMessaging.test.ts
│       ├── gameFlow.test.ts
│       └── adminTransfer.test.ts
│
e2e/
├── playwright.config.ts
├── fixtures.ts               # Browser context helpers
└── specs/
    ├── create-and-join.spec.ts
    ├── full-game.spec.ts
    └── admin-transfer.spec.ts
```

### Test Scripts (package.json)

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test"
  }
}
```

### Dependencies to Add

| Package | Type | Purpose |
|---|---|---|
| `vitest` | devDep | Test runner |
| `@vitest/coverage-v8` | devDep | Coverage reporter |
| `@testing-library/react` | devDep | Zustand store test utilities (optional) |
| `@playwright/test` | devDep | E2E tests |

### CI Integration (see also `SPEC-v3.0-P02-02-ci-cd-pipeline.md`)

- Unit + integration tests run on every PR and push to main via GitHub Actions.
- E2E tests run only on main (after deploy, or on demand).

## Files to Create

- `vitest.config.ts` (or merge into `vite.config.ts`)
- `src/test/setup.ts`
- All test files listed above under `src/test/` and `e2e/`

## Files to Modify

- `package.json` — add test scripts, devDependencies
- `tsconfig.json` — include `vitest` types

## Acceptance Criteria

- [ ] `npm test` runs all unit + integration tests and passes
- [ ] `npm run test:coverage` reports ≥80% statement coverage on utils and stores
- [ ] `npm run test:e2e` runs 3 Playwright smoke tests
- [ ] Tests run in CI on every PR (fail CI on test failure)
- [ ] Test suite completes in <30s (unit + integration)
- [ ] No external services required for unit/integration tests
