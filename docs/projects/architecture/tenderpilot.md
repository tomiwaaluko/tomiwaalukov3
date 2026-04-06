# TenderPilot — System Design Architecture

## Overview
AI-powered legal operations platform built for the Google AI Hackathon 2025. Transforms chaotic client communications into structured, attorney-approved legal tasks using a multi-agent AI pipeline with human-in-the-loop approval.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + React 19.2 + TypeScript |
| Styling | Tailwind CSS v4 + Framer Motion |
| Icons | Lucide React |
| AI | Google Gemini 2.5 Pro |
| Database | Supabase (PostgreSQL) + Neon serverless |
| Deployment | Vercel + Supabase Cloud |
| Dev Mode | `TP_USE_MOCKS=true` (skip live Gemini calls) |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                 Next.js 16 App (Vercel)                     │
│                                                             │
│  /inbox      → Message ingestion + classification view      │
│  /tasks      → Orchestration dashboard + watcher control    │
│  /approvals  → Attorney review queue (human-in-the-loop)    │
│  /audit      → Full action timeline (A2A handoffs, ticks)   │
│  /telemetry  → Live ADK metrics dashboard                   │
└──────────────────────────┬──────────────────────────────────┘
                           │ API Routes
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 Multi-Agent Orchestrator                    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Orchestrator                          │   │
│  │  /api/orchestrator/run                             │   │
│  │  Dispatches agents in parallel                     │   │
│  └──────────┬──────────────────────┬──────────────────┘   │
│             │                      │                        │
│             ▼                      ▼                        │
│  ┌─────────────────┐    ┌────────────────────────────┐     │
│  │ Classifier Agent│    │  Evidence Sorter Agent     │     │
│  │ /api/classify   │    │  /api/agents/evidence-     │     │
│  │                 │    │  sorter                    │     │
│  │ Routes messages │    │  Extracts + structures     │     │
│  │ to specialist   │    │  billing / medical records │     │
│  │ agents          │    └────────────┬───────────────┘     │
│  └─────────────────┘                │ A2A Handoff          │
│                                     ▼                        │
│                          ┌──────────────────────────┐       │
│                          │ Client Comms Agent       │       │
│                          │ /api/agents/client-comms │       │
│                          │                          │       │
│                          │ Drafts client-facing     │       │
│                          │ updates using Evidence   │       │
│                          │ Sorter output            │       │
│                          └──────────────────────────┘       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         Continuous Watcher Loop                    │   │
│  │         /api/loop/tick  (polled continuously)      │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                Human-in-the-Loop Approval                   │
│                                                             │
│  Attorneys review AI proposals with confidence scores       │
│  before any action is executed                             │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│          Supabase (PostgreSQL) + Neon Serverless            │
│          Tasks · Messages · Approvals · Audit Logs         │
└─────────────────────────────────────────────────────────────┘
```

---

## Agent Breakdown

| Agent | Route | Responsibility |
|---|---|---|
| Classifier | `/api/classify` | Analyzes incoming messages and routes to appropriate specialist agent |
| Evidence Sorter | `/api/agents/evidence-sorter` | Extracts and structures billing records, medical records, evidence |
| Client Comms | `/api/agents/client-comms` | Drafts client-facing updates; consumes Evidence Sorter output (A2A) |
| Orchestrator | `/api/orchestrator/run` | Dispatches agents in parallel; coordinates multi-agent pipeline |
| Watcher Loop | `/api/loop/tick` | Continuous polling for new messages to process |
| Ingest | `/api/ingest` | Message ingestion endpoint |

---

## API Routes

| Endpoint | Purpose |
|---|---|
| `POST /api/ingest` | Ingest new client communications |
| `POST /api/classify` | Classify and route a message |
| `POST /api/agents/evidence-sorter` | Run evidence extraction |
| `POST /api/agents/client-comms` | Generate client communication draft |
| `POST /api/orchestrator/run` | Trigger full multi-agent pipeline |
| `GET /api/loop/tick` | Watcher loop tick (polls for pending work) |

---

## Pages & UI

| Page | Description |
|---|---|
| `/inbox` | Message ingestion feed; classified communications |
| `/tasks` | Orchestration dashboard; control watcher loop on/off |
| `/approvals` | Attorney review queue with confidence scores per AI action |
| `/audit` | Full timeline: loop ticks, agent-to-agent handoffs, parallel dispatches |
| `/telemetry` | Live ADK metrics (latency, agent calls, error rates) |

---

## Human-in-the-Loop Flow

```
1. New client message arrives → /api/ingest
2. Classifier routes to specialist agents
3. Agents produce structured proposals + confidence scores
4. Proposals queued in /approvals for attorney review
5. Attorney approves/rejects each action
6. Approved actions execute; all steps logged to /audit
```

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Google Gemini 2.5 Pro API access |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `TP_USE_MOCKS` | `true` to skip live Gemini calls (dev mode) |

---

## Deployment

| Concern | Platform |
|---|---|
| Frontend + API Routes | Vercel |
| Database | Supabase Cloud (PostgreSQL) |
| Serverless DB (alt) | Neon serverless |
