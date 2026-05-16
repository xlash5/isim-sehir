# İsim Şehir — Master Context

## Project Overview

Multiplayer peer-to-peer WebRTC version of the classic Turkish word game ("İsim Şehir").
Players take turns spinning a letter wheel, then write words starting with that letter across
~33 categories. Peers grade each other's answers. Built as a React SPA deployed on Vercel
with a custom PeerJS signaling server on Render.

**Live:** https://isim-sehir-phi.vercel.app

---

## Tech Stack

| Layer | Library | Version | Notes |
|---|---|---|---|
| Framework | React | 19 | SPA |
| Language | TypeScript | 5 | strict mode |
| Build | Vite | 6 | plugin-react |
| UI | MUI (Material) | 6 | emotion styled |
| State | Zustand | 5 | 3 stores |
| Routing | React Router | 7 | BrowserRouter |
| P2P | PeerJS | 1.5 | mesh topology |
| Server | PeerJS Server | 1.x | signaling |

---

## Directory Structure

```
isim_sehir/
├── .github/workflows/
│   └── ci.yml              # GitHub Actions: lint → test → build on PR/push to main
├── index.html              # Vite entry HTML
├── package.json            # Frontend deps & scripts
├── tsconfig.json           # Strict TS config
├── vite.config.ts          # SPA config, copies index.html→404.html
├── README.md
│
├── public/vite.svg         # App icon
├── dist/                   # Build output (Vercel deploys this)
│   ├── index.html
│   ├── 404.html            # Copied from index.html for SPA routing
│   └── assets/
│
├── server/
│   ├── package.json        # Server deps (peer only)
│   └── index.js            # PeerJS signaling server
│
├── specs/                  # Feature specifications (v1.0–v3.0)
│   ├── MASTER-CONTEXT.md
│   ├── v1.0/
│   │   └── SPEC-v1.0.md
│   ├── v1.1/
│   │   ├── SPEC-IMPLEMENTED-v1.1-P01-01-player-disconnect.md
│   │   ├── SPEC-IMPLEMENTED-v1.1-P01-02-admin-transfer.md
│   │   ├── SPEC-IMPLEMENTED-v1.1-P01-03-localisation.md
│   │   ├── SPEC-IMPLEMENTED-v1.1-P01-04-state-persistence.md
│   │   └── SPEC-IMPLEMENTED-v1.1-P02-01-admin-ready.md
│   ├── v1.2/
│   │   ├── SPEC-IMPLEMENTED-v1.2-P02-01-custom-categories.md
│   │   ├── SPEC-IMPLEMENTED-v1.2-P02-02-timer-reconnect.md
│   │   ├── SPEC-IMPLEMENTED-v1.2-P03-01-game-history.md
│   │   └── SPEC-IMPLEMENTED-v1.2-P03-02-sound-effects.md
│   ├── v2.0/
│   │   ├── SPEC-IMPLEMENTED-v2.0-P01-01-connection-loss.md
│   │   ├── SPEC-IMPLEMENTED-v2.0-P01-02-admin-transfer.md
│   │   ├── SPEC-IMPLEMENTED-v2.0-P01-03-mobile-responsive.md
│   │   ├── SPEC-IMPLEMENTED-v2.0-P02-01-room-codes.md
│   │   └── SPEC-IMPLEMENTED-v2.0-P03-01-performance.md
│   ├── v2.1/
│   │   ├── SPEC-IMPLEMENTED-v2.1-P01-01-server-safeguards.md     # Server safeguards ✅
│   │   ├── SPEC-IMPLEMENTED-v2.1-P01-02-message-validation.md    # Message validation ✅
│   │   ├── SPEC-IMPLEMENTED-v2.1-P01-03-input-sanitization.md    # XSS prevention ✅
│   │   ├── SPEC-IMPLEMENTED-v2.1-P01-04-language-picker.md       # Autocomplete picker ✅
│   │   ├── SPEC-IMPLEMENTED-v2.1-P01-05-new-languages.md         # ES, PT, FR, DE locales ✅
│   │   ├── SPEC-IMPLEMENTED-v2.1-P02-01-rate-limiting.md         # Rate limiting ✅
│   │   ├── SPEC-IMPLEMENTED-v2.1-P02-02-room-passwords.md        # Room passwords ✅
│   │   ├── SPEC-IMPLEMENTED-v2.1-P02-03-stale-room-cleanup.md    # Stale room cleanup ✅
│   │   ├── SPEC-IMPLEMENTED-v2.1-P02-04-lobby-category-visibility.md  # Category chips ✅
│   │   ├── SPEC-IMPLEMENTED-v2.1-P03-01-spectator-mode.md        # Spectator mode ✅
│   │   └── SPEC-IMPLEMENTED-v2.1-P03-02-lobby-auto-start.md      # Lobby auto-start ✅
│   ├── v2.2/
│   │   └── SPEC-IMPLEMENTED-v2.2-P01-01-locale-letter-pool.md    # Locale-aware letter pool ✅
│   └── v3.0/
│       ├── SPEC-IMPLEMENTED-v3.0-P01-01-ux-rules-visibility.md   # Rules visibility ✅
│       ├── SPEC-IMPLEMENTED-v3.0-P01-02-error-boundary-sentry.md   # Error boundary + Sentry ✅
│       ├── SPEC-IMPLEMENTED-v3.0-P01-03-pre-connection-ux-guard.md # Pre-connection UX guard ✅
│       ├── SPEC-IMPLEMENTED-v3.0-P02-01A-unit-testing.md                     # Unit tests ✅
│       ├── SPEC-IMPLEMENTED-v3.0-P02-01B-integration-testing.md              # Integration tests ✅
│       ├── SPEC-IMPLEMENTED-v3.0-P02-01C-e2e-testing.md                      # E2E tests ✅
│       ├── SPEC-IMPLEMENTED-v3.0-P02-02-ci-cd-pipeline.md                    # GitHub Actions CI/CD ✅
│       ├── SPEC-v3.0-P02-03-docker-compose.md                    # Docker Compose dev env 🔵
│       ├── SPEC-v3.0-P02-04-typescript-server.md                 # TS migration (server) 🔵
│       ├── SPEC-v3.0-P03-01-server-persistence.md                # Server-side game history 🔵
│       ├── SPEC-v3.0-P03-02-observability.md                     # Health + metrics + logging 🔵
│       ├── SPEC-v3.0-P03-03-pwa-support.md                       # PWA + service worker 🔵
│       └── SPEC-v3.0-P04-01-scale-beyond-mesh.md                 # SFU architecture research 🔵
│
└── src/
    ├── main.tsx            # ReactDOM entry
    ├── App.tsx             # Root: theme, router, providers
    ├── theme.ts            # MUI dark + light themes
    ├── vite-env.d.ts
    │
    ├── types/
    │   └── index.ts        # All shared TypeScript types
    │
    ├── stores/             # Zustand stores
    │   ├── useGameStore.ts       # Core game state + actions
    │   ├── usePeerStore.ts       # PeerJS connections
    │   └── useNotificationStore.ts # Snackbar notifications
    │
    ├── context/
    │   └── PeerContext.tsx  # PeerJS lifecycle + message handler (~600 lines)
    │
    ├── hooks/
    │   └── useGame.ts       # Game logic hook (timer, rounds, grading, chat)
    │
    ├── pages/
    │   ├── HomePage.tsx     # Login: nickname, create/join room
    │   ├── LobbyPage.tsx    # Room: player list, settings, ready-up, chat
    │   ├── GamePage.tsx     # Game: wheel, answer, grade, scoreboard
    │   └── HistoryPage.tsx  # Game history (localStorage, max 50 entries)
    │
    ├── components/
    │   ├── common/
    │   │   ├── ChatBox.tsx           # Chat UI
    │   │   ├── ConnectionStatus.tsx  # Connection health indicator (🟢🟡🔴)
    │   │   ├── CopyCode.tsx          # Room code copy button
    │   │   ├── ErrorBoundary.tsx     # Configurable error boundary class component
    │   │   ├── ErrorFallback.tsx     # Full-page error fallback with refresh + report
    │   │   ├── GameErrorFallback.tsx # Game-specific error fallback with lobby nav
    │   │   ├── InlineTip.tsx         # "i" icon with MUI Tooltip
    │   │   ├── LanguageSwitcher.tsx   # Autocomplete with flags (6 languages)
    │   │   ├── NotificationSnackbar.tsx
    │   │   ├── PhaseIndicator.tsx    # Visual stepper of game phases
    │   │   ├── PhaseTransitionBanner.tsx # Snackbar for phase changes
    │   │   ├── PlayerAvatar.tsx       # Avatar + ready/admin badges
    │   │   ├── RulesPanel.tsx        # Interactive "How to Play" dialog
    │   │   ├── SessionRestore.tsx     # Session persistence dialog
    │   │   └── Timer.tsx             # Round countdown bar
    │   ├── Lobby/
    │   │   ├── PlayerList.tsx
    │   │   └── GameSettingsPanel.tsx  # Categories, rounds, duration, letters
    │   └── Game/
    │       ├── AnswerTable.tsx        # Input fields per category
    │       ├── GradingPanel.tsx       # Peer voting UI
    │       ├── Scoreboard.tsx         # Round/game results
    │       ├── ScoreBreakdown.tsx     # Per-category scoring drill-down
    │       └── SlotMachine.tsx        # Animated letter wheel
    │
    ├── locales/
    │   ├── index.tsx         # LocaleProvider + useLocale + interpolation
    │   ├── tr.ts             # Turkish translations
    │   ├── en.ts             # English translations
    │   ├── es.ts             # Spanish translations
    │   ├── pt.ts             # Portuguese translations
    │   ├── fr.ts             # French translations
    │   └── de.ts             # German translations
    │
        ├── test/
    │   ├── setup.ts               # Vitest global setup (crypto, localStorage mock)
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
    │
    └── utils/
            ├── categories.ts     # 33 built-in category keys + helper
            ├── history.ts        # Game history localStorage (max 50 entries)
            ├── letters.ts        # Turkish letter pool (28 letters) + helpers
            ├── messageValidator.ts # PeerJS message schema validation
            ├── rateLimiter.ts    # Per-peer rate limiter for message spam
            ├── rules.ts          # Rules section metadata + localStorage flags
            ├── sanitize.ts       # Input sanitisation / XSS prevention
            ├── scoring.ts        # Score calculation (unique=10pts, shared=5pts)
            ├── session.ts        # Persisted session (1hr TTL in localStorage)
            ├── sounds.ts         # Sound manager (Web Audio API tones, localStorage toggle)
            └── tips.ts           # Contextual tip pool keyed by game event
```

