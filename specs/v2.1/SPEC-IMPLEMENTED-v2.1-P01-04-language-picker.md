# İsim Şehir — v2.1 Language Picker: Autocomplete & Search

> **Priority:** High
> **Version target:** v2.1
> **Status:** ✅ Implemented (v2.1)

## Overview

The current `LanguageSwitcher` uses a `ToggleButtonGroup` which does not scale beyond 2–3 languages. Replace it with a searchable autocomplete dropdown so users can quickly find and switch languages when 6+ locales are available.

## Requirements

1. **Single component replacement** — `LanguageSwitcher` renders an MUI `Autocomplete` (or `Select` with search) instead of `ToggleButtonGroup`.
2. **Search/filter** — Typing in the field filters the language list by name (e.g. typing "en" shows "English").
3. **Flag + label** — Each option shows its flag SVG and language name in that language (e.g. "Español" for Spanish, "English" for English).
4. **Icon at the start** — A globe/translate icon precedes the selected value.
5. **Position** — Same location on HomePage (`/`), above create/join buttons.
6. **Same persistence** — Still writes to `localStorage('locale')`, same `useLocale()` contract.
7. **Mobile-friendly** — Full-width on small screens, reasonable min-width on desktop.

## Files to Modify

- `src/components/common/LanguageSwitcher.tsx` — Rewrite to use `Autocomplete` or `Select`

## Acceptance Criteria

- [ ] Autocomplete shows all available languages with flags
- [ ] Typing filters the list
- [ ] Selecting a language switches locale instantly
- [ ] Works on mobile without layout breakage
- [ ] Choice persists across refresh
