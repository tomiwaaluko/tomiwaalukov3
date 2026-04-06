# ApplySense — System Design Architecture

## Overview
AI-powered job application manager. Users upload screenshots of job postings and the system automatically extracts company details, position requirements, salary ranges, and deadlines using OCR and GPT. Built on the T3 Stack.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Turbo) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| API Layer | tRPC v11 (end-to-end type-safe API) |
| Data Fetching | TanStack Query v5 |
| Auth | NextAuth.js v5 (beta) + Google OAuth |
| Auth Adapter | @auth/prisma-adapter |
| ORM | Prisma v6 |
| Database | Supabase (PostgreSQL) |
| AI Extraction | OpenAI GPT (openai SDK v5) |
| OCR | Tesseract.js v6 (client-side) |
| Validation | Zod v3 |
| Serialization | SuperJSON |

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│             Next.js 15 App (Vercel / Railway)               │
│                                                              │
│  src/app/                                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │  /       │  │/dashboard│  │ /jobs    │  │  /upload   │  │
│  │ Landing  │  │Overview  │  │App List  │  │ Screenshot │  │
│  └──────────┘  └──────────┘  └──────────┘  └─────┬──────┘  │
│                                                   │          │
│  tRPC Client (TanStack Query)                     │          │
└──────────────────────────────────────────────────┼──────────┘
                                                   │
           ┌───────────────────────────────────────┘
           ▼
┌──────────────────────────────────────────────────────────────┐
│                    Upload Flow                              │
│                                                              │
│  1. User uploads job posting screenshot                      │
│  2. Tesseract.js (client-side OCR) extracts raw text        │
│  3. Raw text sent to OpenAI GPT via tRPC route              │
│  4. GPT returns structured JSON:                            │
│     { company, role, requirements, salary, deadline, ... }  │
│  5. Structured data stored in Supabase via Prisma           │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│              tRPC Routers (server/api/routers/)             │
│                                                              │
│  jobs router    → CRUD for job applications                  │
│  upload router  → OCR + GPT extraction pipeline             │
│  auth router    → session management                         │
└────────────────────────────┬─────────────────────────────────┘
                             │ Prisma ORM
                             ▼
┌──────────────────────────────────────────────────────────────┐
│              Supabase (PostgreSQL)                          │
│                                                              │
│  Users · JobApplications · ExtractedData                    │
│  Row Level Security (users see only their own data)         │
└──────────────────────────────────────────────────────────────┘
```

---

## Key User Flows

### 1. Authentication
```
User visits site
  → Google OAuth via NextAuth.js v5
  → Session created, user record synced to PostgreSQL via Prisma adapter
  → JWT stored in session
```

### 2. Job Posting Extraction
```
User uploads screenshot
  → Tesseract.js runs client-side OCR → raw text
  → tRPC mutation sends raw text to server
  → Server calls OpenAI GPT with extraction prompt
  → GPT returns structured JSON (company, role, salary, deadline, requirements)
  → Data validated with Zod
  → Saved to database via Prisma
```

### 3. Application Tracking
```
User visits /jobs or /dashboard
  → tRPC query fetches user's job applications
  → TanStack Query caches and syncs data
  → User can filter, sort, update status of applications
```

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx               # Landing page
│   ├── dashboard/             # Application overview
│   ├── jobs/                  # Job listings
│   ├── upload/                # Screenshot upload + extraction
│   └── api/
│       ├── auth/              # NextAuth.js routes
│       └── trpc/              # tRPC handler
├── components/                # Reusable UI components
├── server/
│   ├── api/routers/           # tRPC router definitions
│   ├── auth.ts                # NextAuth config
│   └── db.ts                  # Prisma client
├── trpc/                      # tRPC client config
└── lib/                       # Utilities

prisma/
└── schema.prisma              # Database schema

supabase/
├── create-tables.sql
├── supabase-rls-setup.sql
└── supabase-storage-setup.sql
```

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Supabase connection string (pooled) |
| `DIRECT_URL` | Supabase direct connection (for Prisma migrations) |
| `NEXTAUTH_SECRET` | NextAuth.js JWT secret |
| `NEXTAUTH_URL` | App base URL |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `OPENAI_API_KEY` | OpenAI GPT API key |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (server-side) |

---

## Deployment

| Concern | Platform |
|---|---|
| App | Vercel, Netlify, or Railway |
| Database | Supabase Cloud (PostgreSQL) |
| Build | `npm run build` |
