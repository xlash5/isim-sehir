# İsim Şehir — v1.1 Admin Must Be Ready to Start

> **Priority:** Medium — addresses a known issue from v1.0
> **Version target:** v1.1
> **Status:** 🔴 Not implemented

## Overview

Currently the "Oyuna Başla" (Start Game) button becomes enabled when **all other players** are ready, but the admin themselves does not need to be ready. This is inconsistent. This spec requires the admin to also toggle "Hazır" before the game can start.

## Requirements

1. **Admin ready toggle:** the admin must click "Hazır" just like any other player.
2. **Start condition changed:** "Oyuna Başla" appears only when **all players including the admin** are ready.
3. **While admin is not ready:** the admin sees the same "Hazır" button as everyone else.
4. **Admin settings:** game settings panel remains editable until admin clicks "Hazır" (same as current behavior — settings are disabled when admin is ready).
5. **Unready:** if admin clicks "Hazır" again (toggling back to not ready), settings become editable again, and the start button is hidden.

## Technical Design

### Current Behavior

```ts
// Current: all players except admin must be ready
const allReady = players.every(p => p.id === adminId || p.isReady)
```

### New Behavior

```ts
// New: all players including admin must be ready
const allReady = players.every(p => p.isReady)
const canStart = allReady && isAdmin
```

### UI Changes

- The admin sees "Hazır" / "Hazır Değil" toggle like everyone else.
- Settings panel disabled when admin is ready (already implemented).
- "Oyuna Başla" button appears instead of "Hazır" when all players are ready (admin included).

### Message Flow

No new messages needed. The existing `player-ready` message already handles admin ready toggles:

```ts
// In handlePlayerReady (already exists):
// When admin toggles ready, broadcast to all peers
// All peers update their state
```

## Acceptance Criteria

- [ ] Admin must be "Hazır" for the game to start
- [ ] "Oyuna Başla" appears only when all players (including admin) are ready
- [ ] Settings panel locks when admin is ready, unlocks when admin un-readies
- [ ] All other existing ready logic remains unchanged
