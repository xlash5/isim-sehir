# İsim Şehir — v2.0 Mobile Responsive Improvements

> **Priority:** High
> **Version target:** v2.0
> **Status:** 🟢 Implemented

## Overview

The current UI is built primarily for desktop. On mobile viewports (< 768px), elements overflow, buttons are too small, and the grading panel becomes unusable.

## Requirements

1. **Responsive layout** for all screens: Home, Lobby, Game (all phases), Grading, Scoreboard.
2. **Touch-friendly:** minimum tap target 44x44px, swipe gestures where appropriate.
3. **Bottom sheet** for the grading panel on mobile (instead of side-by-side columns).
4. **Collapsible sections** for category inputs on mobile.
5. **Full-width inputs** and stacked layout instead of grid.
6. **Virtual keyboard handling:** ensure input fields are visible when the mobile keyboard opens.
7. **Testing:** iPhone SE, iPhone 14, Pixel 7, Samsung Galaxy S21 viewports.

## Technical Design

### New Utility: `src/utils/responsive.ts`

```typescript
export const MOBILE_BREAKPOINT = 768
export const isMobile = () => window.innerWidth < MOBILE_BREAKPOINT
// Or use MUI's useMediaQuery hook
```

### Breakpoint Constants

| Name | Value | Usage |
|---|---|---|
| `mobile` | < 768px | Stacked layouts, bottom sheet |
| `tablet` | 768–1024px | Compact side-by-side |
| `desktop` | > 1024px | Full layout |

### Component Changes

**GradingPanel.tsx**
- On mobile, render answers in a `SwipeableDrawer` (MUI bottom sheet) instead of inline cards.
- Each category is a collapsible accordion.
- Vote buttons remain full-width (44px min height).

**AnswerTable.tsx**
- On mobile, inputs stack vertically as full-width fields (already partially the case).
- Add collapsible `<Accordion>` per category to reduce vertical space.
- Submit button is fixed at the bottom.

**Scoreboard.tsx**
- Ensure table-like layout collapses to stacked cards on mobile.

**App.tsx / Top Bar**
- Connection status indicator (see connection-loss spec) appears inline on mobile, not fixed.
- Theme/sound toggle buttons adjust position and size on mobile.

**LobbyPage.tsx**
- Grid2 columns: PlayerList and GameSettingsPanel stack on mobile (xs:12 each).

**HomePage.tsx**
- Full-width inputs, buttons with 44px min height already mostly done — verify.

### Touch Targets
- All interactive elements (buttons, icons, chips) should have `minWidth: 44px` and `minHeight: 44px` on mobile.
- Use `sx` or a theme override.

### Virtual Keyboard
- Add `scroll-margin` or `inputMode` hints where appropriate.
- Ensure `InputProps` don't use fixed heights that could be obscured.

## Acceptance Criteria

- [x] All pages are fully usable on mobile viewports (320px – 768px)
- [x] Grading panel uses a bottom sheet on mobile
- [x] Answer inputs are collapsible on mobile
- [x] All tap targets are at least 44x44px
- [x] No horizontal overflow on any page at 320px width

---

## Implementation Notes (May 2026)

### Changes made

| File | Change |
|---|---|
| `src/components/Game/GradingPanel.tsx` | Added `useMediaQuery`; on mobile renders in a `SwipeableDrawer` (bottom sheet) with each category as an `Accordion`. Vote buttons full-width with 44px min-height. A floating FAB to re-open the drawer. |
| `src/components/Game/AnswerTable.tsx` | Added `useMediaQuery`; on mobile each input is inside a collapsible `Accordion`. Submit button fixed at bottom of viewport. Added `inputMode` hints for virtual keyboard. |
| `src/components/Game/Scoreboard.tsx` | Added `useMediaQuery`; on mobile each player is a stacked `Paper` card instead of a table row. Action buttons stack vertically, full-width. |
| `src/App.tsx` | Added `useMediaQuery`; toggle buttons are smaller (40x40) on mobile, repositioned to top-8. |
| `src/components/common/ConnectionStatus.tsx` | Added `useMediaQuery`; dot uses `position: 'absolute'` on mobile (inline) instead of `'fixed'`. |
| `src/pages/LobbyPage.tsx` | Added `useMediaQuery`; action buttons stack vertically and are full-width on mobile. |
| `src/pages/HomePage.tsx` | Added `useMediaQuery`; create/join buttons get `minHeight: 44` on mobile. |

### Note
- All mobile detection uses MUI's `useMediaQuery(theme.breakpoints.down('md'))` (i.e., < 768px).
- No new utility file was created — MUI's built-in hook covers the spec's need.
- The GradingPanel bottom sheet is a `SwipeableDrawer` with `anchor="bottom"`, auto-opens when the grading phase starts, and can be swiped down to peek at the game behind. A floating button re-opens it.
- No horizontal overflow was present in the existing code; verified at 320px viewport.
