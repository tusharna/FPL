# FPL Report — Application Implementation Guide

> **Last updated:** September 2026  
> **Version:** 0.1.0  
> **Status:** Phases 1–6 complete, Google Sign-In auth layer added

This document describes everything implemented in the FPL Report application to date. It is the authoritative reference for architecture, features, data flow, and configuration.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Tech Stack](#2-tech-stack)
3. [Architecture & Data Flow](#3-architecture--data-flow)
4. [Project Structure](#4-project-structure)
5. [Authentication](#5-authentication)
6. [Phase 1 — Squad Dashboard](#6-phase-1--squad-dashboard)
7. [Phase 2 — Decision Engine](#7-phase-2--decision-engine)
8. [Phase 3 — AI Reports](#8-phase-3--ai-reports)
9. [Phase 4 — History & Persistence](#9-phase-4--history--persistence)
10. [Phase 5 — Live Intelligence](#10-phase-5--live-intelligence)
11. [Phase 6 — Notifications](#11-phase-6--notifications)
12. [FPL API Integration](#12-fpl-api-integration)
13. [Database Schema](#13-database-schema)
14. [API Reference](#14-api-reference)
15. [Pages & UI Components](#15-pages--ui-components)
16. [Scheduled Jobs (Cron)](#16-scheduled-jobs-cron)
17. [Configuration & Environment](#17-configuration--environment)
18. [Testing & CI/CD](#18-testing--cicd)
19. [Deployment](#19-deployment)
20. [Scope & Limitations](#20-scope--limitations)
21. [Development History](#21-development-history)

---

## 1. Executive Summary

**FPL Report** (branded **FPL Assistant** in the login UI) is a Fantasy Premier League management assistant. It helps managers make better decisions by combining:

- **Live FPL data** — squad, fixtures, prices, availability
- **Deterministic decision engine** — recommended XI, captain, transfers, risk assessment
- **Optional AI explanations** — narrative gameweek reports that never override engine decisions
- **Historical tracking** — gameweek snapshots, post-deadline evaluation, performance metrics
- **Live intelligence** — availability, fixture changes, price signals, news monitoring
- **Proactive notifications** — email/SMS alerts on meaningful state changes
- **Google Sign-In** — per-user authentication with Supabase, linking each account to one FPL entry

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Engine decides** | All lineup, captain, and transfer recommendations come from the deterministic engine (v2.0.0) |
| **AI explains** | AI generates narrative reports but is locked to engine output via `lockReportToEngine()` |
| **Notify on change** | Alerts fire only when deterministic state meaningfully changes — not on repeated identical conditions |
| **No FPL credentials** | Uses only public FPL API endpoints; no cookies, tokens, or login handling |

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js (App Router) | 16.3.3 |
| UI | React | 19.2.8 |
| Styling | Tailwind CSS | v4 |
| Icons | Lucide React | 1.39.0 |
| Language | TypeScript (strict) | 5.x |
| Database | Supabase (PostgreSQL) | — |
| Auth | Supabase Auth + @supabase/ssr | Google OAuth |
| Validation | Zod | 4.5.4 |
| AI | OpenAI API (optional) | gpt-4o-mini default |
| Email | Resend or console provider | — |
| SMS | Twilio or console provider | default off |
| Testing | Vitest | 4.1.11 |
| CI/CD | GitHub Actions | Node 22 |
| Deployment | Vercel | hosting + cron |

**Note:** There is no Prisma ORM. Schema is managed via SQL migrations in `supabase/migrations/`.

---

## 3. Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        User (Browser)                           │
│   /squad  /analysis  /report  /intelligence  /notifications    │
└────────────────────────────┬────────────────────────────────────┘
                             │ Supabase session (Google OAuth)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js App Router                          │
│  middleware.ts → auth gate → DashboardShell → section pages     │
└────────────────────────────┬────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────────┐    ┌──────────────┐
│  lib/fpl/   │    │  lib/analysis/  │    │  lib/ai/     │
│  FPL client │───▶│  Engine v2.0.0  │───▶│  AI reports  │
│  normalize  │    │  lineup/captain │    │  (optional)  │
└──────┬──────┘    └────────┬────────┘    └──────┬───────┘
       │                    │                     │
       │           ┌────────▼────────┐            │
       │           │ lib/intelligence│            │
       │           │ live monitoring │            │
       │           └────────┬────────┘            │
       │                    │                     │
       └────────────────────┼─────────────────────┘
                            ▼
              ┌─────────────────────────┐
              │     lib/history/        │
              │  Supabase persistence   │
              └────────────┬────────────┘
                           ▼
              ┌─────────────────────────┐
              │  lib/notifications/     │
              │  rules → dispatch →     │
              │  email/SMS providers    │
              └─────────────────────────┘
                           ▲
              ┌────────────┴────────────┐
              │   Vercel Cron Jobs      │
              │  gameweek-report        │
              │  daily-check            │
              └─────────────────────────┘
```

### Central Data Loader

`lib/fpl/dashboard-data.ts` is the single entry point for dashboard pages:

1. Fetch FPL bootstrap static data + fixtures
2. Detect current/relevant gameweek
3. Fetch manager entry + picks for that gameweek
4. Normalize players, map picks to squad, attach fixtures
5. Run `analyzeGameweek()` (Phase 2 engine)
6. Run `runIntelligencePipeline()` (Phase 5)
7. Re-run engine if `intelligence.shouldRecalculate` is true

The loader is wrapped in React `cache()` and resolves the FPL entry ID from the authenticated user's profile.

---

## 4. Project Structure

```
FPL/
├── app/                              # Next.js App Router
│   ├── (app)/                        # Authenticated dashboard route group
│   │   ├── squad/                    # Phase 1
│   │   ├── analysis/                 # Phase 2
│   │   ├── report/                   # Phase 3
│   │   ├── intelligence/             # Phase 5
│   │   ├── notifications/            # Phase 6
│   │   ├── settings/notifications/   # Phase 6 preferences
│   │   ├── gameweeks/                # Phase 4 overview
│   │   │   └── [gw]/                 # Phase 4 detail
│   │   └── layout.tsx                # DashboardShell wrapper
│   ├── api/                          # REST API routes
│   │   ├── report/
│   │   ├── history/ + [gw]/
│   │   ├── intelligence/
│   │   ├── notifications/ + preferences/
│   │   └── cron/                     # Scheduled job endpoints
│   ├── auth/callback/                # OAuth code exchange
│   ├── login/                        # Google sign-in page
│   ├── dashboard/                    # Legacy redirects → /squad
│   ├── layout.tsx                    # Root layout (Geist fonts)
│   └── page.tsx                      # Redirects to /squad
├── components/
│   ├── auth/                         # GoogleSignInButton, UserMenu
│   ├── sections/                     # Page-level section wrappers
│   ├── report/                       # AI report UI
│   ├── intelligence/                 # Alerts panel
│   ├── history/                      # Gameweek history UI
│   ├── notifications/              # Notification list & settings
│   ├── ui/                           # Badge, Panel, StatCard
│   └── Squad, Pitch, Bench, etc.     # Core FPL visualizations
├── lib/
│   ├── fpl/                          # FPL API client & normalization
│   ├── analysis/                     # Decision engine
│   ├── ai/                           # AI report generation
│   ├── history/                      # Persistence & evaluation
│   ├── intelligence/               # Live monitoring pipeline
│   ├── notifications/              # Alert rules, dispatch, cron runners
│   ├── auth/                         # Supabase auth (middleware, user, API guard)
│   ├── providers/                    # Email (Resend/console) & SMS (Twilio)
│   ├── db/                           # Supabase admin client & schema types
│   ├── cron/                         # Cron request authentication
│   ├── format.ts                     # Price, rank, deadline formatting (IST)
│   └── navigation.ts                 # Dashboard nav config
├── supabase/migrations/              # 5 SQL migration files
├── tests/                            # 13 Vitest test files
├── explain/                          # Internal documentation
├── .github/workflows/ci.yml
├── middleware.ts                     # Auth session gatekeeper
├── vercel.json                       # Cron schedules
└── .env.example
```

---

## 5. Authentication

Authentication was added after Phase 6. It uses **Supabase Auth** with **Google OAuth** and is mandatory for all dashboard and user API routes.

### Auth Flow

```
User visits protected route
        │
        ▼
middleware.ts → updateSession()
        │
        ├─ No session → redirect to /login?next=<path>
        │
        └─ Valid session → continue
                │
                ▼
        /login → GoogleSignInButton
                │
                ▼
        Google OAuth → Supabase callback
                │
                ▼
        /auth/callback → exchangeCodeForSession
                │
                ▼
        ensureUserProfile() → profiles row
                │
                ▼
        Seed fpl_entry_id from FPL_BOOTSTRAP_ENTRY_ID (first sign-in)
                │
                ▼
        Redirect to next path (default /squad)
```

### Route Protection

| Path pattern | Access |
|--------------|--------|
| `/login` | Public |
| `/auth/*` | Public |
| `/api/cron/*` | Public (requires `CRON_SECRET`) |
| All other routes | Requires valid Supabase session |
| User API routes | 401 if unauthenticated |

### Key Auth Modules

| File | Role |
|------|------|
| `middleware.ts` | Entry point; delegates to `lib/auth/middleware.ts` |
| `lib/auth/middleware.ts` | Session refresh, route protection, OAuth code forwarding |
| `lib/auth/server.ts` | Server-side Supabase client |
| `lib/auth/client.ts` | Browser Supabase client |
| `lib/auth/user.ts` | `getAuthenticatedUser()`, `getAuthenticatedFplEntryId()`, profile bootstrap |
| `lib/auth/api.ts` | `requireApiAuth()` for API route guards |
| `lib/auth/config.ts` | `isAuthConfigured()` env var checks |
| `components/auth/GoogleSignInButton.tsx` | Google sign-in button |
| `components/auth/UserMenu.tsx` | Sign-out in dashboard header |

### Multi-User Model

- Each Google account maps to one `profiles.fpl_entry_id`
- User-facing code resolves entry ID from the authenticated profile
- Cron/background jobs use `FPL_ENTRY_ID` env var (single entry for scheduled tasks)
- Row-Level Security (RLS) in Supabase scopes user data by `fpl_entry_id`

For detailed OAuth setup steps, see `explain/google-sign-in-workflow.md`.

---

## 6. Phase 1 — Squad Dashboard

**Route:** `/squad`

### Features

- Live FPL picks mapped to a visual pitch formation
- Player kit shirts positioned on the pitch layout
- Bench players displayed below the pitch
- Captain and vice-captain badges
- Manager stats: bank, team value, overall rank, gameweek points
- Upcoming fixtures per player
- Glass-panel UI design system

### Key Components

| Component | Purpose |
|-----------|---------|
| `SquadSection` | Page wrapper |
| `Squad` | Squad overview container |
| `Pitch` | Visual pitch with player positions |
| `Bench` | Bench player list |
| `PlayerCard` | Individual player card with stats |
| `Fixture` | Upcoming fixture display |
| `CaptainCard` | Captain highlight in squad view |

### Data Source

All data comes from the FPL public API via `getDashboardData()` — bootstrap static, entry details, and picks for the current/relevant gameweek.

---

## 7. Phase 2 — Decision Engine

**Route:** `/analysis`  
**Engine version:** `2.0.0` (`lib/analysis/config.ts`)

### Pipeline

The engine runs `analyzeGameweek()` in `lib/analysis/team.ts`:

```
1. Score all players          → player.ts
2. Select best XI             → lineup.ts (legal formation constraints)
3. Order bench                → bench.ts
4. Select captaincy           → captain.ts
5. Compare lineups & transfers → transfers.ts
6. Assess risks per player    → risk.ts
```

### Scoring Weights

**Player score** (for XI selection):

| Factor | Weight |
|--------|--------|
| Expected points | 0.30 |
| Fixture quality | 0.20 |
| Minutes security | 0.16 |
| Form | 0.12 |
| Attacking potential (xG/xA) | 0.12 |
| Availability | 0.10 |

**Captain score** uses a separate weight set emphasizing expected goals, assists, and fixture difficulty.

**Transfer score** includes value and medium-term fixture horizon (5 gameweeks).

### Outputs

| Output | Description |
|--------|-------------|
| Recommended XI | Best 11 players respecting formation rules |
| Formation | e.g. 3-4-3, 4-4-2 |
| Captain / Vice-captain | Highest-scoring captaincy pair |
| Bench order | Optimal bench priority |
| Transfer recommendation | `SAVE` or `TRANSFER` with in/out players |
| Risk assessment | Per-player risk level (LOW / MEDIUM / HIGH) |

### Configuration Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| `MINIMUM_TRANSFER_GAIN` | 0.12 | Minimum expected gain to recommend a transfer |
| `MAX_PLAYERS_PER_CLUB` | 3 | FPL squad rule enforcement |
| `FIXTURE_HORIZON` | 3 | Gameweeks for short-term fixture scoring |
| `MEDIUM_TERM_HORIZON` | 5 | Gameweeks for transfer fixture scoring |

### Intelligence Recalculation

When Phase 5 intelligence detects material changes (availability drops, fixture changes), it sets `shouldRecalculate = true`. The engine re-runs with `intelligenceById` adjustments — still fully deterministic.

---

## 8. Phase 3 — AI Reports

**Route:** `/report`  
**API:** `GET /api/report`

### How It Works

1. User clicks **Generate Report** on `/report`
2. Server calls `generateGameweekReport()` in `lib/ai/report.ts`
3. Engine output is passed as locked input to the AI provider
4. `lockReportToEngine()` ensures AI cannot override captain, XI, or transfer decisions
5. `validateReport()` validates the response against a Zod schema
6. On success, report is persisted to Supabase (Phase 4)
7. Optional email notification is sent (Phase 6)

### AI Provider

- **Primary:** OpenAI (`lib/ai/provider.ts`) — configurable model via `OPENAI_MODEL`
- **Fallback:** Deterministic report (`lib/ai/fallback.ts`) when `OPENAI_API_KEY` is missing
- **Timeout:** Configurable via `AI_TIMEOUT_MS` (default 60 seconds)
- **Generation time:** Typically 30–60 seconds

### Report Sections

| Section | Content |
|---------|---------|
| Executive Summary | High-level gameweek overview |
| Captain Analysis | Why this captain was chosen |
| Recommended XI | Starting lineup with rationale |
| Transfer Recommendation | SAVE or TRANSFER with reasoning |
| Risk Assessment | Key risks in the squad |
| Key Alerts | Intelligence-driven warnings |

### Safety Guarantees

- AI runs server-side only — never in the browser
- `lockReportToEngine()` overwrites any AI captain/XI/transfer suggestions with engine values
- Invalid AI responses fall back to deterministic report
- `?stored=true` query param loads cached report without regenerating

---

## 9. Phase 4 — History & Persistence

**Routes:** `/gameweeks`, `/gameweeks/[gw]`  
**API:** `GET /api/history`, `GET|POST /api/history/[gw]`

### What Gets Stored

| Data | Table | When |
|------|-------|------|
| Manager metadata | `managers` | First report generation |
| Gameweek metadata | `gameweeks` | First report generation |
| Player stats snapshot | `players_snapshot` | Each report generation |
| Squad picks | `team_snapshots` | Each report generation |
| Engine recommendation | `recommendations` + `recommendation_players` | Each report generation |
| AI report | `reports` | Each report generation |
| Actual FPL results | `actual_results` | Post-deadline ingestion |

### Key Rules

- **Existing recommendations are never overwritten** — only missing reports are saved
- Post-deadline evaluation compares engine picks vs actual FPL results
- `ingestActualResults()` fetches live gameweek data from FPL API

### Evaluation Metrics

| Metric | Description |
|--------|-------------|
| Captain accuracy | Did the engine pick the highest-scoring captain? |
| XI overlap | How many recommended XI players matched actual starting XI |
| Transfer accuracy | Was the transfer recommendation correct? |
| Points comparison | Engine XI points vs actual XI points |

### History Modules

| Module | Purpose |
|--------|---------|
| `lib/history/save.ts` | `persistGameweekReport()` — upsert all snapshot data |
| `lib/history/load.ts` | `loadHistoryOverview()`, `loadGameweekDetail()` |
| `lib/history/ingest.ts` | `ingestActualResults()` — post-deadline FPL live points |
| `lib/history/evaluate.ts` | `evaluateRecommendation()` — compare recommended vs actual |
| `lib/history/metrics.ts` | `computeHistoryMetrics()` — aggregate performance |

---

## 10. Phase 5 — Live Intelligence

**Route:** `/intelligence`  
**API:** `GET /api/intelligence`

### Pipeline

`runIntelligencePipeline()` in `lib/intelligence/pipeline.ts`:

```
1. Fixture change detection     → fixtures.ts
2. Price signal detection       → prices.ts
3. News from FPL player fields  → news/provider.ts, news/normalize.ts
4. Conflict resolution          → conflicts.ts (FPL-primary)
5. Availability signals         → availability.ts
6. Decision impact calculation  → impact.ts
7. Recalculation check          → recalculate.ts
8. Key alerts for UI & AI       → pipeline output
9. Persist to Supabase          → persist.ts
```

### Intelligence Signals

| Signal | Source | Impact |
|--------|--------|--------|
| Player availability | FPL `chance_of_playing_*` fields | May change XI, captain, bench |
| Fixture changes | FPL fixtures API (reschedule, DGW, BGW) | May change fixture scoring |
| Price changes | FPL element `now_cost` tracking | Informational (optional alerts) |
| Player news | FPL player `news` field | Risk assessment, availability |

### Decision Impact

For each intelligence event, the system calculates impact on:

- Captain recommendation
- Starting XI
- Bench order
- Transfer recommendation

If impact is material, `shouldRecalculate` is set and the Phase 2 engine re-runs.

### Data Freshness

The intelligence panel shows freshness indicators per data source, with configurable cache windows:

| Cache | Default | Env var |
|-------|---------|---------|
| FPL data | 5 min | `INTELLIGENCE_FPL_CACHE_MS` |
| Fixtures | 10 min | `INTELLIGENCE_FIXTURE_CACHE_MS` |
| News | 15 min | `INTELLIGENCE_NEWS_CACHE_MS` |
| Prices | 30 min | `INTELLIGENCE_PRICE_CACHE_MS` |

---

## 11. Phase 6 — Notifications

**Routes:** `/notifications`, `/settings/notifications`  
**API:** `GET|PATCH /api/notifications`, `GET|PUT /api/notifications/preferences`

### Notification Types

| Type | Trigger | Default severity |
|------|---------|-----------------|
| `GAMEWEEK_REPORT` | Scheduled cron (Friday) | INFO |
| `DEADLINE_REMINDER` | ~24h and ~2h before deadline | URGENT |
| `CAPTAIN_CHANGE` | Captain recommendation changes | IMPORTANT |
| `CAPTAIN_RISK` | Captain risk increases (same captain) | IMPORTANT |
| `LINEUP_CHANGE` | Recommended XI changes | IMPORTANT |
| `TRANSFER_CHANGE` | Transfer changes SAVE → TRANSFER | IMPORTANT |
| `PLAYER_AVAILABILITY` | Squad player availability drops | IMPORTANT |
| `FIXTURE_CHANGE` | Fixture change affecting squad | INFO |
| `DOUBLE_GAMEWEEK` | DGW detected for squad player | INFO |
| `BLANK_GAMEWEEK` | BGW detected for squad player | INFO |
| `PRICE_CHANGE` | Price change (off by default) | INFO |
| `SYSTEM_ERROR` | System-level errors | URGENT |

### Severity Levels

`INFO` → `IMPORTANT` → `URGENT`

Users can set a minimum severity threshold in preferences. Alerts below the threshold are filtered out.

### Delivery Channels

| Channel | Providers | Default |
|---------|-----------|---------|
| Email | `console` (dev logs), `resend` (production), `none` | `console` |
| SMS | `console`, `twilio`, `none` | `none` (off) |

### Key Features

- **Deduplication:** Unique `dedupe_key` per notification prevents duplicates on repeated cron runs
- **Quiet hours:** Non-urgent alerts are delayed (`DELAYED` status); urgent alerts still send
- **User preferences:** Per-type toggles, channel selection, quiet hours, minimum severity
- **Delivery tracking:** Each notification has per-channel delivery records (`SENT`, `FAILED`, `DELAYED`)
- **Styled HTML emails:** Gameweek reports and alerts with IST deadline formatting

### What Does NOT Trigger Alerts

- Unchanged captain recommendation
- SAVE → SAVE transfer status
- Unrelated player injuries (not in recommended XI)
- Repeated identical conditions (dedupe prevents)

### Notification Modules

| Module | Role |
|--------|------|
| `rules.ts` | `evaluateNotifications()` — compares previous vs current state |
| `formatter.ts` | Message templates for each alert type |
| `dedupe.ts` | Deterministic `dedupeKey` generation |
| `preferences.ts` | User toggles, severity threshold, quiet hours |
| `dispatcher.ts` | Persist event + send via email/SMS |
| `runner.ts` | Cron job orchestration |
| `persist.ts` | Supabase CRUD for preferences, events, deliveries, state |
| `email-template.ts` | Styled HTML email templates |
| `quiet-hours.ts` | Quiet hours logic |
| `severity.ts` | Severity mapping per notification type |

---

## 12. FPL API Integration

### Client (`lib/fpl/client.ts`)

- **Base URL:** `https://fantasy.premierleague.com/api`
- **Retry logic:** 3 attempts with exponential backoff on 429/5xx
- **Timeout:** 15 seconds per request
- **Caching:** Next.js `revalidate` per endpoint

### Endpoints Used

| Function | FPL Endpoint | Cache |
|----------|-------------|-------|
| `getBootstrapStatic()` | `/bootstrap-static/` | 30 min |
| `getEntry(id)` | `/entry/{id}/` | 2 min |
| `getPicks(id, gw)` | `/entry/{id}/event/{gw}/picks/` | 1 min |
| `getFixtures()` | `/fixtures/` | 30 min |
| `getLiveGameweek(gw)` | `/event/{gw}/live/` | 1 min |

### Entry ID Resolution

| Context | Source |
|---------|--------|
| User-facing requests | `getAuthenticatedFplEntryId()` from `profiles.fpl_entry_id` |
| Cron/background jobs | `getEntryId()` from `FPL_ENTRY_ID` or `FPL_BOOTSTRAP_ENTRY_ID` env |

### Data Normalization (`lib/fpl/normalize.ts`)

- Maps raw FPL API types to app types
- Converts prices from tenths to millions (e.g. 75 → £7.5m)
- Classifies squad into starting XI vs bench
- Attaches upcoming fixtures per player
- Indexes teams and element types by ID

### Security

- **No FPL login credentials stored**
- **No cookies or bearer tokens**
- Uses only public API endpoints
- No automatic transfers or lineup changes

---

## 13. Database Schema

Schema is defined in 5 Supabase SQL migrations. Run them in order in the Supabase SQL editor.

### Migration 001 — Phase 4 History

| Table | Purpose |
|-------|---------|
| `managers` | FPL manager metadata (`entry_id` unique) |
| `gameweeks` | GW metadata (deadline, finished flag) |
| `players_snapshot` | Player stats per GW (composite PK: `id, gameweek_id`) |
| `team_snapshots` | Squad picks per entry/GW |
| `recommendations` | Engine output per entry/GW |
| `recommendation_players` | Per-player scores in a recommendation |
| `actual_results` | Post-deadline player points |
| `reports` | AI report JSON linked to recommendation |

### Migration 002 — Phase 5 Intelligence

| Table | Purpose |
|-------|---------|
| `intelligence_events` | Detected events (type, risk, confidence) |
| `price_snapshots` | Player price history |
| `fixture_changes` | Fixture reschedule/DGW/BGW changes |
| `news_items` | Normalized news from FPL player fields |

### Migration 003 — Phase 6 Notifications

| Table | Purpose |
|-------|---------|
| `notification_preferences` | Per-entry channel toggles, alert types, quiet hours |
| `notification_events` | Stored alerts with unique `dedupe_key` |
| `notification_deliveries` | Per-channel delivery status |
| `notification_state` | JSON state snapshots for change detection |

### Migration 004 — Auth & RLS

| Object | Purpose |
|--------|---------|
| `profiles` | Links `auth.users.id` → `fpl_entry_id` |
| `handle_new_user()` trigger | Auto-creates profile on sign-up |
| `current_user_fpl_entry_id()` | RLS helper function |
| Row-Level Security policies | User-scoped data filtered by `fpl_entry_id` |

### Migration 005 — Profile Insert Policy

Allows authenticated users to insert their own profile row if the trigger didn't run.

### Key Relationships

```
auth.users (1) ──→ (1) profiles.fpl_entry_id
profiles.fpl_entry_id ──→ managers.entry_id
entry_id + gameweek_id ──→ team_snapshots, recommendations
recommendations (1) ──→ (N) recommendation_players
recommendations (1) ──→ (N) reports
notification_events (1) ──→ (N) notification_deliveries
```

TypeScript row types are in `lib/db/schema.ts`.

---

## 14. API Reference

All API routes use `export const dynamic = "force-dynamic"`. Protected routes require a valid Supabase session and linked `profiles.fpl_entry_id`.

### User API Routes

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/report` | GET | Required | Generate AI report. `?stored=true` loads cached only. Persists snapshot + optionally sends email. |
| `/api/history` | GET | Required | History overview with metrics (503 if DB not configured) |
| `/api/history/[gw]` | GET | Required | Gameweek detail (recommendation, report, evaluation) |
| `/api/history/[gw]` | POST | Required | Ingest actual FPL live results for a gameweek |
| `/api/intelligence` | GET | Required | Intelligence bundle JSON + recalculation flags |
| `/api/notifications` | GET | Required | List notifications (`configured: false` if no DB) |
| `/api/notifications` | PATCH | Required | Mark notification read (`{ id: number }`) |
| `/api/notifications/preferences` | GET | Required | Load notification preferences |
| `/api/notifications/preferences` | PUT | Required | Save notification preferences |

### Auth Route

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/auth/callback` | GET | Public | Exchanges OAuth `code` for Supabase session; ensures user profile exists |

### Cron Routes (require `CRON_SECRET`)

| Endpoint | Schedule | Purpose |
|----------|----------|---------|
| `/api/cron/gameweek-report` | Fri 08:00 UTC | Generate GW report, persist, send notification |
| `/api/cron/daily-check` | Daily 08:00 UTC | Intelligence check + deadline reminders (parallel) |
| `/api/cron/deadline-check` | Manual only | Standalone deadline reminder check |
| `/api/cron/intelligence-check` | Manual only | Standalone intelligence state-change alerts |

Cron auth accepts: `Authorization: Bearer <CRON_SECRET>`, `x-cron-secret` header, or `?secret=` query param.

---

## 15. Pages & UI Components

### Dashboard Navigation

Configured in `lib/navigation.ts`:

| Route | Label | Description |
|-------|-------|-------------|
| `/squad` | Squad | Live picks & formation |
| `/analysis` | Analysis | Decision engine |
| `/report` | Report | AI gameweek report |
| `/intelligence` | Intelligence | Live alerts & freshness |
| `/notifications` | Notifications | Alerts & delivery history |
| `/settings/notifications` | Settings | Notification preferences |
| `/gameweeks` | History | Gameweek snapshots |

### Layout

- `DashboardShell` — header with manager stats, gameweek badge, navigation, user menu
- `DashboardNav` — section navigation tabs
- Glass-panel design system with `Panel`, `Badge`, `StatCard` primitives

### Component Map by Phase

| Phase | Components |
|-------|------------|
| 1 — Squad | `Squad`, `Pitch`, `Bench`, `PlayerCard`, `Fixture`, `CaptainCard` |
| 2 — Analysis | `Analysis`, `AnalysisSection` |
| 3 — Report | `GameweekReport`, `ExecutiveSummary`, `CaptainCard`, `TransferCard`, `RecommendedXI`, `RiskList` |
| 4 — History | `GameweekTable`, `PerformanceMetrics`, `GameweekSummary`, `RecommendationComparison` |
| 5 — Intelligence | `IntelligencePanel`, `AvailabilityAlerts`, `FixtureChanges`, `PriceChanges`, `NewsAlerts`, `DataFreshness` |
| 6 — Notifications | `NotificationList`, `NotificationCard`, `NotificationSettings` |
| Auth | `GoogleSignInButton`, `UserMenu` |

---

## 16. Scheduled Jobs (Cron)

Defined in `vercel.json`. Schedules are **UTC**.

| Job | Schedule | Purpose |
|-----|----------|---------|
| `/api/cron/gameweek-report` | `0 8 * * 5` (Fri 08:00) | Generate GW report, persist, email notification |
| `/api/cron/daily-check` | `0 8 * * *` (daily 08:00) | Intelligence notification check + deadline reminders |

**Note:** `deadline-check` and `intelligence-check` were consolidated into `daily-check` to stay within Vercel Hobby cron limits (2 crons max). The standalone endpoints remain available for manual invocation.

### Cron Runners (`lib/notifications/runner.ts`)

| Function | Purpose |
|----------|---------|
| `runGameweekReportCron()` | Generate report, persist, notify (skips finished GWs) |
| `runIntelligenceNotificationCheck()` | Compare state, dispatch change alerts |
| `runDeadlineCheckCron()` | ~24h and ~2h deadline reminders |

### Local Development

Cron jobs do not run automatically with `npm run dev`. Test manually:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/daily-check
```

---

## 17. Configuration & Environment

Copy `.env.example` to `.env.local` and fill in values. Never commit `.env.local`.

### Required Variables

| Variable | Purpose |
|----------|---------|
| `FPL_BOOTSTRAP_ENTRY_ID` | Seeds `profiles.fpl_entry_id` on first Google sign-in |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-safe Supabase key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin DB access |

### Optional Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `FPL_ENTRY_ID` | — | Cron/background job entry ID |
| `AI_PROVIDER` | `openai` | AI provider selection |
| `OPENAI_API_KEY` | — | AI reports (deterministic fallback if missing) |
| `OPENAI_MODEL` | `gpt-4o-mini` | OpenAI model |
| `AI_TIMEOUT_MS` | `60000` | AI request timeout |
| `CRON_SECRET` | — | Cron endpoint authentication |
| `NOTIFICATION_EMAIL_PROVIDER` | `console` | `console` / `resend` / `none` |
| `RESEND_API_KEY` | — | Resend email API key |
| `NOTIFICATION_EMAIL_FROM` | — | Email sender address |
| `NOTIFICATION_EMAIL_TO` | — | Email recipient |
| `NOTIFICATION_SMS_PROVIDER` | `none` | `none` / `twilio` / `console` |
| `TWILIO_*` | — | Twilio SMS credentials |
| `NEXT_PUBLIC_APP_URL` | — | Email CTA links |
| `INTELLIGENCE_*_CACHE_MS` | See Phase 5 | Intelligence cache windows |

### Available Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `npm run dev` | Development server |
| `build` | `npm run build` | Production build |
| `start` | `npm start` | Production server |
| `lint` | `npm run lint` | ESLint |
| `test` | `npm test` | Run all Vitest tests |
| `test:watch` | `npm run test:watch` | Vitest watch mode |

---

## 18. Testing & CI/CD

### Test Suite

13 test files in `tests/`, run with Vitest 4.1.11 in Node environment.

| Test File | Coverage Area | Tests |
|-----------|---------------|-------|
| `analysis.test.ts` | Formations, lineup, captain, risk, bench | 17 |
| `transfers.test.ts` | Transfer engine logic | 9 |
| `squad.test.ts` | Squad classification | 7 |
| `normalize.test.ts` | FPL data normalization | 6 |
| `ai.test.ts` | AI validation, fallback, locking | 17 |
| `ai-provider.test.ts` | OpenAI provider errors | 4 |
| `history.test.ts` | Recommendation evaluation | 6 |
| `history-persistence.test.ts` | Persistence shapes | 3 |
| `intelligence.test.ts` | Availability, news, fixtures, prices, recalculation | 24 |
| `notifications.test.ts` | Rules, dedupe, preferences, quiet hours, cron auth, delivery | 37 |
| `auth.test.ts` | Middleware paths, redirect sanitization | 10 |
| `format.test.ts` | Formatting utilities | 6 |

```bash
npm test
npx tsc --noEmit
```

### CI Pipeline (`.github/workflows/ci.yml`)

4-stage pipeline on every push and pull request:

```
Stage 1: Lint (ESLint)
    ↓
Stage 2: Type Check (tsc --noEmit)
    ↓
Stage 3: Test Suite (Vitest)
    ↓
Stage 4: Production Build (next build)
```

Runs on Ubuntu with Node 22. Concurrency group cancels in-progress runs on the same branch.

---

## 19. Deployment

### Vercel

- Hosting via Vercel with automatic deployments from git
- Cron jobs defined in `vercel.json`
- Environment variables configured in Vercel dashboard

### Setup Checklist

1. `npm install`
2. Copy `.env.example` → `.env.local`
3. Create Supabase project
4. Run all 5 SQL migrations in order
5. Enable Google OAuth in Supabase (see README.md for detailed steps)
6. Configure environment variables in Vercel
7. Set `CRON_SECRET` for production cron auth
8. Deploy

### Production URLs

Configure in Supabase Authentication → URL configuration:
- **Site URL:** production app URL
- **Redirect URLs:** `https://your-app.vercel.app/auth/callback`

---

## 20. Scope & Limitations

### In Scope (Implemented)

- Live FPL data fetching and display
- Deterministic lineup, captain, and transfer recommendations
- Optional AI explanations (server-side only)
- Supabase history and post-deadline evaluation
- Live intelligence monitoring with recalculation
- Scheduled cron jobs (on Vercel)
- Email (Resend) and optional SMS (Twilio) notifications
- Notification preferences, quiet hours, and history UI
- Google Sign-In with per-user FPL entry linking
- GitHub Actions CI pipeline

### Out of Scope (Not Implemented)

- No automatic transfers or lineup changes
- No machine learning or predictive models
- No FPL cookie/token storage
- No multi-FPL-account linking per user (one `fpl_entry_id` per profile)
- No WhatsApp automation
- Cron jobs don't run locally (`npm run dev`)
- Failed email deliveries are not auto-retried
- No push notifications (web or mobile)
- No mobile PWA
- No backtesting or recommendation learning

### Known Constraints

- Vercel Hobby plan limits cron jobs to 2 schedules (consolidated into `gameweek-report` + `daily-check`)
- AI report generation takes 30–60 seconds
- Single `FPL_ENTRY_ID` for cron jobs (not per-user cron)

---

## 21. Development History

The project evolved through six phases plus an auth layer, developed over approximately one week (September 2–5, 2026).

| Date | Milestone |
|------|-----------|
| Sep 2 | **Phase 1:** Dashboard UI with pitch layout |
| Sep 3 | **Phase 2:** Deterministic FPL decision engine |
| Sep 3 | **Phase 3:** AI gameweek reports, dashboard sections |
| Sep 3 | **Phase 4:** Supabase history, evaluation, persistence |
| Sep 4 | **Phase 5:** Live intelligence layer |
| Sep 4 | **Phase 6:** Notifications, scheduled alerts, email delivery |
| Sep 5 | Google Sign-In with Supabase Auth |
| Sep 5 | GitHub Actions CI pipeline |
| Sep 5 | UI modernization (Squad and Pitch views) |
| Sep 5 | Cron consolidation for Vercel Hobby limits |
| Sep 5 | Styled HTML notification emails with IST deadlines |

### Related Documentation

| Document | Description |
|----------|-------------|
| `README.md` | Quick start and setup guide |
| `explain/project-details.md` | Earlier phase documentation (partially outdated on auth) |
| `explain/google-sign-in-workflow.md` | Detailed Google OAuth setup and flow |
| `explain/APPLICATION.md` | This document — authoritative implementation reference |

---

*This document reflects the application state as of September 2026. For the latest setup instructions, see `README.md`.*
