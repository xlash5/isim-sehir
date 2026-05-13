# İsim Şehir — v1.1 Game State Persistence (Page Refresh)

> **Priority:** High — addresses a known issue from v1.0
> **Version target:** v1.1
> **Status:** 🔴 Not implemented

## Overview

Currently if a player accidentally refreshes their browser tab during a game, all local state is lost. They are disconnected from the room and cannot rejoin. This spec introduces `localStorage`-based state persistence so a player can recover their session after an accidental refresh.

## Requirements

1. **Auto-save** the player's session state to `localStorage` on every meaningful state change.
2. **Auto-restore** on page load — if the player refreshes, the app detects a saved session and reconnects.
3. **Scope:** persist the player's own Peer ID, nickname, room code, and last known game phase.
4. **Reconnection:** after restore, attempt to reconnect to the room via the PeerJS mesh.
5. **Cleanup:** clear the saved session when the player intentionally leaves the room or closes the game.
6. **Privacy:** never persist other players' data or game answers beyond what is needed for reconnection.

## Technical Design

### What to Persist

```ts
interface PersistedSession {
  peerId: string
  nickname: string
  roomCode: string
  timestamp: number  // for expiry detection
}
```

**Do NOT persist:** full game state (answers, votes, rounds), other players' data, chat history.

### When to Save

- On room creation (`localStorage.setItem('isim-sehir-session', ...)`)
- On room join
- On nickname change (within the same session)

### When to Restore

- On app mount (`App.tsx` or `HomePage.tsx`), check for a saved session.
- If session exists and `timestamp` is less than 1 hour old, show a dialog:
  > "Oyuna geri dönmek ister misin? [nickname] olarak [roomCode] odasına bağlan."
  > [Evet] [Hayır]
- If user clicks "Evet", restore the session and redirect to the room.
- If "Hayır", clear the session and show the home screen normally.

### When to Clear

- Player clicks "Lobiye Dön" (Back to Lobby) or "Odayı Terk Et"
- Game ends and player clicks home
- Session is expired (> 1 hour)

### Reconnection Logic

1. Restore `peerId`, `nickname`, `roomCode` from localStorage.
2. Create a new Peer with the **same** `peerId` (PeerJS allows reusing an ID if the old connection is gone).
3. Connect to the room's admin peer.
4. Send a `reconnect` message with the player's info.
5. Admin responds with a full `room-state-sync`.
6. Player resumes from the current `gamePhase`.

### New Message Types

| Message | Description | Sender |
|---|---|---|
| `reconnect` | Player reconnecting after refresh | Reconnecting player |
| `reconnect-accepted` | Admin acknowledges reconnection, sends full state | Admin |

### UI Changes

- A reconnection dialog component (modal with "Evet"/"Hayır" buttons).
- Loading state while reconnecting (spinner + "Yeniden bağlanılıyor..." text).

## Acceptance Criteria

- [ ] Refreshing the page during a game shows a reconnection prompt
- [ ] Accepting reconnection restores the player to their room
- [ ] Player's nickname and identity are preserved
- [ ] Player can resume from the current game phase
- [ ] Old sessions ( > 1 hour) are ignored
- [ ] Clearing the session on explicit leave works correctly
- [ ] No sensitive game data (answers, votes) is persisted to localStorage
