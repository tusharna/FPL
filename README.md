# FPL Report — Phases 1–3

Live Fantasy Premier League squad dashboard, a deterministic decision engine, and an optional AI explanation layer.

## Setup

```bash
npm install
cp .env.example .env.local
```

`.env.local` (never commit this file):

```env
FPL_ENTRY_ID=3944035
AI_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
AI_TIMEOUT_MS=60000
```

AI calls run only on the server via `GET /api/report` after you click **Generate Report**. Generation usually takes 30–60 seconds. If the key is missing, invalid, or the request times out, the app shows a deterministic fallback. The engine still decides XI, captain, and transfers.

Restart `npm run dev` after changing `.env.local`.

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll land on `/squad`.

Sections:

- `/squad` — live picks, pitch, bench, and table
- `/analysis` — deterministic decision engine
- `/report` — AI gameweek report (Generate Report button)

## Tests

```bash
npm test
```

## Scope

Do not store FPL cookies, bearer tokens, or login credentials. Phase 3 does not add a database, authentication, automatic transfers, or external news APIs.
