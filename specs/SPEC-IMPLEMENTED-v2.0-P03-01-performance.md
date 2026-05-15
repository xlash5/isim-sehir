# İsim Şehir — v2.0 Performance Optimisations

> **Priority:** Low
> **Version target:** v2.0
> **Status:** 🟢 Implemented

## Overview

As the app grows in features, rendering performance and bundle size need attention. This spec addresses memoisation, lazy-loading, and bundle analysis.

## Requirements

1. **Memoisation:** wrap expensive components (`GradingPanel`, `AnswerTable`, `Scoreboard`) with `React.memo`.
2. **Bundle size:** consider lazy-loading routes using `React.lazy` and `Suspense`.
3. **PeerJS connection limits:** monitor mesh performance at 8 players.

## Technical Design

### React.memo
Wrap the following components with `React.memo`:

| Component | Reason |
|---|---|
| `GradingPanel.tsx` | Re-renders on every vote change; list of answers can be large |
| `AnswerTable.tsx` | Re-renders on every keystroke (via Zustand subscription) |
| `Scoreboard.tsx` | Re-renders when phase/score changes; stable props |

```typescript
export const GradingPanel = React.memo(function GradingPanel({ onVote, onComplete }: Props) {
  // ...
})
```

For `AnswerTable`, ensure the `setAnswer` callback is stable (it already is via Zustand).

### Lazy-Loading Routes
Use `React.lazy` for page components in `App.tsx`:

```typescript
const LobbyPage = React.lazy(() => import('./pages/LobbyPage').then(m => ({ default: m.LobbyPage })))
const GamePage = React.lazy(() => import('./pages/GamePage').then(m => ({ default: m.GamePage })))
const HistoryPage = React.lazy(() => import('./pages/HistoryPage').then(m => ({ default: m.HistoryPage })))
```

Wrap routes in `<Suspense fallback={<CircularProgress />}>`.

HomePage is the entry page and should remain eagerly loaded.

### Bundle Analysis
- Add `vite-plugin-visualizer` to dev dependencies (optional, for analysis).
- Run `npm run build` and review the bundle report.
- Target: main bundle < 200KB gzipped.

### PeerJS Mesh
- Current mesh topology connects every peer to every other peer.
- At 8 players, that's 28 connections per peer.
- If performance degrades, consider a star topology (admin as hub), but defer this decision until testing.

## Acceptance Criteria

- [x] GradingPanel, AnswerTable, Scoreboard are wrapped with `React.memo`
- [x] LobbyPage, GamePage, HistoryPage are lazy-loaded
- [x] Bundle size is analysed and verified as acceptable (main: ~198 kB gzip)
- [ ] App performance is smooth with 8 players
- [x] All existing v1.x features remain intact (type-check + build pass)
