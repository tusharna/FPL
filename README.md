# FPL Report — Phases 1–6

Live Fantasy Premier League squad dashboard, a deterministic decision engine, an optional AI explanation layer, persistent gameweek history, and live intelligence monitoring.

## Setup

```bash
npm install
cp .env.example .env.local
```

`.env.local` (never commit this file):

```env
FPL_BOOTSTRAP_ENTRY_ID=3944035
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
FPL_ENTRY_ID=3944035
```

`FPL_BOOTSTRAP_ENTRY_ID` seeds `profiles.fpl_entry_id` for the first Google sign-in. `FPL_ENTRY_ID` is used by cron/background jobs only.

### Supabase + Google Sign-In

1. Create a Supabase project.
2. Run migrations in order from `supabase/migrations/` in the Supabase SQL editor.
3. In Supabase: **Authentication → Providers → Google** — enable Google and add your Google OAuth client ID/secret.
4. In Supabase: **Authentication → URL configuration** — set:
   - **Site URL**: your production app URL (e.g. `https://your-app.vercel.app`)
   - **Redirect URLs**:
     - `http://localhost:3000/auth/callback`
     - `https://your-app.vercel.app/auth/callback`
5. In [Google Cloud Console](https://console.cloud.google.com/):
   - Create an OAuth 2.0 **Web application** client.
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`
     - `https://your-app.vercel.app`
   - **Authorized redirect URIs** (Supabase callback — from Supabase Google provider settings):
     - `https://<project-ref>.supabase.co/auth/v1/callback`
6. Add to `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (browser-safe)
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
7. Restart `npm run dev`.

The service role key and Google client secret must stay server-side. Never expose them to the browser or commit them.

### Supabase data (Phase 4+)

Run the SQL migrations in `supabase/migrations/` (including `004_auth_profiles.sql` for Google auth and RLS).

AI calls run only on the server via `GET /api/report` after you click **Generate Report**. Each successful generation also stores a gameweek snapshot when Supabase is configured. Generation usually takes 30–60 seconds.

Restart `npm run dev` after changing `.env.local`.

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — unauthenticated users are redirected to `/login`.

After Google sign-in you land on `/squad`.

Sections:

- `/squad` — live picks, pitch, bench, and table
- `/analysis` — deterministic decision engine
- `/report` — AI gameweek report (Generate Report button)
- `/intelligence` — live availability, fixtures, prices, and news alerts
- `/gameweeks` — historical snapshots, evaluation, and metrics
- `/gameweeks/[gw]` — gameweek detail with stored recommendation and report

## Tests

```bash
npm test
npx tsc --noEmit
```

## Scope

Do not store FPL cookies, bearer tokens, or login credentials. Phase 5 adds live intelligence on top of FPL data — no automatic transfers, scheduled jobs, external news APIs beyond the pluggable provider abstraction, or machine learning.
