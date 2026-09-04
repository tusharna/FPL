# FPL Report — Project Documentation

## Overview

FPL Report is a Fantasy Premier League management application that combines live FPL data, a deterministic decision engine, optional AI explanations, historical tracking, live intelligence monitoring, and proactive notifications. The project is built in six phases:

| Phase | Focus |
|-------|--------|
| **Phase 1** | Live squad dashboard with real-time FPL data |
| **Phase 2** | Deterministic decision engine for lineup, captain, and transfer recommendations |
| **Phase 3** | AI explanation layer for gameweek reports (never overrides engine decisions) |
| **Phase 4** | Supabase persistence — gameweek snapshots, recommendations, reports, and evaluation |
| **Phase 5** | Live intelligence — availability, fixtures, prices, news, and recalculation triggers |
| **Phase 6** | Notifications, scheduled reports, deadline alerts, email/SMS delivery, and preferences |

**Core principle (Phase 6):** notify the manager only when a meaningful, deterministic change affects an FPL decision. AI explains alerts but never decides whether to send them.

## Tech Stack

### Core Framework
- **Next.js**: 16.3.3 (App Router)
- **React**: 19.2.8
- **TypeScript**: 5.x

### Styling & UI
- **TailwindCSS**: v4
- **Lucide React**: 1.39.0

### Data & Persistence
- **Supabase** (`@supabase/supabase-js`): Phase 4 history, Phase 5 intelligence events, Phase 6 notifications
- **Zod**: 4.5.4 (AI report validation)

### External Services
- **FPL API**: Live squad, bootstrap, fixtures, picks
- **OpenAI**: Optional gameweek report generation
- **Resend**: Optional email delivery (Phase 6)
- **Twilio**: Optional SMS delivery (Phase 6)

### Testing
- **Vitest**: 4.1.11

### Deployment
- **Vercel**: Hosting + cron schedules (`vercel.json`)

## Architecture

```text
FPL API
   ↓
Data Layer (lib/fpl/)
   ↓
Phase 2 Decision Engine (lib/analysis/)
   ↓
Phase 3 AI Report (lib/ai/) — optional, locked to engine output
   ↓
Phase 4 History (lib/history/) — Supabase snapshots
   ↓
Phase 5 Intelligence (lib/intelligence/) — live monitoring
   ↓
Phase 6 Notification Engine (lib/notifications/) — deterministic alerts only
   ↓
Scheduler (Vercel Cron) → Email / SMS providers
```

## Project Structure

```
FPL/
├── app/
│   ├── (app)/                    # Dashboard route group (DashboardShell)
│   │   ├── squad/                # Phase 1 — live squad
│   │   ├── analysis/             # Phase 2 — decision engine UI
│   │   ├── report/               # Phase 3 — AI report UI
│   │   ├── intelligence/         # Phase 5 — live alerts panel
│   │   ├── notifications/        # Phase 6 — notification history
│   │   └── settings/notifications/  # Phase 6 — preferences
│   ├── gameweeks/                # Phase 4 — history (standalone layout)
│   │   └── [gw]/                 # Gameweek detail
│   ├── api/
│   │   ├── report/               # Generate / load AI report
│   │   ├── history/              # History overview + per-GW detail
│   │   ├── intelligence/         # Intelligence bundle JSON
│   │   ├── notifications/        # List notifications, mark read
│   │   ├── notifications/preferences/  # GET/PUT preferences
│   │   └── cron/
│   │       ├── gameweek-report/  # Scheduled GW report + notification
│   │       ├── deadline-check/   # Deadline reminders
│   │       └── intelligence-check/  # State-change alerts
│   ├── dashboard/                # Legacy redirects
│   ├── layout.tsx
│   └── page.tsx                  # Redirects to /squad
├── components/
│   ├── DashboardShell.tsx, DashboardNav.tsx
│   ├── Squad.tsx, Analysis.tsx, Pitch.tsx, Bench.tsx, ...
│   ├── report/                   # GameweekReport, CaptainCard, TransferCard, ...
│   ├── intelligence/             # IntelligencePanel, AvailabilityAlerts, ...
│   ├── history/                  # GameweekTable, PerformanceMetrics, ...
│   ├── notifications/            # NotificationList, NotificationSettings, ...
│   ├── sections/                 # Section wrappers for dashboard pages
│   └── ui/                       # Badge, Panel, StatCard
├── lib/
│   ├── fpl/                      # FPL API client & normalization
│   ├── analysis/                 # Phase 2 decision engine
│   ├── ai/                       # Phase 3 AI layer
│   ├── history/                  # Phase 4 persistence & evaluation
│   ├── intelligence/             # Phase 5 live monitoring pipeline
│   ├── notifications/            # Phase 6 decision engine, dispatcher, cron runners
│   ├── providers/                # Email (Resend/console) & SMS (Twilio/console)
│   ├── db/                       # Supabase client & schema types
│   ├── cron/                     # Cron request authentication
│   ├── navigation.ts             # Dashboard nav config
│   └── format.ts
├── supabase/migrations/
│   ├── 001_phase4_history.sql
│   ├── 002_phase5_intelligence.sql
│   └── 003_phase6_notifications.sql
├── tests/                        # Vitest unit tests
├── vercel.json                   # Cron schedules
└── .env.example
```

