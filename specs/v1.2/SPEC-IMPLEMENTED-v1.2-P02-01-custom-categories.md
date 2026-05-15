# İsim Şehir — v1.2 Custom Categories

> **Priority:** Medium — enhancement feature
> **Version target:** v1.2
> **Status:** 🟢 Implemented

## Overview

Allow the admin (or any player before the game starts) to create custom categories beyond the built-in 33. Custom categories are local to the room and last only for the duration of that game session.

## Requirements

1. **Add custom category:** in the lobby settings panel, a text input field with an "Ekle" button to add a custom category name.
2. **Validation:** max 30 characters, must not be empty, must not duplicate an existing category (built-in or custom).
3. **Display:** custom categories appear in the category selection list alongside built-in ones, visually distinguished (e.g., italic or with a "✏️" icon).
4. **Remove:** each custom category has an "×" remove button (only before the game starts).
5. **Broadcast:** custom categories are broadcast to all players via `settings-update` message.
6. **Persistence:** custom categories exist only for the current room session. They are not saved between games.
7. **Limit:** max 5 custom categories per game session.

## Technical Design

### Data Structure Changes

Extend `GameSettings`:

```ts
interface GameSettings {
  categories: string[]       // selected category names (2-10) — includes custom
  totalRounds: number        // 1-15
  roundDuration: number|null
  letterPool: string[]
  customCategories: string[] // NEW: custom category names added by admin
}
```

Add a new field to `GameRoom`:

```ts
interface GameRoom {
  // ...existing fields...
  availableCustomCategories: string[]  // NEW: all custom categories created in this room
}
```

### UI Changes

In `GameSettingsPanel.tsx`:

1. Add a text input + "Ekle" button below the category checklist.
2. Display built-in categories as checkboxes (unchanged).
3. Display custom categories as checkboxes with an italic label and a trailing "×" icon.
4. Disable the input and remove buttons when admin is ready (as with other settings).

### Message Types

No new message types — reuse existing `settings-update` which already broadcasts the full `GameSettings` object.

### State Changes

Add to `useGameStore`:

```ts
addCustomCategory: (name: string) => { /* validate, add to availableCustomCategories, broadcast */ }
removeCustomCategory: (name: string) => { /* remove, broadcast */ }
```

## Acceptance Criteria

- [x] Admin can add a custom category via text input
- [x] Custom category appears in the selection list with a visual distinction
- [x] Custom category can be selected/deselected like built-in ones
- [x] Custom category can be removed by admin before game starts
- [x] Max 5 custom categories enforced
- [x] Duplicate names (against built-in or other custom) are rejected
- [x] All players see the custom categories in the answer phase
- [x] Custom categories are not persisted between sessions

## Implementation Notes

- `GameRoom.availableCustomCategories` was **not** added — `GameSettings.customCategories` on the room state serves the same purpose without maintaining two copies of the data.
- The store actions `addCustomCategory`/`removeCustomCategory` were implemented as local state in `GameSettingsPanel.tsx` rather than standalone Zustand actions, since the store has no access to `broadcastMessage`. The final `customCategories` array is broadcast as part of the existing `settings-update` message on Save.
- Visual distinction uses italic typography + `primary.light` color (no emoji, following project conventions).