---

## Architecture & Data Flow

### Component Tree (simplified)

```
main.tsx
└── App.tsx
    ├── ThemeProvider (MUI dark/light)
    ├── BrowserRouter
    │   └── LocaleProvider
    │       ├── Theme toggle button (fixed top-right)
    │       ├── PeerProvider
    │       │   ├── NotificationSnackbar (global)
    │       │   ├── SessionRestore (dialog on home, auto on other routes)
    │       │   └── Routes
    │       │       ├── / → HomePage
    │       │       ├── /room/:roomId → LobbyPage
    │       │       ├── /game/:roomId → GamePage
    │       │       └── * → redirect /
    │       └── LanguageSwitcher (only in HomePage)
```

### Data Flow

All state lives in Zustand stores. PeerJS messages flow through `PeerContext`.

```
User Action → Store Action → broadcastMessage (PeerJS)
                                   ↓
Other peers → handleMessage → Store Action → Re-render
```

### Three Zustand Stores

1. **useGameStore** — Core game state
   - `room: GameRoom | null` — full room state including players, settings, rounds
   - `localPlayerId / localNickname` — current client identity
   - `answers: Map<string, string>` — current round input
   - `submittedPlayers: string[]` — who has submitted this round
   - `gradingItems: GradingItem[]` — answers organized for grading display
   - `myVotes: Record<string, boolean>` — local votes {answerId: isValid}
   - `chatMessages: ChatMessage[]`
   - `timer: number | null` — countdown seconds
   - `scores: Record<string, number>` — per-round scores
   - 25+ actions (createRoom, joinRoom, startRound, submitAnswers, etc.)

 2. **usePeerStore** — Connection management
    - `peer: Peer | null`
    - `connections: Map<string, DataConnection>` — peerId → connection
    - `peerId: string | null`
    - `isConnected: boolean`
    - `connectionStatus: 'connected' | 'reconnecting' | 'disconnected'` — ping/pong health

