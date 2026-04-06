# ApplySense — Project Overview

## Project Purpose

ApplySense is a job application tracking web app that allows users to manage and monitor their job search pipeline. The core differentiating feature is screenshot-based intake: a user uploads a screenshot of a job application confirmation email or form, and the app automatically extracts the company name, job title, application status, and date using a two-stage OCR pipeline (GPT-4o Vision first, Tesseract.js as a fallback). The extracted data pre-fills a job entry form, reducing manual data entry.

Once jobs are saved, users can view them on a dashboard with card and table views, filter by status (Applied, Interview, Offer, Rejected), sort by date or company, and track success metrics — interview rate, offer rate, and response rate — all calculated in-browser from the stored data.

Authentication is Google OAuth through NextAuth.js; all job data is private to the logged-in user.

---

## Tech Stack & Rationale

| Layer | Technology | Version | Why chosen |
|---|---|---|---|
| Framework | Next.js (App Router) | 15 | Full-stack React with server components, API routes, and file-based routing |
| Language | TypeScript | — | End-to-end type safety from DB schema (Prisma) through tRPC to React components |
| API layer | tRPC v11 | — | Type-safe RPC without writing REST contracts; inputs validated with Zod |
| ORM | Prisma | — | Type-safe DB client generated from schema; singleton prevents connection pool exhaustion in dev |
| Database | PostgreSQL | — | Relational store for users and job records; Prisma adapter used by NextAuth |
| Auth | NextAuth.js v5 | — | Google OAuth provider; PrismaAdapter persists sessions/accounts to DB |
| File storage | Supabase Storage | — | Hosts uploaded job screenshots; public URLs stored as `imageUrl` on job records |
| OCR — primary | OpenAI GPT-4o Vision | — | Multimodal LLM extracts structured job data from varied screenshot formats |
| OCR — fallback | Tesseract.js | — | Browser-side OCR; runs if GPT-4o is unavailable or returns empty results |
| Styling | Tailwind CSS | v3 | Utility-first CSS with custom gradient and glass-morphism utilities in globals.css |
| Notifications | Browser Notification API | — | `NotificationReminders` sets `setInterval`-based follow-up reminders |
| Validation | Zod + `@t3-oss/env-nextjs` | — | Input schemas on all tRPC procedures; `env.js` validates all environment variables at build time |

---

## Architecture Overview

T3 Stack structure (Next.js App Router + tRPC + Prisma + NextAuth + Tailwind), scaffolded with `create-t3-app`.

```
src/
├── app/
│   ├── layout.tsx                        # Root: SessionProvider, Navigation, global styles
│   ├── page.tsx                          # Landing page
│   ├── dashboard/page.tsx                # Stats, filters, card/table job views
│   ├── jobs/page.tsx                     # Manual job add/edit form
│   ├── upload/page.tsx                   # Screenshot upload + OCR flow
│   └── api/
│       ├── auth/[...nextauth]/route.ts   # NextAuth handler
│       └── trpc/[trpc]/route.ts          # tRPC HTTP handler
├── server/
│   ├── api/routers/job.ts                # CRUD + extractFromScreenshot procedures
│   ├── api/trpc.ts                       # Context (db + session), protectedProcedure
│   ├── auth/config.ts                    # NextAuth: Google provider, PrismaAdapter
│   └── db.ts                             # Prisma client singleton
├── lib/
│   ├── ocr.ts                            # Server OCR: GPT-4o Vision → Tesseract fallback
│   ├── ocr-client.ts                     # Browser OCR (Tesseract only)
│   ├── supabase.ts                       # Supabase Storage client
│   └── upload.ts                         # uploadScreenshot / deleteScreenshot helpers
├── trpc/
│   ├── react.tsx                         # TRPCReactProvider, api object
│   ├── server.ts                         # Server-side tRPC caller for RSC
│   └── query-client.ts                   # Shared TanStack QueryClient config
└── env.js                                # Type-safe env validation
```

