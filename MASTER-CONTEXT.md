# İsim Şehir — Master Context

## Project

Multiplayer peer-to-peer WebRTC version of the classic Turkish word game (similar to Scattergories). Players spin a letter wheel, write words across ~33 categories, then grade each other's answers.

**Play:** [isim-sehir-phi.vercel.app](https://isim-sehir-phi.vercel.app/)

## Stack

| Layer | Library |
|---|---|
| Framework | React 19 |
| Language | TypeScript 5 (strict) |
| Build | Vite 6 |
| UI | MUI (Material) 6 |
| State | Zustand 5 |
| Routing | React Router 7 |
| P2P | PeerJS (mesh topology) |
| Server | PeerJS Server (signalling) |

## Architecture

- **Frontend:** React SPA deployed on Vercel
- **Signaling Server:** Custom PeerJS server on Render
- **Multiplayer:** WebRTC mesh topology (every peer connects to every other peer)
- **State:** All game state in Zustand stores, propagated via PeerJS broadcast
- **Admin is source of truth:** The room creator is the admin. Admin broadcasts authoritative state changes; peers apply them locally.

## Key Files

| File | Purpose |
|---|---|
| `src/stores/useGameStore.ts` | All game state (room, players, rounds, scores, chat, countdown, etc.) |
| `src/stores/usePeerStore.ts` | PeerJS connection state (peer, connections, connectionStatus) |
| `src/context/PeerContext.tsx` | PeerJS lifecycle: create/connect/reconnect, message dispatch, heartbeat, ping/pong |
| `src/pages/LobbyPage.tsx` | Lobby screen: player list, settings panel, ready toggle, countdown, start game |
| `src/hooks/useGame.ts` | Game actions: startGame, startRound, submitAnswers, vote, finalizeRound |
| `src/components/Lobby/GameSettingsPanel.tsx` | Category/round/duration/letter pool/password editor (admin only) |
| `src/components/Lobby/PlayerList.tsx` | Player roster with ready/spectator/admin transfer |
| `src/types/index.ts` | All TypeScript types, PeerMessageType enum, payload interfaces |
| `src/components/common/RulesPanel.tsx` | Interactive "How to Play" dialog with collapsible sections (v3.0) |
| `src/components/common/PhaseIndicator.tsx` | Visual stepper showing current/completed/future phases (v3.0) |
| `src/components/common/PhaseTransitionBanner.tsx` | Snackbar explaining phase changes (v3.0) |
| `src/components/common/InlineTip.tsx` | "i" icon with MUI Tooltip (v3.0) |
| `src/components/Game/ScoreBreakdown.tsx` | Per-category scoring drill-down dialog (v3.0) |
| `src/utils/tips.ts` | Contextual tip pool keyed by game event (v3.0) |
| `src/utils/rules.ts` | Rules section metadata + localStorage flag helpers (v3.0) |
| `src/components/common/ErrorBoundary.tsx` | Configurable error boundary class component (v3.0 P01-02) |
| `src/components/common/ErrorFallback.tsx` | Full-page error fallback with refresh + report (v3.0 P01-02) |
| `src/components/common/GameErrorFallback.tsx` | Game-specific error fallback with lobby navigation (v3.0 P01-02) |

## Stores

### useGameStore
Fields: `room`, `localPlayerId`, `localNickname`, `answers`, `submittedPlayers`, `gradingItems`, `myVotes`, `chatMessages`, `timer`, `isSubmitting`, `scores`, `joinRejectedReason`, `countdown`, `settingsEditMode`

### usePeerStore
Fields: `peer`, `peerId`, `connections`, `connectionStatus`

## Peer Messaging

Mesh topology — every message is sent point-to-point. Admin re-broadcasts state-change messages to all other peers.

### Message types (`PeerMessageType`)

| Type | Direction | Payload |
|---|---|---|
| `join-room` | Peer→Admin | `{ id, nickname, password?, isSpectator? }` |
| `join-rejected` | Admin→Peer | `{ reason }` |
| `spectate-request` | Peer→Admin | `{ playerId, nickname }` |
| `player-ready` | Peer→Admin→All | `{ playerId, ready }` |
| `game-start` | Admin→All | `{}` |
| `round-start` | Admin→All | `{ letter }` |
| `answers-submit` | Peer→All | `{ answers }` |
| `vote` | Peer→All | `{ voterId, answerId, isValid }` |
| `round-end` | Admin→All | `{ roundScores, updatedPlayers }` |
| `settings-update` | Admin→All | Partial settings object |
| `chat-message` | Any→All | `{ playerId, nickname, text, timestamp }` |
| `player-disconnected` | Admin→All | `{ playerId }` |
| `admin-transfer` | Admin→All | `{ newAdminId }` |
| `admin-transfer-request` | Admin→All | `{ newAdminId }` |
| `room-state-sync` | Admin→Peer | `{ room }` (full state) |
| `heartbeat` | Admin→All | `{}` (every 8s) |
| `reconnect` | Peer→Admin | `{ playerId, nickname }` |
| `reconnect-accepted` | Admin→Peer | `{ room, timer }` |
| `ping/pong` | All→All | `{}` (health check, 10s interval) |
| `countdown-sync` | Admin→All | `{ remaining }` (every 1s during countdown) |
| `countdown-cancel` | Admin→All | `{}` |

## Countdown Auto-Start (v2.1 P03)

When all players are ready, minimum players met, and categories selected, a 10-second countdown begins. Admin is the source of truth — runs `setInterval`, broadcasts `countdown-sync` every second. Countdown cancels on any player un-ready, new player join, or admin opening settings edit mode. Admin can bypass via "Start Now" button.

## Key Conventions

- **No JSX comments** unless explaining non-obvious *why*
- **MUI `sx` prop** for styling (no styled-components)
- **Zustand selectors** for granular re-render control
- **Existing locale patterns** — keys follow `section.key` convention
- **Animations** use inline `@keyframes` in `sx` prop (not `keyframes` import)
- **i18n**: 6 languages (tr, en, de, fr, es, pt)

## Spec Files Reference

All spec files live under [`specs/`](./specs/) organised by version. Implemented specs are prefixed `SPEC-IMPLEMENTED-*`. See [`README.md`](./README.md) for the condensed feature matrix.

### v1.0 — Foundation

| File | Feature |
|---|---|
| `specs/v1.0/SPEC-v1.0.md` | Base game (lobby, wheel, answering, grading, scoring) |

### v1.1 — Resilience & i18n

| File | Priority | Feature |
|---|---|---|
| `specs/v1.1/SPEC-IMPLEMENTED-v1.1-P01-01-player-disconnect.md` | P01 | Player disconnect detection |
| `specs/v1.1/SPEC-IMPLEMENTED-v1.1-P01-02-admin-transfer.md` | P01 | Seamless admin transfer on disconnect |
| `specs/v1.1/SPEC-IMPLEMENTED-v1.1-P01-03-localisation.md` | P01 | Internationalisation (i18n) |
| `specs/v1.1/SPEC-IMPLEMENTED-v1.1-P01-04-state-persistence.md` | P01 | Session persistence on refresh |
| `specs/v1.1/SPEC-IMPLEMENTED-v1.1-P02-01-admin-ready.md` | P02 | Admin must be ready to start |

### v1.2 — Features & Polish

| File | Priority | Feature |
|---|---|---|
| `specs/v1.2/SPEC-IMPLEMENTED-v1.2-P02-01-custom-categories.md` | P02 | Custom categories |
| `specs/v1.2/SPEC-IMPLEMENTED-v1.2-P02-02-timer-reconnect.md` | P02 | Timer reconnect safety |
| `specs/v1.2/SPEC-IMPLEMENTED-v1.2-P03-01-game-history.md` | P03 | Game history (localStorage) |
| `specs/v1.2/SPEC-IMPLEMENTED-v1.2-P03-02-sound-effects.md` | P03 | Sound effects via Web Audio API |

### v2.0 — Stability & Mobile

| File | Priority | Feature |
|---|---|---|
| `specs/v2.0/SPEC-IMPLEMENTED-v2.0-P01-01-connection-loss.md` | P01 | Connection loss handling |
| `specs/v2.0/SPEC-IMPLEMENTED-v2.0-P01-02-admin-transfer.md` | P01 | Voluntary admin transfer |
| `specs/v2.0/SPEC-IMPLEMENTED-v2.0-P01-03-mobile-responsive.md` | P01 | Mobile responsive layout |
| `specs/v2.0/SPEC-IMPLEMENTED-v2.0-P02-01-room-codes.md` | P02 | Room code generation |
| `specs/v2.0/SPEC-IMPLEMENTED-v2.0-P03-01-performance.md` | P03 | Performance optimisations |

### v2.1 — Security, Languages & Lobby

| File | Priority | Feature |
|---|---|---|
| `specs/v2.1/SPEC-IMPLEMENTED-v2.1-P01-01-server-safeguards.md` | P01 | Server safeguards (CORS, rate limits, connection caps) |
| `specs/v2.1/SPEC-IMPLEMENTED-v2.1-P01-02-message-validation.md` | P01 | Message schema validation |
| `specs/v2.1/SPEC-IMPLEMENTED-v2.1-P01-03-input-sanitization.md` | P01 | Input sanitisation / XSS prevention |
| `specs/v2.1/SPEC-IMPLEMENTED-v2.1-P01-04-language-picker.md` | P01 | Language picker with autocomplete |
| `specs/v2.1/SPEC-IMPLEMENTED-v2.1-P01-05-new-languages.md` | P01 | ES, PT, FR, DE locale files |
| `specs/v2.1/SPEC-IMPLEMENTED-v2.1-P02-01-rate-limiting.md` | P02 | Anti-spam rate limiting |
| `specs/v2.1/SPEC-IMPLEMENTED-v2.1-P02-02-room-passwords.md` | P02 | Optional room passwords |
| `specs/v2.1/SPEC-IMPLEMENTED-v2.1-P02-03-stale-room-cleanup.md` | P02 | Stale room reclamation |
| `specs/v2.1/SPEC-IMPLEMENTED-v2.1-P02-04-lobby-category-visibility.md` | P02 | Real-time category chip display |
| `specs/v2.1/SPEC-IMPLEMENTED-v2.1-P03-01-spectator-mode.md` | P03 | Read-only spectator mode |
| `specs/v2.1/SPEC-IMPLEMENTED-v2.1-P03-02-lobby-auto-start.md` | P03 | Lobby countdown auto-start |

### v2.2 — Locale Awareness

| File | Priority | Feature |
|---|---|---|
| `specs/v2.2/SPEC-IMPLEMENTED-v2.2-P01-01-locale-letter-pool.md` | P01 | Locale-aware letter pool |

### v3.0 — UX, Resilience & Infrastructure

| File | Priority | Feature | Status |
|---|---|---|---|
| `specs/v3.0/SPEC-IMPLEMENTED-v3.0-P01-01-ux-rules-visibility.md` | P01 | UX Rules & Behaviour Visibility | ✅ (05f70ea) |
| `specs/v3.0/SPEC-IMPLEMENTED-v3.0-P01-02-error-boundary-sentry.md` | P01 | Error Boundaries & Sentry | ✅ |
| `specs/v3.0/SPEC-v3.0-P01-03-pre-connection-ux-guard.md` | P01 | Pre-Connection UX Guard | 🔵 |
| `specs/v3.0/SPEC-v3.0-P02-01-testing-strategy.md` | P02 | Testing Strategy | 🔵 |
| `specs/v3.0/SPEC-v3.0-P02-02-ci-cd-pipeline.md` | P02 | CI/CD Pipeline | 🔵 |
| `specs/v3.0/SPEC-v3.0-P02-03-docker-compose.md` | P02 | Docker Compose | 🔵 |
| `specs/v3.0/SPEC-v3.0-P02-04-typescript-server.md` | P02 | TypeScript Signalling Server | 🔵 |
| `specs/v3.0/SPEC-v3.0-P03-01-server-persistence.md` | P03 | Server Persistence | 🔵 |
| `specs/v3.0/SPEC-v3.0-P03-02-observability.md` | P03 | Observability | 🔵 |
| `specs/v3.0/SPEC-v3.0-P03-03-pwa-support.md` | P03 | PWA Support | 🔵 |
| `specs/v3.0/SPEC-v3.0-P04-01-scale-beyond-mesh.md` | P04 | Scale Beyond Mesh | 🔵 |

Status: ✅ = Implemented, 🔵 = Draft