3. **useNotificationStore** — Simple snackbar
   - `message: string | null`
   - `severity: 'info' | 'warning' | 'error' | 'success'`
   - `show()` / `dismiss()`

---

## Game Phases

```
lobby → wheel → answering → grading → round-results → wheel → ... → game-over
                ↑                    ↓
            (auto after timer)  (admin finalizes)
```

- **lobby**: Players join, set categories, ready up. Admin starts game.
- **wheel**: Random letter spins (slot machine animation), admin triggers start.
- **answering**: Players fill answers per category. Timer counts down. Auto-submits on expiry.
- **grading**: Players vote valid/invalid on each others' answers. Admin shows results when all votes in.
- **round-results**: Scoreboard for round. Admin starts next round.
- **game-over**: Final scoreboard. Admin can "play again" (resets game, stays in room) or back to lobby.

---

## Peer Messaging Protocol

| Message Type | Direction | Payload |
|---|---|---|---|
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

### Network Topology

- **Mesh topology**: every peer connects to every other peer
- Admin peer ID = room code (6-digit string)
- Non-admin peers get random PeerJS IDs
- Heartbeat every 8s from admin; monitor checks every 5s, detects stale after 25s
- Ping/pong every 10s between all peers; pong monitor checks every 5s, marks stale after 15s
- Connection status indicator: 🟢 connected (all pongs recent), 🟡 reconnecting (some stale, auto-reconnect active), 🔴 disconnected (all stale / reconnect failed)
- Auto-reconnect on stale connection: retries every 5s up to 6 attempts (30s), then falls to disconnected
- On admin disconnect: first remaining player adopts room code as peer ID and becomes admin
- On non-admin disconnect: removed from player list, admin transfer if they were admin

