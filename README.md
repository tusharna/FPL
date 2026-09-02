# FPL Report — Phase 1 + Phase 2

Live Fantasy Premier League squad dashboard plus a deterministic decision engine. Phase 1 maps the 15-player squad from the public FPL API. Phase 2 scores players, legal formations, captaincy, bench order, and SAVE vs TRANSFER.

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

This phase does **not** include AI, automatic transfers, a database, or authentication. Those belong in later phases.

The app only uses public FPL endpoints. Do not store FPL cookies, bearer tokens, or login credentials.
