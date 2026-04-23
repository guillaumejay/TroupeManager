# TroupeManager

Campaign tool for the **Aliens RPG** (Free League). A GM tracks a squad of Colonial Marines across scenarios: physical and mental condition, convalescences, casualties and injuries.

No backend — everything lives in the browser's localStorage, with optional synchronization through a **GitHub Gist** to share campaign state with players in read-only mode.

## What it does

- **Live roster** — each marine has a character sheet (name, rank, specialty) and a health state (physical condition, mental state, ongoing convalescence).
- **Timeline** — each played scenario appears as a chronological marker with its dead and wounded. Clicking a scenario highlights the involved marines in the roster.
- **Auto convalescence** — enter `start date + duration` and the tool shows remaining days, recomputed every time the campaign date is advanced with `+1 day`.
- **Events log** — every modification (sheet, health, new marine, new scenario, day advance) is journaled in a human-readable history.
- **Export** — the roster can be copied as formatted text to the clipboard (session recap).

## Getting started

Requirements: Node 20+ and pnpm.

```bash
pnpm install
pnpm dev          # Vite dev server
pnpm build        # typecheck + production bundle
pnpm lint         # ESLint
pnpm exec vitest  # tests
```

## How it works

### Screens

- **Roster** — editable table. Each row has inline cell-by-cell editing *and* two modals: **Sheet** (card icon) for identity, **Health** (heart icon) for physical condition, mental state and convalescence. The Health modal pre-fills the convalescence start date with the current campaign date.
- **Timeline** — chronological strip of scenarios. A form adds a scenario with dead and wounded; involved marines are updated in a batch.
- **Events** — reverse-chronological log of modifications. Labels are pre-computed (e.g. *"Windtalker — Health updated: Physical condition OK → Serious wound, Indispo start — → 23 April 2026"*), with a color-coded dot per type.
- **Settings** — reset and Gist sharing configuration.

### Gist sharing

- **GM** — enters a GitHub Personal Access Token (scope `gist`) in Settings → a secret Gist is created and a `?gist=<id>` URL is generated.
- **Players** — open the shared URL → read-only access, polled every 30 s while the tab is focused.
- **Strategy** — last-write-wins. No merge; the GM is the only writer. The token is stored in plaintext in the GM's browser `localStorage`.

### Persistence

- `localStorage` (`troupe-manager-state`) is always used, no backend required.
- When a Gist is configured, state (marines, scenarios, current date, events) is pushed after a 2 s debounce. Transient UI fields (`highlightedMarineIds`) are excluded from persistence.

## Stack

React 19 · TypeScript 6 · Vite 8 · Tailwind CSS 4 · Vitest 4. No router — tab navigation is plain `useState` in `App.tsx`. Global state: Context + `useReducer`.

## Architecture at a glance

```
src/
  types/               Marine, Scenario, CampaignEvent, CampaignAction (discriminated union)
  data/initialState.ts Starting roster and scenarios
  context/             CampaignContext + campaignReducer (single source of mutations)
  hooks/               useLocalStorage (persistence), useGistSync (remote sync)
  services/gist.ts     fetch wrapper around the GitHub Gist API
  utils/               dates (UTC, FR formatting), events (label formatting), export (clipboard)
  components/
    roster/            RosterTable, RosterRow, EditSheetModal, EditHealthModal, AddMarineModal, InlineEdit, StatusBadge
    timeline/          TimelineView, ScenarioMarker, AddScenarioForm
    events/            EventsView
    settings/          SettingsView, GistSettings
```

Every action goes through the reducer, which emits events in the same place — this is what guarantees no modification escapes the history.

## Domain language

The original spec and domain terminology are in **French** (see `documentation/spec-initiale.md`). Code identifiers (types, fields, actions) are in English *except* when they mirror domain terms: `conditionPhysique`, `etatPsychologique`, `dateDebutIndispo`, `dureeJours`, `specialisation`. UI text is in French.

## Known limitations

- No merge conflict handling: if two GMs write concurrently, the last save wins.
- The GitHub token is stored in plaintext in `localStorage` — acceptable for a personal tool, not for a shared deployment.
- No deletion of marines or scenarios (only addition and edition).
- Event log is not prunable from the UI. For a long campaign it grows linearly.
