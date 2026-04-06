# Stacks — System Design Architecture

## Overview
AI-powered financial literacy platform for Gen Z and young professionals. Combines AI coaching, Plaid bank account integration, blockchain-backed goal setting, and gamified STX token rewards to make personal finance engaging and accessible.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) + React 18 + TypeScript |
| Styling | Tailwind CSS v3 + Radix UI (~25 primitives) |
| Animation | Framer Motion v11 |
| Charts | Recharts v2 |
| UI Utilities | clsx · tailwind-merge · class-variance-authority · cmdk · sonner · vaul · embla-carousel-react |
| Database | Supabase (PostgreSQL + Realtime + Auth + RLS) |
| Banking | Plaid API (`plaid` v38) |
| AI Coach | Google Generative AI (`@google/generative-ai` v0.24) |
| Blockchain | Polygon Network (STX token rewards) |
| Package Manager | pnpm 8 |

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│            Next.js 14 App (Vercel)                          │
│                                                              │
│  (auth)/   → Sign in / Sign up (Supabase Auth)              │
│  /dashboard → Overview: balance, transactions, goals        │
│  /budget    → Budget categories + spending breakdown        │
│  /goals     → Financial goals + milestones tracker          │
│  /login     → Auth entry point                              │
└─────────────────────────────┬────────────────────────────────┘
                              │ Next.js API Routes
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
   ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐
   │  Plaid API   │  │  Google AI   │  │  Budget / Goals /   │
   │  Route       │  │  Route       │  │  Transactions /     │
   │              │  │              │  │  Wallet / Rewards   │
   │  /api/plaid  │  │  /api/ai     │  │  Routes             │
   └──────┬───────┘  └──────┬───────┘  └──────────┬──────────┘
          │                 │                      │
          ▼                 ▼                      ▼
┌──────────────────────────────────────────────────────────────┐
│                   Supabase Backend                          │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │  Auth    │  │ Realtime │  │PostgREST │  │  RLS       │  │
│  │ (session │  │ (live    │  │  (CRUD   │  │ (all tables│  │
│  │  mgmt)   │  │  updates)│  │   API)   │  │  secured)  │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  PostgreSQL                          │   │
│  │  Users → Profiles → Bank Connections                 │   │
│  │  → Financial Accounts → Transactions                 │   │
│  │  → Budget Categories → Goals & Milestones            │   │
│  │  → Reward Tokens → AI Chat Messages                  │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
              │                            │
              ▼                            ▼
   ┌──────────────────┐          ┌─────────────────────┐
   │   Plaid API      │          │   Polygon Network   │
   │  (bank account   │          │   (STX token        │
   │   linking +      │          │    rewards,         │
   │   transactions)  │          │    blockchain goals)│
   └──────────────────┘          └─────────────────────┘
```

---

## Database Schema

```
Users
  └── Profiles (display name, avatar, settings)
       └── Bank Connections (Plaid access_token, institution)
            └── Financial Accounts (checking, savings, credit)
                 └── Transactions (amount, merchant, category, date)

Budget Categories (name, limit, icon, color)
  └── (joined with Transactions for spend tracking)

Goals (title, target_amount, current_amount, deadline, type)
  └── Milestones (checkpoint amounts, completion dates)

Reward Tokens (token_id, user_id, amount, reason, tx_hash)

AI Chat Messages (user_id, role, content, created_at)
```

All tables have **Row Level Security (RLS)** — users can only access their own data.

---

## Key Features

### Plaid Bank Integration
```
User clicks "Connect Bank"
  → Next.js API creates Plaid Link token
  → User completes Plaid OAuth flow in modal
  → Plaid returns public_token
  → Server exchanges for access_token (stored encrypted)
  → Transactions synced to Supabase
  → Supabase Realtime pushes updates to UI
```

### AI Financial Coach
```
User asks financial question in chat
  → Message sent to /api/ai route
  → Google Generative AI generates personalized advice
  → Response streamed back to chat UI
  → Conversation history stored in Supabase
```

### STX Token Rewards (Blockchain)
```
User completes financial goal or milestone
  → Reward event triggered server-side
  → STX tokens minted on Polygon Network
  → Token transaction recorded in Supabase
  → User's wallet balance updated in UI
```

---

## Component Architecture

```
src/
├── app/
│   ├── (auth)/           # Sign in / Sign up pages
│   ├── dashboard/        # Main dashboard
│   ├── budget/           # Budget management
│   ├── goals/            # Goals + milestones
│   └── api/              # Next.js API routes
├── components/
│   ├── ui/               # Radix + shadcn base components
│   ├── dashboard/        # Dashboard-specific components
│   ├── auth/             # Auth forms
│   ├── budget/           # Budget charts + forms
│   ├── goals/            # Goal cards + milestone tracker
│   ├── ai-coach/         # AI chat interface
│   └── rewards/          # Token wallet + reward history
└── lib/
    ├── supabase.ts        # Supabase client
    ├── plaid.ts           # Plaid API helpers
    ├── store.ts           # State management
    └── events.ts          # Supabase Realtime event handlers
```

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `PLAID_CLIENT_ID` | Plaid API client ID |
| `PLAID_SECRET` | Plaid API secret |
| `PLAID_ENV` | `sandbox` / `development` / `production` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google Generative AI key |

---

## Deployment

| Concern | Platform |
|---|---|
| App | Vercel |
| Database | Supabase Cloud (PostgreSQL + Realtime) |
| Blockchain | Polygon Network |
| Bank Data | Plaid API |
