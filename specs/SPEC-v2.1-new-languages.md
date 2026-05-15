# İsim Şehir — v2.1 Multi-Language Expansion (ES, PT, FR, DE)

> **Priority:** High
> **Version target:** v2.1
> **Status:** 📝 Draft

## Overview

Add four new languages: **Spanish (es)**, **Portuguese (pt)**, **French (fr)**, **German (de)**. These follow the same key-value pattern as the existing `tr.ts` and `en.ts`.

## Requirements

1. **New locale files:** `src/locales/es.ts`, `pt.ts`, `fr.ts`, `de.ts`.
2. **Locale type union** widened: `type Locale = 'tr' | 'en' | 'es' | 'pt' | 'fr' | 'de'`.
3. **LOCALE_MAP** updated in `src/locales/index.tsx` to include all six.
4. **Flag SVGs** created for each new language (Spain, Portugal/Brazil, France, Germany).
5. **Category names** translated for each new locale (all 33 categories + custom category concepts).
6. **All UI keys** translated (home, lobby, settings, game, grading, scoreboard, chat, timer, common, errors, history, sound, admin, connection, system, player, restore).
7. **Default remains Turkish** — no change.
8. **Missing-key fallback** remains Turkish with dev warning.
9. **Translation completeness** — each new locale file must cover every key present in `tr.ts`.

## Files to Create / Modify

- **New:** `src/locales/es.ts`, `src/locales/pt.ts`, `src/locales/fr.ts`, `src/locales/de.ts`
- **Modify:** `src/locales/index.tsx` — widen `Locale` type, update `LOCALE_MAP`
- **Modify:** `src/components/common/LanguageSwitcher.tsx` — register new options (via SPEC 2.1 language-picker)

## Acceptance Criteria

- [ ] All four languages appear in the language picker
- [ ] Switching to any language updates all UI text immediately
- [ ] Category names are translated
- [ ] Missing keys fall back to Turkish gracefully
- [ ] Locale persistence works for all six values
