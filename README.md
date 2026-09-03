# FPL Report — Phases 1–4

Live Fantasy Premier League squad dashboard, a deterministic decision engine, an optional AI explanation layer, and persistent gameweek history.

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
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

### Supabase (Phase 4)

1. Create a Supabase project.
2. Run the SQL in `supabase/migrations/001_phase4_history.sql` in the Supabase SQL editor.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`.
4. Restart `npm run dev`.

The service role key is server-only. Never expose it to the browser or commit it.

AI calls run only on the server via `GET /api/report` after you click **Generate Report**. Each successful generation also stores a gameweek snapshot when Supabase is configured. Generation usually takes 30–60 seconds.

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
- `/gameweeks` — historical snapshots, evaluation, and metrics
- `/gameweeks/[gw]` — gameweek detail with stored recommendation and report

## Tests

```bash
npm test
npx tsc --noEmit
```

## Scope

Do not store FPL cookies, bearer tokens, or login credentials. Phase 4 adds Supabase history only — no authentication, automatic transfers, scheduled jobs, external news APIs, or machine learning.
