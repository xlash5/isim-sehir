# İsim Şehir — v2.1 Room Passwords / Private Rooms

> **Priority:** Medium
> **Version target:** v2.1
> **Status:** 📝 Draft

## Overview

Currently any player with a room code can join. Add an optional password that the admin sets when creating the room, required to join.

## Requirements

1. **Optional password field** on room creation — after clicking "Create Room", show a dialog or inline field: "Room Password (optional)".
2. **Password stored** in `GameRoom.settings.roomPassword` (add field to `GameSettings` type).
3. **Join flow** — if the room has a password set, the joining player sees a password prompt before the connection proceeds.
4. **Password validation** — admin checks the provided password against stored value. If mismatch, a `join-rejected` PeerJS message is sent back with reason `"wrong-password"`.
5. **Password visibility** — password is never displayed in the UI after creation, not echoed in chat, not shown in settings read-only view.
6. **Password changes** — admin can change/remove the password in settings (edit mode). Broadcast via `settings-update`.
7. **Password transmission** — sent over PeerJS data channel (already encrypted by WebRTC DTLS).

## Peer Messages to Add

| Message Type | Direction | Payload |
|---|---|---|
| `join-room` | Player→Admin | Add optional `password?: string` field |
| `join-rejected` | Admin→Player | `{ reason: 'wrong-password' \| 'room-full' \| 'duplicate-nickname' }` |

## Files to Modify

- `src/types/index.ts` — add `roomPassword?: string` to `GameSettings`, add `join-rejected` to `PeerMessageType`
- `src/pages/HomePage.tsx` — add password field to create flow, password prompt on join
- `src/context/PeerContext.tsx` — handle password check on `join-room`, send `join-rejected`
- `src/components/Lobby/GameSettingsPanel.tsx` — admin edit password option
- `src/stores/useGameStore.ts` — handle join rejection

## Acceptance Criteria

- [ ] Admin can set a password on room creation (or leave empty)
- [ ] Players joining a password-protected room are prompted
- [ ] Wrong password shows an error and prevents joining
- [ ] Correct password lets the player in
- [ ] Empty password rooms work as before (no prompt)
- [ ] Admin can change/remove password in lobby settings
