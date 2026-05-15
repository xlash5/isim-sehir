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
├── specs/                  # Feature specifications (v1.0–v2.0)
│   ├── SPEC-v1.0.md
│   ├── SPEC-v1.1-*.md     # admin-ready, admin-transfer, localisation,
│   │                       # player-disconnect, state-persistence
│   ├── SPEC-v1.2-*.md     # custom-categories, game-history, sound-effects,
│   │                       # timer-reconnect
│   └── SPEC-v2.0-*.md     # room-codes, connection-loss, admin-transfer,
│                           # mobile-responsive, performance
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
    │   │   ├── CopyCode.tsx          # Room code copy button
    │   │   ├── LanguageSwitcher.tsx   # TR/EN toggle with flags
    │   │   ├── NotificationSnackbar.tsx
    │   │   ├── PlayerAvatar.tsx       # Avatar + ready/admin badges
    │   │   ├── SessionRestore.tsx     # Session persistence dialog
    │   │   └── Timer.tsx             # Round countdown bar
    │   ├── Lobby/
    │   │   ├── PlayerList.tsx
    │   │   └── GameSettingsPanel.tsx  # Categories, rounds, duration, letters
    │   └── Game/
    │       ├── AnswerTable.tsx        # Input fields per category
    │       ├── GradingPanel.tsx       # Peer voting UI
    │       ├── Scoreboard.tsx         # Round/game results
    │       └── SlotMachine.tsx        # Animated letter wheel
    │
    ├── locales/
    │   ├── index.tsx         # LocaleProvider + useLocale + interpolation
    │   ├── tr.ts             # Turkish translations
    │   └── en.ts             # English translations
    │
        └── utils/
            ├── categories.ts     # 33 built-in category keys + helper
            ├── letters.ts        # Turkish letter pool (28 letters) + helpers
            ├── scoring.ts        # Score calculation (unique=10pts, shared=5pts)
            ├── session.ts        # Persisted session (1hr TTL in localStorage)
            ├── history.ts        # Game history localStorage (max 50 entries)
            └── sounds.ts         # Sound manager (Web Audio API tones, localStorage toggle)
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
|---|---|---|
| `join-room` | Player→Admin & Admin→Others | `{ id, nickname }` |
| `room-state-sync` | Admin→Joiner | `{ room: GameRoom }` |
| `player-ready` | Player→Admin→Others | `{ playerId, ready }` |
| `settings-update` | Admin→All | Partial GameSettings |
| `game-start` | Admin→All | `{}` |
| `round-start` | Admin→All | `{ letter }` |
| `answers-submit` | Player→Admin+Others | `{ answers: Answer[] }` |
| `vote` | Player→Admin+Others | `Vote` |
| `round-end` | Admin→All | `{ roundScores, updatedPlayers }` |
| `chat-message` | Player→All | `ChatMessage` |
| `heartbeat` | Admin→All (8s interval) | `{}` |
| `ping` | Any→All (10s interval) | `{}` |
| `pong` | Any→Target | `{}` |
| `player-disconnected` | Detector→All | `{ playerId }` |
| `admin-transfer` | Detector→All | `{ newAdminId }` |
| `admin-transfer-request` | Admin→All | `{ newAdminId }` |
| `reconnect` | Reconnecting→Admin | `{ playerId, nickname }` |
| `reconnect-accepted` | Admin→Reconnecting | `{ room: GameRoom, timer: number \| null }` |

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

Player        { id, nickname, isAdmin, isReady, score }
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

- Locale stored in `localStorage` key `"locale"` (`'tr'` or `'en'`)
- Default: `'tr'`
- Translation keys follow dot notation: `home.title`, `category.isim_erkek`, etc.
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
- **No comments in code** (project convention)
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

Set on Vercel (or `.env` for dev):

| Variable | Default | Purpose |
|---|---|---|
| `VITE_PEER_HOST` | `localhost` | PeerJS server host |
| `VITE_PEER_PORT` | `9000` | PeerJS server port |
| `VITE_PEER_PATH` | `/isim-sehir` | PeerJS server path |

---

## Dev Commands

```bash
npm run dev       # Vite dev server on :5173
npm run build     # tsc + vite build
npm run preview   # Vite preview
npm run lint      # tsc --noEmit (type check only, no linter)
```

Server:
```bash
cd server && npm start   # PeerJS on :9000
```

---

## Spec Files Reference

| File | Feature / Version |
|---|---|
| `SPEC-v1.0.md` | Base game (lobby, wheel, answering, grading, scoring) |
| `SPEC-v1.1-admin-ready.md` | Admin must be ready to start |
| `SPEC-v1.1-admin-transfer.md` | Seamless admin handover on disconnect |
| `SPEC-v1.1-localisation.md` | TR/EN i18n |
| `SPEC-v1.1-player-disconnect.md` | Disconnect detection + cleanup |
| `SPEC-v1.1-state-persistence.md` | Session restore on refresh |
| `SPEC-v1.2-custom-categories.md` | Custom category support |
| `SPEC-v1.2-game-history.md` | Game history / replay ✅ |
| `SPEC-v1.2-sound-effects.md` | Sound effects ✅ |
| `SPEC-v1.2-timer-reconnect.md` | Timer + reconnect improvements ✅ |
| `SPEC-v2.0-room-codes.md` | v2.0 — 4-char alphanumeric room codes ✅ |
| `SPEC-v2.0-connection-loss.md` | v2.0 — Ping/pong, connection indicator, auto-reconnect ✅ |
| `SPEC-v2.0-admin-transfer.md` | v2.0 — Voluntary admin transfer ✅ |
| `SPEC-v2.0-mobile-responsive.md` | v2.0 — Mobile responsive layout, bottom sheet grading ✅ |
| `SPEC-v2.0-performance.md` | v2.0 — Memoisation, lazy loading, bundle analysis ✅ |
