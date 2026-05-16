# İsim Şehir — v3.0 End-to-End Testing

> **Priority:** P02 — critical for regression safety but scoped to not block P01
> **Version target:** v3.0
> **Status:** 🔵 Draft

## Overview

The project has zero automated tests. This spec covers **Tier 3 — End-to-End Tests**: browser-level tests using Playwright with actual PeerJS connections. 2-3 smoke tests to validate critical user journeys — not a full suite.

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
  fullyParallel: true,
  retries: 1,
  use: {
    baseURL: 'http://localhost:5173',
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: true,
  },
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

- E2E tests run only on main (after deploy, or on demand).
- Run on push to main.

## Files to Create

- `e2e/playwright.config.ts`
- `e2e/fixtures.ts`
- `e2e/specs/create-and-join.spec.ts`
- `e2e/specs/full-game.spec.ts`
- `e2e/specs/admin-transfer.spec.ts`

## Files to Modify

- `package.json` — add `test:e2e` script, `@playwright/test` devDependency

## Acceptance Criteria

- [ ] `npm run test:e2e` runs 3 Playwright smoke tests and passes
- [ ] Tests run in CI on push to main
- [ ] No external services required beyond the app itself