### Key Rules

- Admin peers use `room.code` as their PeerJS ID
- Admin is always the **first player** in the player list (index 0, used for admin transfer fallback)
- All state mutations happen locally and propagate via broadcast — no authoritative server
- Player disconnection is detected via: (1) `connection.close` event, (2) heartbeat timeout, (3) explicit `player-disconnected` message from another peer
- `isAdoptingPeerRef` flag prevents re-entrant peer creation during admin transfer

---

## Key Types (src/types/index.ts)

```typescript
GamePhase = 'lobby' | 'wheel' | 'answering' | 'grading' | 'round-results' | 'game-over'

Player        { id, nickname, isAdmin, isReady, score, isSpectator }
GameSettings  { categories, totalRounds, roundDuration, letterPool, customCategories }
Answer        { playerId, category, value }
Vote          { voterId, answerId, isValid }
Round         { letter, answers: Answer[], votes: Vote[] }
GameRoom      { code, adminId, players, settings, phase, currentRound, currentLetter, pendingLetter, rounds }
ChatMessage   { playerId, nickname, text, timestamp }
PeerMessage   { type: PeerMessageType, senderId, payload: unknown }
GradingItem   { playerId, nickname, answers: { category, value, answerId }[] }
GameHistoryEntry  { id, date, roomCode, playerCount, totalRounds, yourNickname, yourRank, yourScore, players: HistoryPlayer[], rounds: HistoryRound[] }
```