## Key Modules

### 1. FPL Integration (`lib/fpl/`)

- **bootstrap.ts** — static FPL data (teams, players, events)
- **client.ts** — HTTP client; `getEntryId()` from `FPL_ENTRY_ID`
- **dashboard-data.ts** — central loader: squad + analysis + intelligence
- **entry.ts**, **picks.ts**, **fixtures.ts**, **gameweek.ts**
- **normalize.ts** — maps raw API data to app types

### 2. Analysis Engine (`lib/analysis/`)

Deterministic Phase 2 engine (`analyzeGameweek()` in `team.ts`):

1. Score all players (`player.ts`)
2. Select best XI (`lineup.ts`)
3. Order bench (`bench.ts`)
4. Select captaincy (`captain.ts`)
5. Compare lineups and recommend transfers (`transfers.ts`)
6. Assess risks (`risk.ts`)

**Engine version:** `2.0.0` (`config.ts`)

When Phase 5 intelligence triggers `shouldRecalculate`, the engine re-runs with `intelligenceById` adjustments — still fully deterministic.

### 3. AI Integration (`lib/ai/`)

- **report.ts** — `generateGameweekReport()` orchestration
- **provider.ts** — OpenAI provider abstraction
- **validate.ts** — `validateReport()` + `lockReportToEngine()` (AI cannot override engine)
- **fallback.ts** — deterministic report when AI unavailable

Triggered via `GET /api/report` (button on `/report` page). Persisted through Phase 4 when Supabase is configured.

### 4. History (`lib/history/`)

Phase 4 Supabase persistence:

| Function | Purpose |
|----------|---------|
| `persistGameweekReport()` | Upsert manager, GW, snapshots, recommendation, report |
| `loadHistoryOverview()` | List gameweeks with evaluations |
| `loadGameweekDetail()` | Full GW detail |
| `ingestActualResults()` | Post-deadline FPL live points |
| `evaluateRecommendation()` | Compare recommended vs actual captain/XI/transfer |
| `computeHistoryMetrics()` | Aggregate performance metrics |

**Important:** existing recommendations are never overwritten; only missing reports are saved.

### 5. Intelligence (`lib/intelligence/`)

Phase 5 pipeline (`runIntelligencePipeline()` in `pipeline.ts`):

1. Fixture change detection
2. Price signal detection
3. News from FPL player `news` field (`news/provider.ts`)
4. Conflict resolution (FPL-primary)
5. Availability signals
6. Decision impact calculation
7. Recalculation check — may re-run Phase 2 engine
8. Key alerts for UI and AI input
9. Persist to `intelligence_events`, `price_snapshots`, `fixture_changes`, `news_items`

### 6. Notifications (`lib/notifications/`)

Phase 6 deterministic notification system:

| Module | Role |
|--------|------|
| `rules.ts` | `evaluateNotifications()` — compares previous vs current state |
| `formatter.ts` | Message templates for each alert type |
| `dedupe.ts` | Deterministic `dedupeKey` generation |
| `preferences.ts` | User toggles, severity threshold, quiet hours |
| `dispatcher.ts` | Persist event + send via email/SMS |
| `runner.ts` | Cron job orchestration |
| `persist.ts` | Supabase CRUD for preferences, events, deliveries, state |

**Notification types:** `GAMEWEEK_REPORT`, `DEADLINE_REMINDER`, `CAPTAIN_CHANGE`, `CAPTAIN_RISK`, `LINEUP_CHANGE`, `TRANSFER_CHANGE`, `PLAYER_AVAILABILITY`, `FIXTURE_CHANGE`, `DOUBLE_GAMEWEEK`, `BLANK_GAMEWEEK`, `PRICE_CHANGE`, `SYSTEM_ERROR`

**Severity:** `INFO` | `IMPORTANT` | `URGENT`

### 7. Providers (`lib/providers/`)

- **email.ts** — `console` (dev logs), `resend` (production), `none`
- **sms.ts** — `console`, `twilio`, `none` (default off)

All provider credentials are server-side only.

### 8. Database (`lib/db/`)

- **client.ts** — `getSupabaseAdmin()`, `isDatabaseConfigured()`
- **schema.ts** — `TABLES` constant and row types for all Supabase tables

