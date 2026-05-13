# İsim Şehir — v1.1 Game State Persistence (Page Refresh)

> **Priority:** High — addresses a known issue from v1.0
> **Version target:** v1.1
> **Status:** 🟢 Implemented

## Overview

If a player accidentally refreshes their browser tab during a game, all local state is lost. This spec introduces `localStorage`-based state persistence so a player can recover their session after a refresh.

## Requirements

1. **Auto-save** the player's session state to `localStorage` on every meaningful state change.
2. **Auto-restore** on page load — if the player refreshes, the app detects a saved session and reconnects.
3. **Scope:** persist the player's own Peer ID, player ID, nickname, and room code.
4. **Reconnection:** after restore, reconnect to the room via a dedicated `reconnect` message.
5. **Two modes:**
   - **Dialog mode** (base URL `/`): show a prompt asking if the user wants to rejoin.
   - **Auto mode** (`/room/xxx`, `/game/xxx`): reconnect silently without user interaction.
6. **Cleanup:** clear the saved session when the player intentionally leaves the room.
7. **Privacy:** never persist other players' data or game answers beyond what is needed for reconnection.

## Technical Design

### What is Persisted

`src/utils/session.ts` — `saveSession`, `loadSession` (1-hour TTL), `clearSession`.

```ts
interface PersistedSession {
  peerId: string       // PeerJS peer ID (reused on reconnect)
  playerId: string     // Game player UUID
  nickname: string
  roomCode: string
  timestamp: number    // for expiry detection (> 1 hour → ignored)
}
```

**Do NOT persist:** full game state (answers, votes, rounds), other players' data, chat history.

### Components

| File | Role |
|---|---|
| `src/utils/session.ts` | `saveSession`, `loadSession`, `clearSession` |
| `src/components/common/SessionRestore.tsx` | Checks for saved session on every page load; shows dialog or auto-reconnects |
| `src/context/PeerContext.tsx` | Handles `reconnect` / `reconnect-accepted` messages; exports `reconnectToPeer` |

### When to Save

- On room creation (after peer opens and navigation occurs)
- On room join (after peer opens and navigation occurs)

### Restore Behaviour

`SessionRestore` (mounted in `App.tsx` inside `PeerProvider`) runs on every page load:

1. Calls `loadSession()` — returns `null` if no session or expired (> 1 hour).
2. If session found and `peerId === roomCode` (was admin), silently clears session (admin reconnection is not supported).
3. Otherwise checks `window.location.pathname`:
   - **`/` (base URL):** shows a dialog:
     > "Oyuna geri dönmek ister misin? [nickname] olarak [roomCode] odasına bağlan."
     > [Evet] [Hayır]
   - **`/room/xxx` or `/game/xxx`:** auto-reconnects without dialog.
4. On "Evet" (dialog) or auto mode:
   - `setLocalPlayer(playerId, nickname)`
   - `createPeer(peerId)` — re-creates the PeerJS peer with the saved ID
   - When `peerId` becomes available, calls `joinRoom(roomCode)` + `reconnectToPeer(roomCode)`
   - Navigates to `/room/{roomCode}`.
5. A 10-second timeout clears the session if the peer fails to connect.

### When to Clear

- Player clicks "Lobiye Dön" (Back to Lobby)
- Player clicks "Çıkış" (Exit) or "Ana Sayfa" from lobby
- Session is expired (> 1 hour)
- Saved `peerId === roomCode` (admin session — not recoverable)

### Reconnection Protocol

1. Reconnecting player creates a Peer with the **same** `peerId`.
2. Connects to the room's admin peer (room code).
3. Sends a `reconnect` message with `{ playerId, nickname }`.
4. Admin receives `reconnect`:
   - Re-adds the player via `addPlayer` (idempotent).
   - Updates `peerToPlayerMap` for the new connection.
   - Sends `reconnect-accepted` with full room state back to the player.
   - Broadcasts `join-room` to all other connected peers so they re-add the player.
5. Player receives `reconnect-accepted` and applies the room state.
6. Player resumes at the current `gamePhase`.

### New Message Types

| Message | Description | Sender |
|---|---|---|
| `reconnect` | Player reconnecting after refresh | Reconnecting player |
| `reconnect-accepted` | Admin acknowledges reconnection, sends full state | Admin |

### SPA 404 Fallback

When deploying the production build to static hosts, refreshing on `/room/xxx` or `/game/xxx` would cause a 404 (the server doesn't know those paths).

**Fix:** `vite.config.ts` includes a `closeBundle` plugin that copies `dist/index.html` to `dist/404.html` after every build. Hosts like GitHub Pages serve `404.html` for unknown routes, which loads the full SPA and lets React Router handle the routing.

For local development, `npm run dev` and `npm run preview` have SPA fallback built in.

## Acceptance Criteria

- [x] Refreshing the page during a game shows a reconnection prompt (on `/`) or auto-reconnects (on `/room/`, `/game/`)
- [x] Accepting reconnection restores the player to their room
- [x] Player's nickname and identity are preserved
- [x] Player can resume from the current game phase
- [x] Auto-reconnect on `/room/xxx` and `/game/xxx` works without dialog
- [x] Old sessions (> 1 hour) are ignored
- [x] Clearing the session on explicit leave works correctly
- [x] No sensitive game data (answers, votes) is persisted to localStorage
- [x] Production build generates `404.html` for SPA fallback on static hosts
- [x] Admin session (peerId === roomCode) is rejected gracefully