**Request flow for a job query:**
1. Client calls `api.job.getAll.useQuery()`.
2. tRPC handler at `/api/trpc/getAll` receives it.
3. `createTRPCContext` runs `auth()` to resolve the NextAuth session.
4. `protectedProcedure` middleware throws `UNAUTHORIZED` if no session.
5. `ctx.db.job.findMany({ where: { userId: ctx.session.user.id } })` returns only the current user's rows.
6. superjson serializes the response (handles Date objects).
7. `utils.job.getAll.invalidate()` after mutations triggers a refetch.

**OCR flow on screenshot upload:**
1. User drops image → uploaded to Supabase Storage → public URL returned.
2. `upload/page.tsx` calls `extractJobData.mutateAsync({ imageUrl })` with a 30-second timeout race.
3. Server runs `extractJobDataFromScreenshot(imageUrl)` in `ocr.ts`: GPT-4o Vision → Tesseract fallback.
4. If server times out, the client falls back to `ocr-client.ts` (Tesseract in-browser).
5. Extracted `{ company, title, status, date, notes }` pre-fills the `/jobs` form via query params.

---

## Setup & Install Steps

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Google OAuth app (Client ID + Secret)
- Supabase project for file storage
- Optional: OpenAI API key for GPT-4o Vision OCR

```bash
git clone https://github.com/tomiwaaluko/applysense.git
cd applysense
npm install
cp .env.example .env
# Fill in:
# DATABASE_URL, AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET
# NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
# OPENAI_API_KEY (optional)

bash start-database.sh   # start local PostgreSQL (if not using hosted)
npx prisma db push
npm run dev              # → http://localhost:3000
```

---

## Notable Implementation Decisions

### Two-stage OCR with graceful degradation
`ocr.ts` implements a priority chain: GPT-4o Vision → Tesseract.js → empty-field default. Each stage is wrapped in try/catch so a failure moves silently to the next. On the client, a 30-second `Promise.race` guards the server tRPC call; on timeout, `ocr-client.ts` (Tesseract in-browser) is attempted. Users can also "Skip AI analysis and continue manually."

### GPT-4o prompt engineering for noisy email screenshots
The GPT-4o prompt explicitly instructs the model to ignore email greetings ("Dear", "Hello") — commonly misclassified as company names — and instead look for capitalized words repeated across the subject line, body, and signature. It also requests complete job titles including level/department suffixes.

### `protectedProcedure` enforces user-scoped data access
Every job router procedure filters by `userId: ctx.session.user.id` at the Prisma query level. No separate authorization checks in page components — the server simply never returns another user's data.

### Prisma singleton to prevent connection pool exhaustion in Next.js dev
`db.ts` stores the Prisma client on `globalThis` when `NODE_ENV !== "production"`. Without this, Next.js hot-module replacement re-executes module code on every file save, opening a new DB connection pool on each reload.

### superjson as tRPC transformer for transparent Date serialization
tRPC is configured with `superjson`, which round-trips Date, Map, Set, and `undefined` transparently. `job.date` and `job.createdAt` arrive in React components as real `Date` objects — no `new Date(job.date)` coercion needed.

### Dashboard statistics computed client-side with `useMemo`
All derived stats (interview rate, offer rate, response rate, recent activity) are computed synchronously inside `useMemo` from the single `api.job.getAll` response. No extra round-trip, and the stats stay in sync with the same cache entry that drives the job list.

### Supabase RLS and storage setup in standalone SQL scripts
`supabase-rls-setup.sql` and `supabase-storage-setup.sql` are provided as separate scripts to run in the Supabase SQL editor. This makes the security surface explicit and auditable, and means the app itself never runs privileged Supabase operations at runtime.


## Resume Bullet Points

- Shipped a full-stack job application tracker with a two-stage OCR pipeline (GPT-4o Vision primary, Tesseract.js browser fallback) that auto-extracts company, role, and status from uploaded screenshots, acquired 10+ active users post-launch.
- Implemented type-safe end-to-end data flow using tRPC v11, Prisma ORM, and NextAuth.js Google OAuth, enforcing per-user data isolation at the database query level via protectedProcedure middleware with no client-side authorization logic required.
- Designed client-side dashboard analytics (interview rate, offer rate, response rate) computed with useMemo from a single TanStack Query cache entry, eliminating redundant API calls while keeping all metrics in sync with live job data.
