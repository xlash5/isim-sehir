# İsim Şehir — v2.0 Admin Transfer (Voluntary)

> **Priority:** High
> **Version target:** v2.0
> **Status:** ✅ Implemented

## Overview

The v1.1 admin transfer only handles the case where the admin disconnects. For v2.0, allow the admin to voluntarily transfer admin privileges to another player.

## Requirements

1. **Voluntary transfer:** the admin can click "Admini Devret" (Transfer Admin) next to any other player's name in the lobby.
2. **Confirmation:** a dialog: "Admin yetkisini [nickname]'e devretmek istediğine emin misin?" with [Evet] [Hayır].
3. **Notification:** all players see: "[oldAdmin] admin yetkisini [newAdmin]'e devretti."
4. **Restrictions:** cannot transfer during an active round (only in lobby or round-results / game-over phases).

## New Message Types

| Message | Description | Sender |
|---|---|---|
| `admin-transfer-request` | Voluntary admin transfer | Admin → All |

## Types to Add (`src/types/index.ts`)

```typescript
export type PeerMessageType =
  | ...existing...
  | 'admin-transfer-request'
```

## UI Changes

- In `PlayerList.tsx`, add a small transfer button (👑 Devret) next to each non-admin player.
- Button is only visible when:
  - Current user is admin
  - Game phase is `lobby`, `round-results`, or `game-over`
- Click opens a confirmation dialog (`<Dialog>`).
- On confirm, broadcast `admin-transfer-request` with `{ newAdminId }`.
- On receiving `admin-transfer-request`, call `store.transferAdmin()` and show a system chat message.

## Acceptance Criteria

- [x] Admin sees a transfer button next to each non-admin player
- [x] Button is hidden during active game phases (wheel, answering, grading)
- [x] Confirmation dialog appears on click
- [x] On confirm, admin is transferred and all players are notified
- [x] Chat shows a system message about the transfer
