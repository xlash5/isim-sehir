# İsim Şehir — v2.1 Spectator Mode

> **Priority:** Low
> **Version target:** v2.1
> **Status:** 📝 Draft

## Overview

Allow players to join a room as **spectators** — they can watch the game and chat, but cannot submit answers, vote, or participate in grading.

## Requirements

1. **Role on join** — when joining, a toggle "Join as Spectator" (default off) sets `isSpectator: true` on the `Player` object.
2. **Player type update** — add `isSpectator: boolean` to `Player` interface.
3. **Spectator restrictions:**
   - Cannot ready up (ready button hidden/disabled)
   - Do not count toward the `players.length >= 2` minimum
   - Cannot submit answers during `answering` phase
   - Cannot vote during `grading` phase
   - Cannot become admin (skipped in admin transfer)
4. **Spectator UI:**
   - Different badge/icon in PlayerList (e.g. eye icon instead of avatar)
   - "N spectators" count in player list header
   - In GamePage: hide answer table and grading panel; show a "Watching..." overlay
   - Chat is fully available
5. **Admin transfer** — spectators are skipped when choosing the next admin.
6. **Joining mid-game** — spectators can join even if game is in progress (phase is not `lobby`). Admin receives a `spectate-request` message; on accept, sends `room-state-sync` with current game state.

## Peer Messages to Add

| Message Type | Direction | Payload |
|---|---|---|
| `join-room` | Player→Admin | Add `isSpectator?: boolean` |
| `spectate-request` | Player→Admin | `{ playerId, nickname }` |

## Files to Modify

- `src/types/index.ts` — add `isSpectator` to `Player`, add `spectate-request` to `PeerMessageType`
- `src/pages/HomePage.tsx` — add "Join as Spectator" toggle
- `src/pages/LobbyPage.tsx` — hide ready/start for spectators
- `src/pages/GamePage.tsx` — show watching overlay for spectators
- `src/components/Lobby/PlayerList.tsx` — spectator badge + count
- `src/context/PeerContext.tsx` — handle `spectate-request`, skip spectators in admin transfer

## Acceptance Criteria

- [ ] Players can toggle spectator mode on join
- [ ] Spectators are shown with a distinct badge
- [ ] Spectators cannot ready up, submit answers, or vote
- [ ] Spectators do not block game start (not counted in minimum)
- [ ] Spectators can chat
- [ ] Admin transfer skips spectators
