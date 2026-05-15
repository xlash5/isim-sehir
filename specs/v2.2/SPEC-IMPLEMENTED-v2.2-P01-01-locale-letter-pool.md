# İsim Şehir — v2.2 Locale-Aware Letter Pool

> **Priority:** High
> **Version target:** v2.2
> **Status:** 📝 Draft

## Overview

The letter pool is currently hardcoded to Turkish letters (`TURKISH_LETTERS` in `src/utils/letters.ts`) regardless of the admin's locale. If a room is created with English locale, the wheel can still land on `Ç`, `İ`, `Ö`, `Ş`, `Ü` — letters that do not exist in English. Players have no clear indication of which alphabet is in use.

This spec makes the letter pool **locale-aware**: the default pool adapts to the admin's chosen language at room creation, and both the admin and all players see a human-readable label of the active alphabet.

## Requirements

1. **Locale-specific letter pools defined** — Each supported locale maps to a distinct alphabet suitable for word games in that language.
2. **Default pool determined by admin locale** — When `createRoom` is called, the admin's current locale dictates the initial `letterPool` in `GameSettings`.
3. **Admin can still override** — The "Selected Letters" mode remains available for manual customisation.
4. **Readable label shown to all** — The settings panel displays the alphabet name and letter count (e.g. "Turkish Alphabet — 28 letters") so everyone in the lobby knows the pool before the game starts.
5. **PeerJS broadcast preserves existing flow** — No new message types; the pool is part of the `settings-update` and `room-state-sync` payloads as it already is.

## Letter Pool Definitions

| Locale | Alphabet | Letters |
|---|---|---|
| `tr` | Turkish | A B C Ç D E F G H I İ J K L M N O Ö P R S Ş T U Ü V Y Z (28 — Ğ excluded) |
| `en` | English | A–Z (26) |
| `de` | German | A–Z + Ä Ö Ü (29 — ß excluded as no word starts with it) |
| `es` | Spanish | A–Z + Ñ (27) |
| `fr` | French | A–Z (26 — accented variants are not distinct letters in word games) |
| `pt` | Portuguese | A–Z (26 — same reasoning as French) |

## Files to Create / Modify

### `src/utils/letters.ts` — Add locale pool map + label helper

```typescript
export const LOCALE_LETTER_POOLS: Record<string, string[]> = {
  tr: TURKISH_LETTERS,
  en: [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'],
  de: [...'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ'],
  es: [...'ABCDEFGHIJKLMNOPQRSTUVWXYZÑ'],
  fr: [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'],
  pt: [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'],
}

export function getLetterPoolLabel(locale: string, pool: string[]): string
```

`getLetterPoolLabel` returns a locale-aware name (e.g. for `tr` → `"Türk Alfabesi (28 harf)"`, for `en` → `"English Alphabet (26 letters)"`).

### `src/stores/useGameStore.ts` — Accept locale in `createRoom`

Add a `locale?: string` parameter to `createRoom`. When provided, use `LOCALE_LETTER_POOLS[locale]` as the default `letterPool` instead of always falling back to `TURKISH_LETTERS`.

```typescript
createRoom: (code?: string, password?: string, locale?: string) => {
  // ...
  settings: {
    ...defaultSettings,
    letterPool: locale ? (LOCALE_LETTER_POOLS[locale] ?? TURKISH_LETTERS) : TURKISH_LETTERS,
    ...(password ? { roomPassword: password } : {}),
  },
  // ...
}
```

### `src/pages/HomePage.tsx` — Pass locale to `createRoom`

Read locale via `useLocale()` and pass it:

```typescript
store.createRoom(code, roomPassword, locale)
```

No other changes required — the letter pool is part of the existing `room-state-sync` and `settings-update` broadcasts.

### `src/components/Lobby/GameSettingsPanel.tsx` — Show locale-aware label

In the **read-only view** (lines 111–151), replace the generic `TURKISH_LETTERS` reference with a label derived from `getLetterPoolLabel`. Also display the locale name of the alphabet so it's clear:

```
Letter Pool: Turkish Alphabet (28 letters)
```

In the **edit view**, the "All Letters" mode should reflect the admin's current locale pool — i.e. if admin switches language to English, the pool adjusts to A–Z. The multi-select mode still lets them pick any subset of the active pool.

### `src/locales/{tr,en,de,fr,es,pt}.ts` — Add i18n keys

| Key | Purpose |
|---|---|
| `settings.letterPoolTurkish` | "Turkish Alphabet" |
| `settings.letterPoolEnglish` | "English Alphabet" |
| `settings.letterPoolGerman` | "German Alphabet" |
| `settings.letterPoolSpanish` | "Spanish Alphabet" |
| `settings.letterPoolFrench` | "French Alphabet" |
| `settings.letterPoolPortuguese` | "Portuguese Alphabet" |
| `settings.letterCount` | "{count} letters" for display |

## Acceptance Criteria

- [ ] Admin creates room with Turkish locale → letter pool is 28 Turkish letters → lobby shows "Turkish Alphabet (28 letters)"
- [ ] Admin creates room with English locale → letter pool is A–Z (26 letters) → lobby shows "English Alphabet (26 letters)"
- [ ] Same for German, Spanish, French, Portuguese locales
- [ ] Admin can still switch to "Selected Letters" mode and override with a custom subset
- [ ] All players in the lobby see the correct letter pool label in real time
- [ ] No new PeerJS message types; existing `settings-update` and `room-state-sync` carry the pool
- [ ] Gameplay functions correctly — `getRandomLetter` draws from the correct pool
- [ ] No regressions in the Turkish-default path
