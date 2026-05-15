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
- Turkish letter pool (28 letters, Ğ excluded)
- Configurable rounds, round duration, letter pool

### Multiplayer & Networking
- Peer-to-peer WebRTC mesh topology via PeerJS (v1.0)
- Ping/pong health checks every 10s with connection status indicator (v2.0)
- Auto-reconnect on stale connection (up to 6 retries, 30s) (v2.0)
- Heartbeat-based admin disconnect detection (v1.1)
- Seamless admin transfer on disconnect (v1.1)
- Voluntary admin transfer in lobby/round-results/game-over (v2.0)
- Player disconnect notifications (snackbar + chat message) (v1.1)
- Session persistence on page refresh with dialog + auto-reconnect (v1.1)

### UI & UX
- Dark/light theme toggle (persisted to localStorage)
- i18n: Turkish & English with instant language switcher (v1.1)
- Mobile responsive layout with bottom sheet grading (v2.0)
- Game history in localStorage (max 50 entries) (v1.2)
- Sound effects via Web Audio API with toggle (v1.2)
- Timer with reconnect-safe countdown (v1.2)
- Performance: memoisation, lazy loading, bundle analysis (v2.0)

## Architecture

- **Frontend:** React SPA deployed on Vercel
- **Signaling Server:** Custom PeerJS server on Render
- **Multiplayer:** WebRTC mesh topology (every peer connects to every other peer)
- **State:** All state in Zustand stores, propagated via PeerJS broadcast

## Specs

| Version | Spec | Status |
|---|---|---|
| v1.0 | Base game (lobby, wheel, answering, grading, scoring) | ✅ |
| v1.1 | Admin ready, admin transfer, i18n, player disconnect, state persistence | ✅ |
| v1.2 | Custom categories, game history, sound effects, timer reconnect | ✅ |
| v2.0 | Room codes, connection loss, admin transfer, mobile, performance | ✅ |
| **v2.1** | **Language picker autocomplete** — searchable dropdown for 6+ locales | 📝 Draft |
| **v2.1** | **New languages** — ES, PT, FR, DE locale files | 📝 Draft |
| **v2.1** | **Lobby category visibility** — real-time chip display for all players | 📝 Draft |
| **v2.1** | **Message schema validation** — PeerJS payload type checking | 📝 Draft |
| **v2.1** | **Input sanitisation** — XSS prevention layer | 📝 Draft |
| **v2.1** | **Rate limiting** — anti-spam on peer messages | 📝 Draft |
| **v2.1** | **Server safeguards** — CORS, IP rate limits, connection caps | 📝 Draft |
| **v2.1** | **Room passwords** — optional private rooms | 📝 Draft |
| **v2.1** | **Spectator mode** — read-only game observers | 📝 Draft |
| **v2.1** | **Stale room cleanup** — server-side abandoned room reclamation | 📝 Draft |
| **v2.1** | **Lobby auto-start** — countdown when all players ready | 📝 Draft |

Detailed specifications in [`specs/`](./specs/).

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

Set on Vercel (or `.env` for dev):

| Variable | Default | Purpose |
|---|---|---|
| `VITE_PEER_HOST` | `localhost` | PeerJS server host |
| `VITE_PEER_PORT` | `9000` | PeerJS server port |
| `VITE_PEER_PATH` | `/isim-sehir` | PeerJS server path |