---

## Routing

| Path | Page | Description |
|---|---|---|---|
| `/` | HomePage | Login, create/join room; session restore dialog |
| `/room/:roomId` | LobbyPage | Player list, settings, ready-up, chat |
| `/game/:roomId` | GamePage | Wheel, answer table, grading, scoreboard |
| `/history` | HistoryPage | Past game results from localStorage |
| `*` | Redirect → `/` | SPA catch-all |

Navigation guards:
- LobbyPage navigates to `/game/:roomId` when `room.phase !== 'lobby'`
- SessionRestore auto-restores on non-`/` routes; shows dialog on `/`

---

## Theme

- Stored in `localStorage` key `"theme"` (`'dark'` or `'light'`)
- Dark default (`mode: 'dark'`)
- MUI theme customization: button radius (12), card backdrop blur, text field radius
- Fixed toggle button top-right (z-index 9999)

## i18n

- Locale stored in `localStorage` key `"locale"` (`'tr'`, `'en'`, `'es'`, `'pt'`, `'fr'`, `'de'`)
- Default: `'tr'`
- Translation keys follow dot notation: `home.title`, `category.isim_erkek`, etc.
- Translations: Turkish (native), English, Spanish, Portuguese, French, German
- Missing keys fall back to Turkish, then warn in dev
- Simple `{param}` interpolation via `t('key', { param: value })`

---

## Scoring Logic (src/utils/scoring.ts)

- Normalize answers: Turkish lowercase, strip non-alphanumeric
- Each voted answer: `valid votes > invalid votes` → accepted
- Accepted answers: `unique (no other player has same normalized answer in category)` → **10 points**, else **5 points**
- Empty answers skipped
- Scores are cumulative across rounds

---

## Categories

- 33 built-in categories (`src/utils/categories.ts`)
- Key pattern: `category.<snake_case_key>` with Turkish/English labels in locale files
- Up to **5 custom categories** per game
- Categories are **not** part of the type system — they're strings that can be built-in keys or custom names
- Minimum 3 categories required to ready up and start

---

## Letter Pool (src/utils/letters.ts)

- 28 Turkish letters: A B C Ç D E F G H I İ J K L M N O Ö P R S Ş T U Ü V Y Z
- Letter `Ğ` is excluded (no words start with it)
- Can be filtered to a subset via settings
- **v2.2:** Default pool adapts to admin's locale — Turkish, English, German, Spanish, French, Portuguese alphabets supported

---

## Session Persistence

- Stored in `localStorage` key `"isim-sehir-session"`
- TTL: 1 hour
- Data: `{ peerId, playerId, nickname, roomCode, timestamp }`
- On home page: dialog asks "Return to game?"
- On other routes: auto-reconnects
- Clear session on explicit exit

---

## Key Conventions

- **No CSS modules**: all styling via MUI `sx` prop or `createTheme`
- **No JSX comments** unless explaining non-obvious *why*
- **Zustand selectors** for granular re-render control
- **Existing locale patterns** — keys follow `section.key` convention
- **Animations** use inline `@keyframes` in `sx` prop (not `keyframes` import)
- **No barrel exports**: imports are direct file paths
- **React 19**: no class components, all functional with hooks
- **State updates propagate via PeerJS broadcast**: no server-side authoritative state
- **Game settings changes only by admin**; admin must not be ready to edit
- **Only admin can start game, start rounds, finalize grading**
- Admin can voluntarily transfer privileges to another player in the lobby (lobby/round-results/game-over phases) via a button in PlayerList
- `broadcastMessage` sends to all *other* peers — the sender must update their own local store explicitly
- Timer auto-submits answers when it hits 0
- Chat includes system messages for disconnect/admin transfer
- Snackbar notifications for disconnects

---

## Environment Variables

### Frontend (Vercel / `.env`)

