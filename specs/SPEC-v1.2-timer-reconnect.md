# İsim Şehir — v1.2 Timer Not Displaying After Reconnection

> **Priority:** Medium — visual bug, does not break gameplay
> **Version target:** v1.2
> **Status:** 🔴 Not implemented

## Overview

When a player refreshes the page during an active **answering** phase and reconnects, the countdown timer does not display. The timer resumes correctly from the next round onward.

## Root Cause

The timer in the Zustand store is a top-level field (`timer: number | null`), separate from the `room` object. It is initialized only in `GamePage.handleWheelComplete` via `store.setTimer(duration)` after the wheel animation completes.

When the player reconnects mid-game:

1. Admin sends `reconnect-accepted` with the `room` state (which includes `phase: 'answering'` but NOT the timer value).
2. `SessionRestore` applies the room state via `gameStore.setState({ room: ... })`.
3. The `timer` field remains `null` because it is never included in the sync payload.
4. The `useGame` hook's timer `useEffect` only starts when `room.phase === 'answering'` AND `room.settings.roundDuration !== null`, but it relies on the existing `timer` value being non-null to count down. Since timer is null, no countdown occurs.

## Affected Flow

1. Player is in answering phase with a running timer.
2. Player refreshes the page.
3. Reconnection succeeds, player is back in the answering phase.
4. Timer displays nothing (or 00:00) for the remainder of the round.
5. Next round starts correctly (wheel → answering → timer initialises).

## Proposed Fix

### Option A: Include timer in `reconnect-accepted` payload

Add the admin's current `timer` value to the `reconnect-accepted` message:

```ts
interface ReconnectAcceptedPayload {
  room: GameRoom
  timer: number | null
}
```

The reconnecting player applies it:

```ts
case 'reconnect-accepted': {
  const { room, timer } = msg.payload as { room: GameRoom; timer: number | null }
  gameStore.setState({ room, timer })
}
```

### Option B: Derive timer from settings on the reconnecting side

When the reconnecting player applies room state and sees `phase === 'answering'` with `timer === null`, derive the initial timer value from `room.settings.roundDuration`:

```ts
if (room.phase === 'answering' && !timer && room.settings.roundDuration) {
  setTimer(room.settings.roundDuration)
}
```

This is less accurate (resets to full duration) but simpler.

### Option C: Track round start timestamp

Include a `roundStartedAt` timestamp in the room state. On reconnect, calculate remaining time:

```ts
const elapsed = (Date.now() - room.roundStartedAt) / 1000
const remaining = Math.max(0, room.settings.roundDuration - elapsed)
setTimer(Math.ceil(remaining))
```

## Acceptance Criteria

- [ ] Refreshing during the answering phase reconnects and shows the correct remaining time
- [ ] Timer accuracy is within ±1 second of the actual remaining time
- [ ] No regression for non-reconnection flow
- [ ] Timer works correctly across multiple rounds after reconnection