## Application Routes

### Dashboard pages (`app/(app)/`)

| Route | Phase | Description |
|-------|-------|-------------|
| `/squad` | 1 | Live picks, pitch, bench, manager stats |
| `/analysis` | 2 | Engine output: XI, captain, transfers, risks |
| `/report` | 3 | AI gameweek report (generate or load stored) |
| `/intelligence` | 5 | Availability, fixtures, prices, news, freshness |
| `/notifications` | 6 | Notification history, mark as read |
| `/settings/notifications` | 6 | Email/SMS toggles, alert types, quiet hours |
| `/gameweeks` | 4 | Historical overview and metrics |
| `/gameweeks/[gw]` | 4 | Gameweek detail with stored recommendation |

### API routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/report` | GET | Generate or load stored AI report (`?stored=true`) |
| `/api/history` | GET | History overview |
| `/api/history/[gw]` | GET, POST | GW detail; POST ingests actual results |
| `/api/intelligence` | GET | Intelligence bundle JSON |
| `/api/notifications` | GET, PATCH | List notifications; PATCH marks read |
| `/api/notifications/preferences` | GET, PUT | Load/save notification preferences |
| `/api/cron/gameweek-report` | GET | Scheduled report + notification (auth required) |
| `/api/cron/deadline-check` | GET | Deadline reminders (auth required) |
| `/api/cron/intelligence-check` | GET | State-change alerts (auth required) |

All API routes use `export const dynamic = "force-dynamic"`.

## Database (Supabase)

Run migrations in order in the Supabase SQL editor:

### `001_phase4_history.sql`
- `managers`, `gameweeks`, `players_snapshot`, `team_snapshots`
- `recommendations`, `recommendation_players`, `actual_results`, `reports`

### `002_phase5_intelligence.sql`
- `intelligence_events`, `price_snapshots`, `fixture_changes`, `news_items`

### `003_phase6_notifications.sql`
- `notification_preferences` — per-entry channel and alert toggles
- `notification_events` — stored alerts with unique `dedupe_key`
- `notification_deliveries` — per-channel delivery status (`SENT`, `FAILED`, `DELAYED`, etc.)
- `notification_state` — JSON snapshots for state comparison (`entry_id` + `gameweek_id`)

## Scheduled Jobs (Vercel Cron)

Defined in `vercel.json`. Schedules are **UTC**. Cron endpoints require `CRON_SECRET` (sent as `Authorization: Bearer <secret>` by Vercel).

| Job | Schedule | Purpose |
|-----|----------|---------|
| `/api/cron/gameweek-report` | `0 8 * * 5` (Fri 08:00) | Generate GW report, persist, email notification |
| `/api/cron/deadline-check` | `0 * * * *` (hourly) | ~24h and ~2h deadline reminders |
| `/api/cron/intelligence-check` | `*/30 * * * *` (every 30 min) | Captain/lineup/transfer/availability alerts |

**Local dev:** crons do not run automatically. Call endpoints manually with the Bearer token.

**Idempotency:** unique `dedupe_key` constraints prevent duplicate notifications on repeated cron runs.

**Finished gameweeks:** `gameweek-report` skips when `isFinished === true`.

## Notification Rules (Phase 6)

Alerts are created only from **deterministic state changes**:

| Trigger | Alert |
|---------|-------|
| Captain recommendation changes | `CAPTAIN_CHANGE` |
| Captain risk increases (same captain) | `CAPTAIN_RISK` |
| Recommended XI changes | `LINEUP_CHANGE` |
| Transfer changes SAVE → TRANSFER | `TRANSFER_CHANGE` |
| Squad-relevant availability drop | `PLAYER_AVAILABILITY` |
| Fixture change affecting squad | `FIXTURE_CHANGE` / `DOUBLE_GAMEWEEK` / `BLANK_GAMEWEEK` |
| Price change (optional, off by default) | `PRICE_CHANGE` |
| Scheduled cron | `GAMEWEEK_REPORT` |
| Near deadline | `DEADLINE_REMINDER` |

**No alert:** unchanged captain, SAVE → SAVE, unrelated player injuries, repeated identical conditions.

**Quiet hours:** non-urgent alerts are delayed (`DELAYED`); urgent alerts still send.

**Resend unavailable:** notification event is saved; delivery marked `FAILED` with error message; app continues normally. Failed deliveries are not auto-retried.

## Configuration

### Environment Variables (`.env.local`)

