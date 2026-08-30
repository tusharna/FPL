# FPL Report — Phase 1

Live Fantasy Premier League squad dashboard for a single entry. Phase 1 connects to the public FPL API, maps player IDs, and displays the full 15-player squad.

## Setup

```bash
npm install
cp .env.example .env.local
```

`.env.local` (never commit this file):

```env
FPL_ENTRY_ID=3944035
```

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) or `/dashboard`.

## Tests

```bash
npm test
```

## Scope

This phase does **not** include AI, transfer recommendations, captain picks, or automation. Those belong in later phases.

The app only uses public FPL endpoints. Do not store FPL cookies, bearer tokens, or login credentials.
