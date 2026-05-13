# İsim Şehir — v2.0 Major Improvements

> **Priority:** Low (post-v1.2)
> **Version target:** v2.0
> **Status:** 🔴 Not implemented

## Overview

Consolidates the larger, more disruptive improvements that require significant refactoring or architectural changes. These are deferred beyond v1.x to allow the core game to stabilise.

## 1. Mobile Responsive Improvements

### Problem

The current UI is built primarily for desktop. On mobile viewports ( < 768px ), elements overflow, buttons are too small, and the grading panel becomes unusable.

### Requirements

1. **Responsive layout** for all screens: Home, Lobby, Game (all phases), Grading, Scoreboard.
2. **Touch-friendly:** minimum tap target 44x44px, swipe gestures where appropriate.
3. **Bottom sheet** for the grading panel on mobile (instead of side-by-side columns).
4. **Collapsible sections** for category inputs on mobile.
5. **Full-width inputs** and stacked layout instead of grid.
6. **Virtual keyboard handling:** ensure input fields are visible when the mobile keyboard opens.
7. **Testing:** iPhone SE, iPhone 14, Pixel 7, Samsung Galaxy S21 viewports.

### Technical Approach

- Use MUI's `useMediaQuery` and `Grid2` responsive breakpoints.
- Add a `responsive.ts` utility with breakpoint constants.
- Refactor `GradingPanel.tsx` to use a bottom sheet (`SwipeableDrawer`) on mobile.
- Refactor `AnswerTable.tsx` to stack inputs vertically on small screens.
- Add `viewport` meta tag adjustments if needed.

---

## 2. Connection Loss Handling

### Problem

Network interruptions during a game cause silent data loss. Players may be in inconsistent states without realising it.

### Requirements

1. **Heartbeat / ping system:** every 10 seconds, peers exchange a ping-pong message to verify the connection is alive.
2. **Visual indicator:** a connection status icon in the top bar (green = connected, yellow = reconnecting, red = disconnected).
3. **Auto-reconnect:** on temporary network loss, attempt to reconnect for up to 30 seconds before declaring the player disconnected.
4. **Graceful degradation:** if connection is lost during answering, allow the player to continue filling inputs locally. Answers are submitted once the connection is restored.
5. **Re-sync on reconnect:** when a player reconnects, the admin sends a full state sync so they catch up on any missed transitions.

### New Message Types

| Message | Description | Sender |
|---|---|---|
| `ping` | Connection health check | Anyone |
| `pong` | Response to ping | Anyone |

### Technical Design

- Use `setInterval` in `PeerContext` to send `ping` every 10 seconds.
- Track `lastPongTimestamp` per connection. If no pong within 15 seconds, consider the connection stale.
- Show a `<Chip>` or `<Badge>` in the app bar: 🟢 Connected, 🟡 Reconnecting, 🔴 Disconnected.
- On reconnect, admin broadcasts `room-state-sync` to the reconnecting peer.

---

## 3. Admin Transfer (Enhanced)

### Problem

The v1.1 admin transfer (see `SPEC-v1.1-admin-transfer.md`) only handles the case where the admin disconnects. For v2.0, allow voluntary admin transfer.

### Requirements (Addition)

1. **Voluntary transfer:** the admin can click "Admini Devret" (Transfer Admin) next to any other player's name in the lobby.
2. **Confirmation:** a dialog: "Admin yetkisini [nickname]'e devretmek istediğine emin misin?" with [Evet] [Hayır].
3. **Notification:** all players see: "[oldAdmin] admin yetkisini [newAdmin]'e devretti."
4. **Restrictions:** cannot transfer during an active round (only in lobby or round-results / game-over phases).

### UI Changes

- Add a small "👑 Devret" button next to each non-admin player in the player list (admin-only, lobby/game-over phases).

---

## 4. Room Code Generation Improvement

### Problem

6-digit numeric codes are occasionally hard to read and type.

### Requirements

1. Switch to a **4-character alphanumeric** code (uppercase letters + digits, excluding confusable characters: 0/O, 1/I/L, 5/S).
2. Character set: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (30 chars).
3. Collision probability sufficiently low (~30^4 = 810,000 combinations).
4. Existing rooms using 6-digit codes remain valid during the transition (backward compatibility).

---

## 5. Performance Optimisations

### Requirements

1. **Memoisation:** wrap expensive components (`GradingPanel`, `AnswerTable`, `Scoreboard`) with `React.memo`.
2. **Virtualisation:** if > 20 categories are ever supported, virtualise the list.
3. **Bundle size:** analyse with `vite-plugin-visualizer`, consider lazy-loading routes.
4. **PeerJS connection limits:** monitor mesh performance at 8 players; consider a fallback to a star topology if mesh degrades.

## Acceptance Criteria (v2.0)

- [ ] All pages are fully usable on mobile viewports (320px — 768px)
- [ ] Connection status indicator is visible and accurate
- [ ] Temporary network interruptions do not cause data loss
- [ ] Auto-reconnect restores the player to the correct game state
- [ ] Voluntary admin transfer works with confirmation
- [ ] Room codes use the new alphanumeric format
- [ ] App performance is smooth with 8 players
- [ ] All existing v1.x features remain intact
