# İsim Şehir

Multiplayer peer-to-peer WebRTC version of the classic Turkish word game.

**Play:** [isim-sehir-phi.vercel.app](https://isim-sehir-phi.vercel.app/)

## Stack

React 19 + TypeScript 5 + Vite 6 + MUI 6 + Zustand 5 + PeerJS + React Router 7

## Features

- Dark/light theme (top-right toggle, persisted to localStorage)
- Peer-to-peer WebRTC (PeerJS mesh topology)
- Peer grading (category-based, changeable votes until admin finalizes)
- Cumulative score + per-round breakdown
- 33 Turkish categories
- Anonymous nickname-based login
- Seamless admin transfer on disconnect (heartbeat-based detection + peer reconnection)
- Player disconnect notification (snackbar + chat message) with in-game state cleanup
- Admin must be "Hazır" before starting the game (v1.1)
- i18n: Turkish & English with instant language switcher (persisted to localStorage)
- Session persistence on page refresh — dialog prompt on home page, auto-reconnect on room/game routes (v1.1)

## Architecture

- **Frontend:** React SPA deployed on Vercel
- **Signaling Server:** Custom PeerJS server on Render
- **Multiplayer:** WebRTC mesh topology (PeerJS)

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build
npm run lint       # type check
```

For the signaling server:
```bash
cd server && npm install && npm start   # http://localhost:9000
```

## Environment Variables

Set on Vercel:

| Variable | Example |
|---|---|
| `VITE_PEER_HOST` | `isim-sehir-server.onrender.com` |
| `VITE_PEER_PORT` | `443` |
| `VITE_PEER_PATH` | `/isim-sehir` |

Detailed specifications: [`specs/`](./specs/)
