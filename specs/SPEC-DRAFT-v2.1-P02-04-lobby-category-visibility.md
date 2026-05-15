# İsim Şehir — v2.1 Lobby: Real-Time Category Visibility

> **Priority:** Medium
> **Version target:** v2.1
> **Status:** 📝 Draft

## Overview

Currently only the admin sees which categories are selected in `GameSettingsPanel`. Other players see a read-only summary but no live list of the exact categories. This spec ensures every player in the lobby sees the current category selection in real-time.

## Requirements

1. **Read-only category chip display** for non-admin players — show the same chip list the admin sees in edit mode, but non-interactive.
2. **Instant sync** — when admin changes categories, every player's view updates immediately via the existing `settings-update` PeerJS message.
3. **No new message type** — reuse `settings-update` which already broadcasts the full `GameSettings` object.
4. **UI treatment:**
   - Admin in edit mode: unchanged (current behaviour).
   - Non-admin (or admin in read-only mode): show a `Box` with category `Chip` components, same density as the render-value in the admin dropdown.
   - Custom categories rendered with italic font style, same as admin view.
5. **Count badge** — "X categories selected" label above the chips.

## Files to Modify

- `src/components/Lobby/GameSettingsPanel.tsx` — Add read-only chip view for non-admin (or admin when not editing)

## Peer Message Flow

```
Admin saves → settings-update broadcast → PeerContext.handleMessage
                                           ↓
                                   store.updateSettings()
                                           ↓
                                  All lobby clients re-render
                                           ↓
                              GameSettingsPanel shows new chips
```

## Acceptance Criteria

- [ ] All players see the same category chips as the admin selected
- [ ] Changing categories instantly updates everyone's view
- [ ] Custom categories appear correct (italic) for all players
- [ ] Minimum-3-categories validation still works
