# İsim Şehir — v1.1 Player Disconnect Broadcast

> **Priority:** High — addresses a known issue from v1.0
> **Version target:** v1.1
> **Status:** 🔴 Not implemented

## Overview

Currently when a player loses connection or closes their tab, the remaining players receive no notification. The disconnected player simply vanishes from the player list. This spec adds automatic detection and broadcast of player disconnections.

## Requirements

1. **Detection:** When a PeerJS connection is closed (either by the remote peer or due to network error), detect it immediately.
2. **Broadcast:** The remaining admin (or any player who detects the disconnect) broadcasts a `player-disconnected` message to all peers.
3. **UI Feedback:** A snackbar/toast notification appears for all remaining players: *"OyuncuAdı ayrıldı."* (or localised equivalent).
4. **Player Removal:** The disconnected player is removed from the `players` array in the game state.
5. **Admin Transfer:** If the disconnected player was the admin, trigger admin transfer (see `SPEC-v1.1-admin-transfer.md`).
6. **In-Game Disconnect:** If a disconnect happens mid-game, the round continues without them. Their unanswered categories are treated as blank (score 0).

## Technical Design

### PeerJS Connection Events

In `PeerContext.tsx`, listen for the `close` event on each `DataConnection`:

```ts
conn.on('close', () => {
  handlePlayerDisconnected(peerId)
})
```

Additionally, listen for the `error` event as a fallback:

```ts
conn.on('error', (err) => {
  if (err.type === 'disconnected' || err.type === 'peer-unavailable') {
    handlePlayerDisconnected(peerId)
  }
})
```

### Message Flow

1. Player B disconnects (tab close, network loss, etc.).
2. Player A's PeerJS fires `conn.on('close')` for the connection to B.
3. Player A (if admin) calls `broadcast('player-disconnected', { playerId: B.id })`.
4. All players (including A) call `useGameStore.getState().removePlayer(B.id)`.
5. If B was admin, also call `transferAdmin()` logic.

### State Changes

Add to `useGameStore`:

```ts
removePlayer: (playerId: string) => {
  set((state) => ({
    players: state.players.filter((p) => p.id !== playerId),
    // If player had submitted answers, mark them as blank
    // If player had votes, remove their votes
  }))
}
```

### UI Notification

Show a `Snackbar` (already used in `CopyCode.tsx`) with a warning/error appearance whenever `player-disconnected` message is received.

### In-Game Handling

- If phase is `answering` and the disconnected player had not yet submitted, treat all their answers as blank.
- If phase is `grading` and they had cast votes, those votes are discarded.
- The game does **not** pause or abort due to a disconnect.

## Acceptance Criteria

- [ ] Closing a browser tab removes the player from all remaining peers' state
- [ ] A snackbar notification appears: "[nickname] ayrıldı."
- [ ] If the disconnected player was admin, admin transfer is triggered
- [ ] Disconnect mid-game does not break the game
- [ ] Missing answers from a disconnected player score 0
