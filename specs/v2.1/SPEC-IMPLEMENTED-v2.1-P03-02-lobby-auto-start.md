# İsim Şehir — v2.1 Lobby Auto-Start Countdown

> **Priority:** Low
> **Version target:** v2.1
> **Status:** ✅ Implemented

## Overview

When all players in the lobby are ready and minimum player count is met, start a 10-second countdown. If any player un-readies (or a new player joins) during the countdown, it cancels. This adds a snappy "all ready → go" feel.

## Requirements

1. **Countdown trigger** — when `every player is ready && players.length >= 2 && categories >= 3`, start a 10-second countdown.
2. **Countdown display** — a large animated number / ring on the lobby page, replacing the ready/start buttons area.
3. **Cancel conditions:**
   - Any player toggles ready → `false`
   - A new player joins
   - Admin opens settings edit mode
4. **Auto-start** — when countdown reaches 0, the game starts automatically (same as admin clicking "Start Game").
5. **Admin override** — admin can still click "Start Game" immediately, bypassing the countdown.
6. **New PeerJS message** — `countdown-sync` broadcast by admin every second: `{ remaining: number }`. Peers display the countdown locally.
7. **Admin is the source of truth** — only admin's `setInterval` tracks the countdown; others just render the broadcast value.

## Peer Messages to Add

| Message Type | Direction | Payload |
|---|---|---|
| `countdown-sync` | Admin→All | `{ remaining: number }` |
| `countdown-cancel` | Admin→All | `{}` |

## Files to Modify

- `src/types/index.ts` — add `countdown-sync`, `countdown-cancel` to `PeerMessageType`
- `src/pages/LobbyPage.tsx` — countdown UI, trigger logic
- `src/context/PeerContext.tsx` — handle `countdown-sync` and `countdown-cancel`
- `src/stores/useGameStore.ts` — add `countdown: number | null` field and actions

## Acceptance Criteria

- [x] Countdown starts when all players ready + min players + categories set
- [x] Countdown displayed clearly to all players (synced within ~1s)
- [x] Countdown cancels when any player un-readies, new player joins, or admin edits settings
- [x] Admin can start immediately without countdown
- [x] Game auto-starts at 0