```env
# Required
FPL_ENTRY_ID=3944035

# Phase 3 — AI (optional; fallback if missing)
AI_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
AI_TIMEOUT_MS=60000

# Phase 4 — Supabase (required for history + notifications)
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Phase 5 — intelligence cache windows (optional, milliseconds)
# INTELLIGENCE_FPL_CACHE_MS=300000
# INTELLIGENCE_FIXTURE_CACHE_MS=600000
# INTELLIGENCE_NEWS_CACHE_MS=900000
# INTELLIGENCE_PRICE_CACHE_MS=1800000

# Phase 6 — notifications & cron
CRON_SECRET=                        # Required for cron endpoints
NOTIFICATION_EMAIL_PROVIDER=console # console | resend | none
NOTIFICATION_EMAIL_FROM=onboarding@resend.dev
NOTIFICATION_EMAIL_TO=
RESEND_API_KEY=
NOTIFICATION_SMS_PROVIDER=none      # none | twilio | console
NOTIFICATION_SMS_TO=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
```

Never commit `.env.local`. Copy from `.env.example` and fill in values.

### Setup

```bash
npm install
cp .env.example .env.local
# Edit .env.local
# Run Supabase migrations 001, 002, 003
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → redirects to `/squad`.

## Available Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Production server |
| `npm run lint` | ESLint |
| `npm test` | Vitest (all tests) |
| `npm run test:watch` | Vitest watch mode |
| `npx tsc --noEmit` | TypeScript check |

## Testing

| File | Coverage |
|------|----------|
| `analysis.test.ts` | Formations, lineup, captain, risk, bench |
| `transfers.test.ts` | Transfer engine |
| `squad.test.ts`, `normalize.test.ts` | FPL data normalization |
| `ai.test.ts`, `ai-provider.test.ts` | AI validation, fallback, provider errors |
| `history.test.ts`, `history-persistence.test.ts` | Evaluation and persistence shapes |
| `intelligence.test.ts` | Availability, news, fixtures, prices, recalculation |
| `notifications.test.ts` | Rules, dedupe, preferences, quiet hours, cron auth, delivery |

```bash
npm test
npx tsc --noEmit
```

## Key Features by Phase

### Phase 1 — Squad Dashboard
- Live FPL picks, formation, pitch view
- Captain, vice-captain, bank, rank, team value
- Upcoming fixtures per player

### Phase 2 — Decision Engine
Scoring based on fixture difficulty, form, expected points, xG/xA, minutes security, and availability risk. Outputs recommended XI, formation, captaincy, bench order, lineup changes, and transfer recommendation (`SAVE` or `TRANSFER`).

### Phase 3 — AI Reports
OpenAI generates narrative explanations. `lockReportToEngine()` ensures AI never overrides captain, XI, or transfer decisions. Deterministic fallback when AI is unavailable.

### Phase 4 — History
Snapshots squad, recommendations, and reports per gameweek. Post-deadline evaluation compares engine picks vs actual FPL results. Performance metrics across gameweeks.

### Phase 5 — Intelligence
Monitors FPL news, availability, fixture changes, and prices. Calculates decision impacts on captain, XI, bench, and transfers. May trigger engine recalculation when intelligence materially changes inputs.

### Phase 6 — Notifications
Proactive email/SMS alerts when meaningful deterministic changes occur. User preferences, severity thresholds, quiet hours, deduplication, delivery tracking, and notification history UI.

## Scope & Limitations

### In Scope
- Live FPL data fetching and display
- Deterministic lineup, captain, and transfer recommendations
- Optional AI explanations (server-side only)
- Supabase history and evaluation
- Live intelligence monitoring
- Scheduled cron jobs (on Vercel)
- Email (Resend) and optional SMS (Twilio)
- Notification preferences and history

### Out of Scope
- No user authentication (single manager via `FPL_ENTRY_ID`)
- No multiple FPL accounts
- No automatic transfers, captain changes, or lineup changes
- No machine learning
- No FPL cookie/token storage or login handling
- No WhatsApp automation
- No automatic retry of failed email deliveries (notification event is still saved)
- Cron jobs do not run automatically in local `npm run dev`

## TypeScript Configuration

- **Target**: ES2017
- **Strict mode**: enabled
- **Path alias**: `@/*` → project root

## Development Notes

- Next.js 16 has breaking changes — check `node_modules/next/dist/docs/` for current APIs
- App Router with server components where possible
- `getDashboardData()` is the central cached data loader for dashboard pages
- AI and provider credentials are server-side only
- Phase 6 cron auth: `lib/cron/auth.ts` validates `Authorization: Bearer`, `x-cron-secret`, or `?secret=` query param
- `AGENTS.md` / `CLAUDE.md` contain Next.js agent rules auto-generated by `next dev`

## Future Enhancements (Phase 7+)

Per project roadmap — not yet implemented:

- Advanced fixture prediction
- Price change prediction
- Advanced player form model
- Backtesting and recommendation learning
- Multiple teams / accounts
- Mobile PWA
- Failed delivery retry queue
- Push notifications
