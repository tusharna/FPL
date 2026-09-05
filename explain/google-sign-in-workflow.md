# Google Sign-In Authentication Workflow

This document describes the mandatory Google Sign-In flow implemented with **Supabase Auth** and **`@supabase/ssr`**. Authentication sits above all application layers (Phases 1–6). No page or private API is reachable without a valid Supabase session, except public auth routes and cron endpoints.

---

## High-Level Picture

```text
User
  ↓
Next.js Middleware (every request)
  ↓
Authenticated?
  ├── NO  → /login
  └── YES → FPL app (squad, reports, history, etc.)
                ↓
            profiles.fpl_entry_id → FPL data for that user
```

**Stack:** Supabase Auth + Google OAuth + `@supabase/ssr` (cookie-based sessions).

---

## The Actors

| Piece | Role |
|-------|------|
| **Google** | Identity provider (“who are you?”) |
| **Supabase Auth** | Issues and manages sessions |
| **`profiles` table** | Links `auth.users` → `fpl_entry_id` |
| **Middleware** | Gatekeeper on every request |
| **`/login`** | Public sign-in page |
| **`/auth/callback`** | Exchanges OAuth code for a session |

---

## Flow 1: First Visit (Not Logged In)

```text
1. User opens https://fpl-robocop.vercel.app/
         ↓
2. middleware.ts runs
         ↓
3. supabase.auth.getUser() → no user
         ↓
4. Redirect to /login?next=/
```

The `next` query parameter remembers where the user wanted to go (e.g. `/gameweeks/5`).

---

## Flow 2: Click “Continue with Google”

**File:** `components/auth/GoogleSignInButton.tsx`

```text
1. User clicks button on /login
         ↓
2. supabase.auth.signInWithOAuth({ provider: "google" })
         ↓
3. redirectTo = https://your-app/auth/callback?next=/squad
         ↓
4. Browser → Supabase authorize URL → Google
```

Supabase environment variables used in the browser:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The Google client secret never touches the application. It lives in the Supabase dashboard only.

If Google OAuth is misconfigured, the error appears on the login page under the button.

---

## Flow 3: Google → Supabase → Your App

```text
Google account picker / auto-sign-in
         ↓
Supabase (https://<project>.supabase.co/auth/v1/callback)
         ↓
Your app: /auth/callback?code=...&next=/
```

**Important:** Google talks to Supabase first. Supabase then redirects to the app with a one-time `code`.

### Safety Net: Code on Wrong URL

If Supabase sends the code to `/login?code=...` (misconfiguration), middleware catches it:

```text
/login?code=abc123  →  redirect  →  /auth/callback?code=abc123
```

The login page also performs this redirect as a backup.

---

## Flow 4: `/auth/callback` — Session Creation

**File:** `app/auth/callback/route.ts`

```text
1. Read ?code=... from URL
         ↓
2. supabase.auth.exchangeCodeForSession(code)
   (one-time code → session tokens in cookies)
         ↓
3. ensureUserProfile(user)
         ↓
4. Redirect to ?next= (default / → /squad)
```

Session cookies are written on the **redirect response**. This is required for Next.js App Router + Supabase SSR.

If anything fails:

| Failure | Redirect |
|---------|----------|
| No code | `/login?error=missing_auth_code` |
| Code exchange fails | `/login?error=session_exchange_failed` |
| Profile setup fails | `/login?error=profile_setup_failed` |
| User cancelled Google | `/login?error=oauth_cancelled` |

---

## Flow 5: Profile + FPL Entry Linking

**File:** `lib/auth/user.ts`  
**Table:** `profiles` (`id` = `auth.users.id`, `fpl_entry_id`)

```text
Google user signs in
         ↓
auth.users row (Supabase)
         ↓
profiles row (your DB)
         ↓
fpl_entry_id = 3944035 (from FPL_BOOTSTRAP_ENTRY_ID on first login)
         ↓
getAuthenticatedFplEntryId() used for all FPL data
```

On first sign-in:

1. A database trigger may create an empty `profiles` row.
2. `ensureUserProfile()` sets `fpl_entry_id` from `FPL_BOOTSTRAP_ENTRY_ID`.
3. Later requests resolve the entry ID from `profiles`, not from environment variables or client input.

```text
Google User
     ↓
Session cookie
     ↓
profiles.fpl_entry_id
     ↓
FPL API + history + notifications for that team
```

---

## Flow 6: Authenticated App Usage

**File:** `app/(app)/layout.tsx`

```text
1. getAuthenticatedUser()         → email, name for header
2. getAuthenticatedFplEntryId()   → from profiles table
3. getAuthenticatedDashboardData(entryId)
4. Render DashboardShell + UserMenu
```

Every protected page under `(app)/` loads data for the authenticated user's FPL team via their profile, not a globally hard-coded entry ID.

---

## Flow 7: Middleware on Every Request

**Files:** `middleware.ts` → `lib/auth/middleware.ts`

```text
Request comes in
         ↓
Has ?code= on wrong path? → forward to /auth/callback
         ↓
Refresh/read Supabase session from cookies
         ↓
Route type?
```

