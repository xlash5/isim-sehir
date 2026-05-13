# İsim Şehir — v1.1 Admin Transfer on Disconnect

> **Priority:** High — addresses a known issue from v1.0
> **Version target:** v1.1
> **Status:** 🔴 Not implemented

## Overview

When the admin (room creator) disconnects or leaves the game, no player is promoted to admin. This leaves the room leaderless — no one can start the game, advance rounds, or finalize grading. This spec introduces automatic admin transfer to the next eligible player.

## Requirements

1. **Automatic transfer** when the current admin disconnects (connection loss, tab close, manual leave).
2. **Eligibility:** the next admin is the player who has been in the room the **longest** (first joined after the admin).
3. **Notification:** all players receive a system message: *"[nickname] yeni admin oldu."* (or localised equivalent).
4. **UI update:** the new admin sees admin controls immediately (settings panel, start game, finalize grading, next round).
5. **Edge case — only one player remains:** if the admin disconnects and only one other player remains, that player becomes admin automatically.
6. **Edge case — admin disconnects during game:** transfer happens immediately; the new admin gains ability to finalize grading / advance rounds.

## Technical Design

### Transfer Logic

```ts
function transferAdmin(removedPlayerId: string) {
  const state = useGameStore.getState()
  const remaining = state.players.filter(p => p.id !== removedPlayerId)
  if (remaining.length === 0) return // room empty

  // Pick the player who joined earliest (lowest index in the original array)
  const newAdmin = remaining[0]
  useGameStore.getState().setAdmin(newAdmin.id)
  broadcast('admin-transferred', { newAdminId: newAdmin.id })
}
```

### Message Type

Add a new message type: `admin-transferred`

| Message | Description | Sender |
|---|---|---|
| `admin-transferred` | Admin has been transferred to another player | The player who detected the disconnect |

### State Changes

Add to `useGameStore`:

```ts
setAdmin: (playerId: string) => {
  set((state) => ({
    adminId: playerId,
    players: state.players.map((p) => ({
      ...p,
      isAdmin: p.id === playerId,
    })),
  }))
}
```

### UI Changes

- The new admin's `PlayerAvatar` shows the admin crown (already supported).
- Snackbar notification: *"[nickname] yeni admin oldu."*
- Admin controls rendered conditionally based on `player.id === room.adminId` (already works; just needs state update).

## Acceptance Criteria

- [ ] When admin disconnects, the longest-remaining player becomes admin
- [ ] New admin sees admin controls (settings, start, finalize, next round)
- [ ] All players are notified: "[nickname] yeni admin oldu."
- [ ] Admin transfer works mid-game (during answering, grading, or results)
- [ ] If only one player remains, they become admin
- [ ] If all players disconnect, nothing breaks
