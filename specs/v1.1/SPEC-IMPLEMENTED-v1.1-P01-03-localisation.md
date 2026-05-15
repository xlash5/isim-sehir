# İsim Şehir — v1.1 Localisation (i18n)

> **Priority:** High — must ship as the first v1.1 feature
> **Version target:** v1.1
> **Status:** 🟢 Implemented

## Overview

Add internationalisation (i18n) support to the application. The app currently ships entirely in Turkish. This spec introduces a locale system so the UI can render in **Turkish** (default) or **English**, with a language switcher on the main menu.

## Requirements

### Functional

1. **Default language** must be Turkish (`tr`) — preserves backward compatibility for existing users.
2. **Language switcher** placed on the Home screen (`/`), visible before entering a room.
3. **Supported locales:** `tr` (Türkçe), `en` (English).
4. **Locale persistence:** chosen language saved to `localStorage` so it survives page refreshes.
5. **Runtime switching:** changing the locale instantly re-renders all UI text without a page reload.
6. **Scope of translation:** all user-facing strings — buttons, labels, placeholders, tooltips, game phase texts, error messages, category names, grading labels, scoreboard headings, chat prompts, settings labels.

### Non-Functional

- No runtime i18n library dependency if avoidable — prefer a lightweight key-value approach or a minimal custom solution.
- Translation files must be simple JSON objects, easy for contributors to extend.
- Type-safe translation keys (TypeScript) — a missing key should produce a compile-time error or at least a clear dev warning.

## Technical Design

### Translation File Structure

```
src/
└── locales/
    ├── index.ts          ← hook/provider exports
    ├── tr.ts             ← Turkish translations (default)
    └── en.ts             ← English translations
```

Each locale file exports a flat `Record<string, string>`:

```ts
// src/locales/tr.ts
const tr: Record<string, string> = {
  'home.title': 'İsim Şehir',
  'home.nickname': 'Rumuz',
  'home.createRoom': 'Oda Oluştur',
  'home.joinRoom': 'Odaya Katıl',
  'home.roomCode': 'Oda Kodu',
  'home.language': 'Dil',
  // ... all other keys
}
export default tr
```

### Locale Context / Hook

```ts
// src/locales/index.ts
type Locale = 'tr' | 'en'

function useLocale(): {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string   // translate function
}
```

- `useLocale()` reads the current locale from a React context.
- `t(key)` looks up the key in the active locale file, falling back to Turkish if the key is missing in the active locale.
- `setLocale(locale)` updates context + persists to `localStorage('locale')`.

### Provider

Wrap the app (in `App.tsx` or `main.tsx`) with `<LocaleProvider>`.

### Language Switcher Component

A new component: `LanguageSwitcher.tsx`

- Rendered on the HomePage, above or near the create/join buttons.
- **UI:** A toggle, segmented button, or dropdown with flags/abbreviations:
  - 🇹🇷 Türkçe
  - 🇬🇧 English
- On change: calls `setLocale(locale)` → instant re-render.

### Keys to Translate

All user-facing strings must be keyed. Here is the preliminary key catalogue:

| Area | Sample Keys |
|---|---|
| Home | `home.title`, `home.nickname`, `home.createRoom`, `home.joinRoom`, `home.roomCode`, `home.language`, `home.invalidCode`, `home.nicknameRequired` |
| Lobby | `lobby.players`, `lobby.roomCode`, `lobby.ready`, `lobby.notReady`, `lobby.startGame`, `lobby.waitingForPlayers`, `lobby.settings` |
| Settings | `settings.categories`, `settings.rounds`, `settings.duration`, `settings.letterPool`, `settings.unlimited` |
| Game | `game.wheel.spinning`, `game.wheel.letter`, `game.answering.submit`, `game.answering.submitted`, `game.answering.waiting`, `game.answering.placeholder` |
| Grading | `grading.valid`, `grading.invalid`, `grading.showResults`, `grading.waitingAdmin`, `grading.yourVote` |
| Scoreboard | `scoreboard.round`, `scoreboard.total`, `scoreboard.nextRound`, `scoreboard.gameOver`, `scoreboard.playAgain`, `scoreboard.backToLobby` |
| Chat | `chat.placeholder`, `chat.send` |
| Timer | `timer.remaining` |
| Common | `common.cancel`, `common.confirm`, `common.copy`, `common.copied` |
| Errors | `error.duplicateNickname`, `error.roomFull`, `error.connectionLost`, `error.invalidAnswer` |

### Category Names

Category names must also be localised:

```ts
// src/locales/tr.ts
'category.isim_erkek': 'İsim (Erkek)',
'category.isim_kadin': 'İsim (Kadın)',
// ...

// src/locales/en.ts
'category.isim_erkek': 'Name (Male)',
'category.isim_kadin': 'Name (Female)',
// ...
```

### Implementation Steps

1. Create `src/locales/` directory with `tr.ts`, `en.ts`, `index.ts`.
2. Write all Turkish keys (mirror existing hardcoded strings in the app).
3. Write English translations for every key.
4. Create `LocaleContext` and `LocaleProvider`.
5. Create `useLocale()` hook with `t()` function.
6. Create `LanguageSwitcher` component with segmented button.
7. Integrate provider in `App.tsx`.
8. Add `LanguageSwitcher` to `HomePage.tsx`.
9. Replace every hardcoded Turkish string in all components with `t('key')` calls.
10. Localise category names in `categories.ts` or via locale lookup.
11. Localise game phase strings, error messages, and any other dynamic text.
12. Test: switch language, verify all text changes instantly.
13. Test: refresh page, verify language preference persists.
14. Test: play a full game in English, then in Turkish.

### Files to Modify

- `src/main.tsx` or `src/App.tsx` — wrap with LocaleProvider
- `src/pages/HomePage.tsx` — add LanguageSwitcher
- `src/pages/LobbyPage.tsx` — use `t()`
- `src/pages/GamePage.tsx` — use `t()`
- `src/components/common/*.tsx` — use `t()`
- `src/components/Lobby/*.tsx` — use `t()`
- `src/components/Game/*.tsx` — use `t()`
- `src/utils/categories.ts` — localise category display names
- All other files containing hardcoded Turkish strings

### New Files to Create

- `src/locales/tr.ts`
- `src/locales/en.ts`
- `src/locales/index.ts`
- `src/components/common/LanguageSwitcher.tsx`

## Acceptance Criteria

- [x] App loads in Turkish by default
- [x] Language switcher visible on Home screen
- [x] Switching to English updates all UI text immediately
- [x] Switching back to Turkish restores Turkish text
- [x] Language preference survives page refresh (localStorage)
- [x] All user-facing strings are covered (no untranslated text in supported locales)
- [x] Category names are translated
- [x] Missing keys in the active locale fall back to Turkish gracefully
- [x] No runtime errors on language switch
