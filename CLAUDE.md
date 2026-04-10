# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

TroupeManager is an Aliens RPG campaign tool for tracking a squad of Colonial Marines across scenarios. It has two views: a **Roster** (editable marine table with status tracking and convalescence countdowns) and a **Timeline** (chronological scenario markers with casualties). No backend — state persists in localStorage.

The spec and all domain terminology are in French (see `documentation/spec-initiale.md`).

## Commands

```bash
pnpm dev          # Vite dev server
pnpm build        # TypeScript check + Vite production build
pnpm lint         # ESLint
pnpm exec vitest  # Run all tests
pnpm exec vitest run src/utils/dates.test.ts  # Run a single test file
```

## Stack

React 19, TypeScript 6, Vite 8, Tailwind CSS 4, Vitest 4. No routing library — tab navigation is local state in `App.tsx`.

## Architecture

**State management:** React Context + `useReducer` (`src/context/`). The `CampaignProvider` wraps the app, exposes `useCampaign()` which returns `{ state, dispatch }`. State is automatically saved/loaded from localStorage via `src/hooks/useLocalStorage.ts` (key: `troupe-manager-state`).

**Reducer actions:** `UPDATE_MARINE`, `ADVANCE_DAY`, `ADD_SCENARIO`, `HIGHLIGHT_MARINES`, `CLEAR_HIGHLIGHT`, `LOAD_STATE`. All defined as a discriminated union in `src/types/index.ts`.

**Domain model:** `Marine` (nom, grade, specialisation, conditionPhysique, etatPsychologique, convalescence dates) and `Scenario` (nom, date, morts[], blesses[]). When adding a scenario, `MarineUpdate[]` is dispatched alongside to batch-update marine states.

**Convalescence logic:** A marine's remaining days = `(dateDebutIndispo + dureeJours) - dateCourante`. The "Advance Day" button increments `dateCourante` and all countdowns recalculate reactively. Utilities in `src/utils/dates.ts` use UTC dates formatted as `"YYYY-MM-DD"`.

**Timeline ↔ Roster interaction:** Clicking a scenario marker dispatches `HIGHLIGHT_MARINES` with the IDs of marines involved, which highlights their rows in the roster.