| Variable | Default | Purpose |
|---|---|---|
| `VITE_PEER_HOST` | `localhost` | PeerJS server host |
| `VITE_PEER_PORT` | `9000` | PeerJS server port |
| `VITE_PEER_PATH` | `/isim-sehir` | PeerJS server path |

### Server (Render / `.env`)

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `9000` | Listening port |
| `MAX_PEERS_PER_ROOM` | `8` | Hard cap on connected peers per room |
| `MAX_CONNECTIONS_PER_SEC` | `5` | IP-level rate limit (connections/sec) |
| `CONNECTION_TIMEOUT_MS` | `30000` | Idle peer expiry in ms |
| `ROOM_TTL_MINUTES` | `5` | Stale peer cleanup threshold in minutes |
| `ALLOWED_ORIGINS` | `http://localhost:5173,https://isim-sehir-phi.vercel.app` | CORS-allowed origins (comma-separated) |

---

## Dev Commands

```bash
npm run dev       # Vite dev server on :5173
npm run build     # tsc + vite build
npm run preview   # Vite preview
npm run lint      # tsc --noEmit (type check only, no linter)
npm run test      # vitest run (unit + store tests)
npm run test:watch    # vitest watch mode
npm run test:coverage # vitest run --coverage (85%+ stmts, 70%+ branches)
npm run test:e2e      # playwright test (3 E2E smoke tests — requires dev + PeerJS server)
```

Server:
```bash
cd server && npm start   # PeerJS on :9000
```

---

## Spec Files Reference

