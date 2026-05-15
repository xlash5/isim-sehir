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

## Specs

All specs in [`specs/v2.1/`](./specs/v2.1/). Implemented specs are renamed `SPEC-IMPLEMENTED-*`. See [`README.md`](./README.md) for the feature matrix.
