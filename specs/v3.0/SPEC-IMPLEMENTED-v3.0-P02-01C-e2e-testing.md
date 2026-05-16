# İsim Şehir — v3.0 End-to-End Testing

> **Priority:** P02 — critical for regression safety but scoped to not block P01
> **Version target:** v3.0
> **Status:** ✅ Implemented

## Overview

Adds **Tier 3 — End-to-End Tests**: browser-level tests using Playwright with actual PeerJS connections. 3 smoke tests validate critical user journeys — not a full suite.

## Requirements

| Scenario | What to Test |
|---|---|
| **Create & join room** | Open 2 browser tabs, create room in one, join with code in the other |
| **Full 2-player game** | Play through lobby → wheel → answer → grade → results → game over |
| **Admin disconnect** | Close admin tab, verify remaining player becomes admin |
| **Page refresh** | Refresh player tab mid-game, verify reconnection |
| **Spectator mode** | Join as spectator, verify read-only constraints |
| **Responsive layout** | Check mobile viewport rendering |

## Technical Design

### Framework

| Level | Tool | Rationale |
|---|---|---|
| E2E | Playwright | Industry standard, reliable, cross-browser, TypeScript-native |

### Playwright Configuration

```ts
// e2e/playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './specs',
  fullyParallel: false,
  retries: 1,
  workers: 1,
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:5173',
    viewport: { width: 1280, height: 720 },
  },
  webServer: [
    {
      command: 'npm run dev',
      port: 5173,
      reuseExistingServer: true,
    },
    {
      command: 'node server/index.js',
      port: 9000,
      reuseExistingServer: true,
      cwd: '.',
    },
  ],
})
```

### Directory Structure

```
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
    "test:e2e": "playwright test"
  }
}
```

### Dependencies to Add

| Package | Type | Purpose |
|---|---|---|
| `@playwright/test` | devDep | E2E test runner |

### CI Integration

- E2E tests run as a separate `e2e` job in CI, after the `quality` job completes.
- Runs on every PR and push to main.

## Files Created

- `e2e/playwright.config.ts` — Playwright config with dual webServer (Vite + PeerJS)
- `e2e/fixtures.ts` — Test helpers (createRoom, joinRoom, readyUp, etc.)
- `e2e/specs/create-and-join.spec.ts` — Creates room, joins with code, verifies both in lobby
- `e2e/specs/full-game.spec.ts` — 2-player game through all phases
- `e2e/specs/admin-transfer.spec.ts` — Closes admin tab, verifies remaining player becomes admin

## Files Modified

- `package.json` — added `test:e2e` script, `@playwright/test` devDependency
- `.github/workflows/ci.yml` — added `e2e` job with Playwright browser install

## Acceptance Criteria

- [x] `npm run test:e2e` runs 3 Playwright smoke tests and passes
- [x] Tests run in CI on push to main (separate `e2e` job)
- [x] No external services required beyond the app itself
