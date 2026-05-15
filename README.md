# İsim Şehir

Multiplayer peer-to-peer WebRTC version of the classic Turkish word game.
Players take turns spinning a letter wheel, then write words starting with that
letter across ~33 categories. Peers grade each other's answers.

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

## Implemented Features

### Gameplay
- 33 Turkish categories + up to 5 custom categories per game
- Anonymous nickname-based login
- 4-character alphanumeric room codes (v2.0)
- Peer grading with changeable votes until admin finalizes
- Cumulative score + per-round breakdown (unique=10pts, shared=5pts)
- Locale-aware letter pool — adapts to admin's language (Turkish, English, German, Spanish, French, Portuguese alphabets) (v2.2)
- Turkish letter pool (28 letters, Ğ excluded)
- Configurable rounds, round duration, letter pool
- Spectator mode — join as read-only observer with distinct badge (v2.1)

### Multiplayer & Networking
- Peer-to-peer WebRTC mesh topology via PeerJS (v1.0)
- Ping/pong health checks every 10s with connection status indicator (v2.0)
- Auto-reconnect on stale connection (up to 6 retries, 30s) (v2.0)
- Heartbeat-based admin disconnect detection (v1.1)
- Seamless admin transfer on disconnect (v1.1)
- Voluntary admin transfer in lobby/round-results/game-over (v2.0)
- Player disconnect notifications (snackbar + chat message) (v1.1)
- Session persistence on page refresh with dialog + auto-reconnect (v1.1)
- Optional room passwords for private games (v2.1)

### UI & UX
- Dark/light theme toggle (persisted to localStorage)
- i18n: Turkish, English, Spanish, Portuguese, French, German with searchable autocomplete picker (v2.1)
- Mobile responsive layout with bottom sheet grading (v2.0)
- Game history in localStorage (max 50 entries) (v1.2)
- Sound effects via Web Audio API with toggle (v1.2)
- Timer with reconnect-safe countdown (v1.2)
- Performance: memoisation, lazy loading, bundle analysis (v2.0)
- Interactive "How to Play" rules panel with collapsible sections (v3.0)
- Visual phase indicator stepper (v3.0)
- Phase transition banners explaining game flow (v3.0)
- Inline tooltips on all non-obvious UI elements (v3.0)
- Per-round scoring drill-down with verdict breakdown (v3.0)
- Contextual chat tips on game events (v3.0)
- Pre-connection server health probe with connection banner, gated action buttons, and retry mechanism (v3.0)

## Architecture

- **Frontend:** React SPA deployed on Vercel
- **Signaling Server:** Custom PeerJS server on Render
- **Multiplayer:** WebRTC mesh topology (every peer connects to every other peer)
- **State:** All state in Zustand stores, propagated via PeerJS broadcast

## Specs

| Version | Priority | Feature | Status |
|---|---|---|---|
| v1.0 | — | Base game (lobby, wheel, answering, grading, scoring) | ✅ |
| v1.1 | P01 | Player disconnect, admin transfer, i18n, state persistence | ✅ |
| v1.1 | P02 | Admin must be ready to start | ✅ |
| v1.2 | P02 | Custom categories, timer reconnect | ✅ |
| v1.2 | P03 | Game history, sound effects | ✅ |
| v2.0 | P01 | Connection loss, admin transfer, mobile responsive | ✅ |
| v2.0 | P02 | Room code generation | ✅ |
| v2.0 | P03 | Performance optimisations | ✅ |
| **v2.1** | **P01** | **Server safeguards — CORS, IP rate limits, connection caps** | ✅ |
| **v2.1** | **P01** | **Message schema validation — PeerJS payload type checking** | ✅ |
| **v2.1** | **P01** | **Input sanitisation — XSS prevention layer** | ✅ |
| **v2.1** | **P01** | **Language picker autocomplete — searchable dropdown** | ✅ |
| **v2.1** | **P01** | **New languages — ES, PT, FR, DE locale files** | ✅ |
| **v2.1** | **P02** | **Rate limiting — anti-spam on peer messages** | ✅ |
| **v2.1** | **P02** | **Room passwords — optional private rooms** | ✅ |
| **v2.1** | **P02** | **Stale room cleanup — abandoned room reclamation** | ✅ |
| **v2.1** | **P02** | **Lobby category visibility — real-time chip display** | ✅ |
| **v2.1** | **P03** | **Spectator mode — read-only game observers** | ✅ |
| **v2.1** | **P03** | **Lobby auto-start — countdown when all ready** | ✅ |
| **v2.2** | **P01** | **Locale-aware letter pool — alphabet adapts to admin's language** | ✅ |
| **v3.0** | **P01** | **UX Rules & Behaviour Visibility — RulesPanel, PhaseIndicator, tooltips, chat tips, scoring drill-down** | ✅ |
| **v3.0** | **P01** | **Error Boundaries & Sentry — crash-safe React tree, Sentry monitoring** | ✅ |
| **v3.0** | **P01** | **Pre-Connection UX Guard — server health probe, gated buttons, connection banner on home page** | ✅ |

### Planned
- **P02** Testing strategy, CI/CD pipeline, Docker Compose, TypeScript signalling server
- **P03** Server persistence, observability, PWA support
- **P04** Mesh scaling alternatives

Detailed specifications in [`specs/`](./specs/). See [`specs/v3.0/`](./specs/v3.0/) for all planned features.

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc + vite build
npm run lint       # tsc --noEmit
```

Signalling server:
```bash
cd server && npm install && npm start   # http://localhost:9000
```

## Environment Variables

### Frontend (Vercel / `.env`)

| Variable | Default | Purpose |
|---|---|---|
| `VITE_PEER_HOST` | `localhost` | PeerJS server host |
| `VITE_PEER_PORT` | `9000` | PeerJS server port |
| `VITE_PEER_PATH` | `/isim-sehir` | PeerJS server path |
| `VITE_SENTRY_DSN` | — | Sentry project DSN (optional, no-op if absent) |
| `VITE_SENTRY_TRACES_SAMPLE_RATE` | `0` | Performance tracing sample rate (0-1) |
| `VITE_SENTRY_REPLAY_SAMPLE_RATE` | `0` | Session replay sample rate (0-1) |

### Server (Render / `.env`)

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `9000` | Listening port |
| `MAX_PEERS_PER_ROOM` | `8` | Hard cap on connected peers per room |
| `MAX_CONNECTIONS_PER_SEC` | `5` | IP-level rate limit (connections/sec) |
| `CONNECTION_TIMEOUT_MS` | `30000` | Idle peer expiry in ms |
| `ROOM_TTL_MINUTES` | `5` | Stale peer cleanup threshold in minutes |
| `ALLOWED_ORIGINS` | `http://localhost:5173,https://isim-sehir-phi.vercel.app` | CORS-allowed origins (comma-separated) |