| Route | Behaviour |
|-------|-----------|
| `/login`, `/auth/*` | Public |
| `/api/cron/*` | Public (uses `CRON_SECRET`, not user session) |
| `/api/report`, `/api/history`, etc. | Requires session → **401** if missing |
| `/squad`, `/gameweeks`, etc. | Requires session → redirect to `/login?next=...` |
| `/login` while already logged in | Redirect to `next` or `/` |

---

## Flow 8: API Protection (Second Layer)

**File:** `lib/auth/api.ts` — `requireApiAuth()`

Even if middleware were bypassed, API routes perform:

```text
1. getAuthenticatedUser()
2. getAuthenticatedFplEntryId()
3. Return 401 / 403 if missing
4. Use entryId for all data queries
```

The client never sends or trusts `fpl_entry_id`. It is always resolved server-side from `profiles`.

---

## Flow 9: Logout

**File:** `components/auth/UserMenu.tsx`

```text
1. User clicks "Sign out"
         ↓
2. supabase.auth.signOut() (clears session cookies)
         ↓
3. window.location.href = "/login"
         ↓
4. Middleware blocks all protected routes again
```

---

## Flow 10: Session Persistence

```text
Sign in once
     ↓
HttpOnly cookies (Supabase SSR)
     ↓
Browser refresh / new tab → still logged in
     ↓
Session expires → middleware sees no user → /login?next=...
```

Middleware calls `getUser()` on each request to refresh and validate the session.

---

## Security Measures

| Concern | How It Is Handled |
|---------|-------------------|
| Client-side-only auth | Middleware + server `getUser()` |
| Open redirects | `sanitizeRedirectPath()` — internal paths only |
| Service role key | Server-only, never `NEXT_PUBLIC_` |
| Google secret | Only in Supabase dashboard |
| User data isolation | RLS on `profiles` + entry-scoped tables |
| Cron vs user auth | Crons use `CRON_SECRET`, not Google session |
| Trusting client `entry_id` | Never — always from `profiles` server-side |

---

## File Map

```text
middleware.ts                              Entry point for all requests
lib/auth/middleware.ts                     Session refresh + route protection
app/login/page.tsx                         Login UI
components/auth/GoogleSignInButton.tsx     Starts OAuth
app/auth/callback/route.ts                 Code → session
lib/auth/server.ts                         Supabase client (Server Components / routes)
lib/auth/client.ts                         Supabase client (browser)
lib/auth/user.ts                           User + profile + FPL entry ID
lib/auth/api.ts                            API route auth helper
lib/auth/redirect.ts                       Safe redirect validation
lib/auth/config.ts                         Auth environment configuration
supabase/migrations/004_auth_profiles.sql  profiles table + RLS
supabase/migrations/005_profiles_insert_policy.sql  Profile insert policy
components/auth/UserMenu.tsx               Sign out + account info
```

---

## End-to-End Diagram (Happy Path)

```text
┌─────────┐
│  User   │
└────┬────┘
     │ opens /
     ▼
┌─────────────┐     no session     ┌─────────────┐
│ Middleware  │ ─────────────────► │   /login    │
└─────────────┘                    └──────┬──────┘
     ▲                                    │ click Google
     │                                    ▼
     │                             ┌─────────────┐
     │                             │   Google    │
     │                             └──────┬──────┘
     │                                    │
     │                                    ▼
     │                             ┌─────────────┐
     │                             │  Supabase   │
     │                             └──────┬──────┘
     │                                    │
     │                                    ▼
     │                          /auth/callback?code=...
     │                                    │
     │                          exchangeCodeForSession
     │                          ensureUserProfile
     │                                    │
     └────────────────────────────────────┘
                    redirect to /squad
                         │
                         ▼
              ┌─────────────────────┐
              │  FPL Assistant app  │
              │  (via profiles)     │
              └─────────────────────┘
```

---

## Example: Protected Deep Link

User opens `/gameweeks/5` while logged out:

```text
/gameweeks/5
     ↓
Middleware: no session
     ↓
/login?next=/gameweeks/5
     ↓
Google sign-in → /auth/callback?code=...&next=/gameweeks/5
     ↓
Session created → redirect to /gameweeks/5
```

---

## External Configuration

| Where | What |
|-------|------|
| **Supabase** | Enable Google provider, set redirect URLs, run auth migrations |
| **Google Cloud** | OAuth client with redirect URI pointing to Supabase callback |
| **Vercel / `.env.local`** | `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, `FPL_BOOTSTRAP_ENTRY_ID` |

### Required Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...        # anon public key (browser-safe)
SUPABASE_SERVICE_ROLE_KEY=eyJ...            # service_role secret (server-only)
FPL_BOOTSTRAP_ENTRY_ID=3944035              # seeds profiles.fpl_entry_id on first login
FPL_ENTRY_ID=3944035                        # cron/background jobs only
```

### Supabase Redirect URLs

```text
http://localhost:3000/auth/callback
https://fpl-robocop.vercel.app/auth/callback
```

### Google Cloud Redirect URI

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

---

## Summary

**Google proves identity → Supabase issues a session → the app stores it in cookies → middleware enforces it on every request → `profiles` links the Google user to their FPL team.**

The decision engine, AI reports, history, intelligence, and notifications are unchanged underneath. Authentication is an access layer above them.
