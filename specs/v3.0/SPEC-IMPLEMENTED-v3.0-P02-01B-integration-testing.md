# İsim Şehir — v3.0 Integration Testing

> **Priority:** P02 — critical for regression safety but scoped to not block P01
> **Version target:** v3.0
> **Status:** ✅ Implemented

## Overview

This spec covers **Tier 2 — Integration Tests**: store interactions and peer message handling verified without actual WebRTC. A mock transport pipes messages between simulated peer stores to validate game flows.

Integration tests reuse the same Vitest config as unit tests. No additional tooling or configuration required.

## Requirements

| Scenario | What to Test | Status |
|---|---|---|
| **Player joins room** | Dispatch `join-room` → admin adds player → `room-state-sync` sent → joiner applies state | ✅ |
| **Ready flow** | Player readies → `player-ready` broadcast → all stores update | ✅ |
| **Full round cycle** | Start game → round start → submit answers → grading → finalize → results | ✅ |
| **Admin transfer** | Admin disconnect detected → new admin adopts peer ID → state sync | ✅ |
| **Reconnection** | Player refreshes → reconnect message → admin sends state → player resumes | ✅ |
| **Rate limiting** | Spam messages blocked after threshold → mute after violations | ✅ |
| **Input sanitisation** | XSS payload in nickname → rejected by validator (first line of defence) | ✅ |

**Total integration tests:** 27 (peer messaging: 11, game flow: 10, admin transfer: 6)

## Technical Design

### Framework

| Level | Tool | Rationale |
|---|---|---|
| Integration | Vitest | Same as unit — no extra tooling, shared config |

### Vitest Configuration

Integration tests reuse the same Vitest config as unit tests (`vitest.config.ts`). No additional configuration required.

### Directory Structure

```
src/
└── test/
    └── integration/
        ├── peerMessaging.test.ts
        ├── gameFlow.test.ts
        └── adminTransfer.test.ts
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

### CI Integration

- Integration tests run on every PR and push to main via GitHub Actions.
- Fail CI on test failure.

## Files to Create

- `src/test/integration/peerMessaging.test.ts`
- `src/test/integration/gameFlow.test.ts`
- `src/test/integration/adminTransfer.test.ts`

## Files to Modify

- `package.json` — add test scripts, devDependencies
- `tsconfig.json` — include `vitest` types

## Acceptance Criteria

- [x] `npm test` runs all integration tests and passes (190 tests, 27 integration)
- [x] Integration test suite completes in <10s (433ms)
- [x] Tests run in CI on every PR (fail CI on test failure) — via existing GitHub Actions workflow
- [x] No external services or real WebRTC required
- [x] Type check passes (`tsc --noEmit`)
- [x] Coverage thresholds maintained (85%+ stmts, 75%+ branches)