| File | Feature / Version |
|---|---|
| `v1.0/SPEC-v1.0.md` | Base game (lobby, wheel, answering, grading, scoring) |
| `v1.1/SPEC-IMPLEMENTED-v1.1-P01-01-player-disconnect.md` | v1.1 — Disconnect detection + cleanup ✅ |
| `v1.1/SPEC-IMPLEMENTED-v1.1-P01-02-admin-transfer.md` | v1.1 — Seamless admin handover on disconnect ✅ |
| `v1.1/SPEC-IMPLEMENTED-v1.1-P01-03-localisation.md` | v1.1 — TR/EN i18n ✅ |
| `v1.1/SPEC-IMPLEMENTED-v1.1-P01-04-state-persistence.md` | v1.1 — Session restore on refresh ✅ |
| `v1.1/SPEC-IMPLEMENTED-v1.1-P02-01-admin-ready.md` | v1.1 — Admin must be ready to start ✅ |
| `v1.2/SPEC-IMPLEMENTED-v1.2-P02-01-custom-categories.md` | v1.2 — Custom category support ✅ |
| `v1.2/SPEC-IMPLEMENTED-v1.2-P02-02-timer-reconnect.md` | v1.2 — Timer + reconnect improvements ✅ |
| `v1.2/SPEC-IMPLEMENTED-v1.2-P03-01-game-history.md` | v1.2 — Game history / replay ✅ |
| `v1.2/SPEC-IMPLEMENTED-v1.2-P03-02-sound-effects.md` | v1.2 — Sound effects ✅ |
| `v2.0/SPEC-IMPLEMENTED-v2.0-P01-01-connection-loss.md` | v2.0 — Ping/pong, connection indicator, auto-reconnect ✅ |
| `v2.0/SPEC-IMPLEMENTED-v2.0-P01-02-admin-transfer.md` | v2.0 — Voluntary admin transfer ✅ |
| `v2.0/SPEC-IMPLEMENTED-v2.0-P01-03-mobile-responsive.md` | v2.0 — Mobile responsive layout, bottom sheet grading ✅ |
| `v2.0/SPEC-IMPLEMENTED-v2.0-P02-01-room-codes.md` | v2.0 — 4-char alphanumeric room codes ✅ |
| `v2.0/SPEC-IMPLEMENTED-v2.0-P03-01-performance.md` | v2.0 — Memoisation, lazy loading, bundle analysis ✅ |
| `v2.1/SPEC-IMPLEMENTED-v2.1-P01-01-server-safeguards.md` | v2.1 — CORS, rate limiting, room caps, connection timeouts ✅ |
| `v2.1/SPEC-IMPLEMENTED-v2.1-P01-02-message-validation.md` | v2.1 — PeerJS message schema validation ✅ |
| `v2.1/SPEC-IMPLEMENTED-v2.1-P01-03-input-sanitization.md` | v2.1 — XSS prevention, input sanitization ✅ |
| `v2.1/SPEC-IMPLEMENTED-v2.1-P01-04-language-picker.md` | v2.1 — Autocomplete language picker ✅ |
| `v2.1/SPEC-IMPLEMENTED-v2.1-P01-05-new-languages.md` | v2.1 — ES, PT, FR, DE locale files ✅ |
| `v2.1/SPEC-IMPLEMENTED-v2.1-P02-01-rate-limiting.md` | v2.1 — Rate limiting on peer messages ✅ |
| `v2.1/SPEC-IMPLEMENTED-v2.1-P02-02-room-passwords.md` | v2.1 — Room passwords / private rooms ✅ |
| `v2.1/SPEC-IMPLEMENTED-v2.1-P02-03-stale-room-cleanup.md` | v2.1 — Stale room cleanup / abandoned room reclamation ✅ |
| `v2.1/SPEC-IMPLEMENTED-v2.1-P02-04-lobby-category-visibility.md` | v2.1 — Real-time category chip display for all players ✅ |
| `v2.1/SPEC-IMPLEMENTED-v2.1-P03-01-spectator-mode.md` | v2.1 — Read-only game observers ✅ |
| `v2.1/SPEC-IMPLEMENTED-v2.1-P03-02-lobby-auto-start.md` | v2.1 — Countdown when all ready ✅ |
| `v2.2/SPEC-IMPLEMENTED-v2.2-P01-01-locale-letter-pool.md` | v2.2 — Locale-aware letter pool ✅ |
| `v3.0/SPEC-IMPLEMENTED-v3.0-P01-01-ux-rules-visibility.md` | v3.0 — Rules visibility, phase indicators, tooltips ✅ |
| `v3.0/SPEC-IMPLEMENTED-v3.0-P01-02-error-boundary-sentry.md` | v3.0 — Error boundaries + Sentry crash reporting ✅ |
| `v3.0/SPEC-IMPLEMENTED-v3.0-P01-03-pre-connection-ux-guard.md` | v3.0 — Server health probe, gated buttons, connection banner ✅ |
| `v3.0/SPEC-IMPLEMENTED-v3.0-P02-01A-unit-testing.md` | v3.0 — Unit tests (pure logic + Zustand stores) ✅ |
| `v3.0/SPEC-IMPLEMENTED-v3.0-P02-01B-integration-testing.md` | v3.0 — Integration tests (mock peer messaging) ✅ |
| `v3.0/SPEC-IMPLEMENTED-v3.0-P02-01C-e2e-testing.md` | v3.0 — E2E tests (Playwright browser smoke tests) ✅ |
| `v3.0/SPEC-IMPLEMENTED-v3.0-P02-02-ci-cd-pipeline.md` | v3.0 — GitHub Actions CI/CD pipeline ✅ |
| `v3.0/SPEC-v3.0-P02-03-docker-compose.md` | v3.0 — Docker Compose for local development 🔵 |
| `v3.0/SPEC-v3.0-P02-04-typescript-server.md` | v3.0 — TypeScript migration for signalling server 🔵 |
| `v3.0/SPEC-v3.0-P03-01-server-persistence.md` | v3.0 — Server-side game history & leaderboard 🔵 |
| `v3.0/SPEC-v3.0-P03-02-observability.md` | v3.0 — Health endpoint, metrics, structured logging 🔵 |
| `v3.0/SPEC-v3.0-P03-03-pwa-support.md` | v3.0 — PWA manifest, service worker, offline support 🔵 |
| `v3.0/SPEC-v3.0-P04-01-scale-beyond-mesh.md` | v3.0 — SFU architecture research & mesh scaling 🔵 |
