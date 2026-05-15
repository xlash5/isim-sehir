# İsim Şehir — v1.1 Admin Transfer on Disconnect

> **Priority:** High — addresses a known issue from v1.0
> **Version target:** v1.1
> **Status:** ✅ Implemented

## Overview

When the admin (room creator) disconnects or leaves the game, the longest-remaining player is promoted to admin. The new admin adopts the room code as their PeerJS ID (so the room stays discoverable), and all remaining players automatically reconnect to the new hub. The game continues without interruption.

## Requirements

1. ✅ **Automatic transfer** when the current admin disconnects (connection loss, tab close, manual leave).
2. ✅ **Eligibility:** the next admin is the player who has been in the room the **longest** (first joined after the admin).
3. ✅ **Notification:** all players receive a system message: *"[nickname] yeni admin oldu."* (or localised equivalent).
4. ✅ **UI update:** the new admin sees admin controls immediately (settings panel, start game, finalize grading, next round).
5. ✅ **Edge case — only one player remains:** if the admin disconnects and only one other player remains, that player becomes admin automatically.
6. ✅ **Edge case — admin disconnects during game:** transfer happens immediately; the new admin gains ability to finalize grading / advance rounds.

## Technical Design

### Detection Methods (Dual)

Admin disconnect is detected via two independent mechanisms:

1. **WebRTC close/error events** — fires promptly on manual leave (`disconnectAll`) or clean tab close. Both `close` and `error` are handled; a connection-identity guard (`activeConn !== conn`) prevents double-fire.
2. **Heartbeat monitor** — the admin broadcasts a heartbeat every 8s. Non-admin players check every 5s; 25s of silence triggers transfer. Handles browser-kill scenarios where WebRTC close events are never sent.

### Transfer Logic

```ts
function handleAdminDisconnect() {
  const store = gameStore.getState()
  const adminId = store.room.adminId
  const remaining = store.room.players.filter(p => p.id !== adminId)
  if (remaining.length === 0) { store.removePlayer(adminId); return }

  const newAdmin = remaining[0]  // longest-remaining player
  store.transferAdmin(newAdmin.id)
  store.removePlayer(adminId)
  adminPlayerIdRef.current = newAdmin.id

  if (newAdmin.id === store.localPlayerId) {
    // I'm the new admin — adopt the room code as peer ID
    peer?.destroy()
    createPeer(room.code)
  } else {
    // I'm a remaining player — reconnect to the room code (now the new admin)
    connectToPeer(room.code)
  }
}
```

### Reconnection After Transfer

Remaining players reconnect to the new admin via `connectToPeer(room.code)`. The flow:
1. Connection opens → joiner sends `join-room`
2. New admin receives → sends `room-state-sync` with full room state
3. Joiner's state is overwritten with authoritative admin state
4. Both peers now share a working connection

### Peer ID Adoption

The admin's PeerJS ID is always the room code. On transfer:
- The new admin destroys their old random peer and creates a new peer with `id = room.code`
- An `isAdoptingPeerRef` mutex prevents race conditions when both the close handler and heartbeat monitor attempt adoption simultaneously

### Message Types

| Message | Description | Sender |
|---|---|---|
| `heartbeat` | Admin liveness signal (every 8s) | Admin |
| `player-disconnected` | Notification that a player left | Admin (on joiner disconnect) |
| `admin-transfer` | Admin has been transferred | The player who detected the disconnect |
| `room-state-sync` | Full room state snapshot | Admin (on incoming connection / rejoin) |

### State Changes

Added to `useGameStore`:

```ts
transferAdmin: (newAdminId: string) => {
  set((state) => ({
    room: {
      ...state.room,
      adminId: newAdminId,
      players: state.room.players.map((p) => ({
        ...p,
        isAdmin: p.id === newAdminId,
      })),
    },
  }))
}
```

### Key Implementation Details

- **`adminPlayerIdRef`** — tracks the current admin's player ID; updated on every transfer to ensure subsequent detections (e.g., chain of disconnects) use the correct admin.
- **`lastHeartbeatAtRef`** — reset on `room-state-sync`, `heartbeat` messages, and at the start of every `handleOutgoingClose` to prevent the heartbeat monitor from racing with close events.
- **Connection identity guard** — `handleOutgoingClose` checks `activeConn !== conn` before processing; this prevents stale close handlers (from old connections) from triggering after a reconnection replaced the connection object in the map.
- **`player-ready` forwarding** — the admin forwards `player-ready` messages to all other connected players, ensuring ready state is synced across the hub-and-spoke topology.

## Acceptance Criteria

- [x] When admin disconnects, the longest-remaining player becomes admin
- [x] New admin sees admin controls (settings, start, finalize, next round)
- [x] All players are notified: "[nickname] yeni admin oldu."
- [x] Admin transfer works mid-game (during answering, grading, or results)
- [x] If only one player remains, they become admin
- [x] If all players disconnect, nothing breaks
