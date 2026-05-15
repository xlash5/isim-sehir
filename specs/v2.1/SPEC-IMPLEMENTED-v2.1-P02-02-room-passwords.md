# İsim Şehir — v2.1 Room Passwords / Private Rooms

> **Priority:** Medium
> **Version target:** v2.1
> **Status:** ✅ Implemented

## Overview

Currently any player with a room code can join. Add an optional password that the admin sets when creating the room, required to join.

## Requirements

1. **Optional password field** on room creation — inline field: "Room Password (optional)".
2. **Password stored** in `GameRoom.settings.roomPassword` (add field to `GameSettings` type).
3. **Join flow** — if the room has a password set, the joining player enters the password before connecting. Password is sent with the `join-room` message.
4. **Password validation** — admin checks the provided password against stored value. If mismatch, a `join-rejected` PeerJS message is sent back with reason `"wrong-password"`.
5. **Password visibility** — password is never displayed in the UI after creation, not echoed in chat, shown as `********` in settings read-only view.
6. **Password changes** — admin can change/remove the password in settings (edit mode). Broadcast via `settings-update`.
7. **Password transmission** — sent over PeerJS data channel (already encrypted by WebRTC DTLS).

## Peer Messages to Add

| Message Type | Direction | Payload |
|---|---|---|
| `join-room` | Player→Admin | Add optional `password?: string` field |
| `join-rejected` | Admin→Player | `{ reason: 'wrong-password' \| 'room-full' \| 'duplicate-nickname' }` |

## Files Modified

- `src/types/index.ts` — add `roomPassword?: string` to `GameSettings`, add `join-rejected` to `PeerMessageType`, add `JoinRejectedPayload`, add `password` to `JoinRoomPayload`
- `src/utils/messageValidator.ts` — add `join-rejected` validator
- `src/pages/HomePage.tsx` — add password fields to create + join flows, delayed navigation for password joins, retry on rejection
- `src/context/PeerContext.tsx` — password check on `join-room`, send `join-rejected` on mismatch, receive and store rejection
- `src/components/Lobby/GameSettingsPanel.tsx` — admin edit/remove password option
- `src/stores/useGameStore.ts` — `joinRejectedReason` state, password-aware `createRoom`
- All 6 locale files — password-related translations

## Acceptance Criteria

- [x] Admin can set a password on room creation (or leave empty)
- [x] Players joining a password-protected room are prompted
- [x] Wrong password shows an error and prevents joining
- [x] Correct password lets the player in
- [x] Empty password rooms work as before (no prompt)
- [x] Admin can change/remove password in lobby settings
