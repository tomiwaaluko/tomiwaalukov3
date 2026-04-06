# TenderPilot — AI Legal Case Management Platform — Project Overview

## Project Purpose

**TenderPilot** is an AI-powered legal case management platform built to demonstrate advanced multi-agent orchestration using Google's Agent Development Kit (ADK) principles. It transforms raw client communications (emails, messages, documents) into structured, actionable tasks through a coordinated system of specialized AI agents.

Built for the **Google AI Hackathon 2025**, the system addresses the workflow bottleneck law firms face when processing high volumes of unstructured client communication: evidence records, billing disputes, client updates, and intake routing — tasks that currently require paralegal time to read, classify, and distribute.

Core capabilities:
- **Evidence Sorter Agent** — extracts and structures billing or medical records from uploaded documents
- **Client Communications Agent** — drafts professional client update letters with appropriate legal tone
- **Classifier Agent** — routes incoming messages to the appropriate specialist (billing, intake, litigation, etc.)
- **Orchestrator** — dispatches all agents in parallel, tracks each step, and surfaces results to the attorney
- **Human-in-the-loop** — attorneys review and approve AI proposals before they are acted upon
- **Audit timeline** — every agent action is logged with timestamps for compliance and review
- **Live telemetry dashboard** — real-time task metrics showing agent performance and pipeline throughput

---

## Tech Stack & Rationale

| Layer | Technology | Version | Role |
|---|---|---|---|
| Framework | Next.js | 16 | Full-stack React; API routes host the agent orchestration logic |
| UI runtime | React | 19.2 | Component model for the dashboard and case management UI |
| Language | TypeScript | — | Type safety across agent interfaces, API contracts, and DB schemas |
| Styling | Tailwind CSS | — | Utility-first; modern gradient UI with Framer Motion animations |
| AI model | Google Gemini 2.5 Pro | — | Powers all four agents; multimodal for document/image evidence parsing |
| Database | Supabase (PostgreSQL) | — | Case records, audit log, agent task queue, confidence scores |
| Animations | Framer Motion (lucide-react icons) | — | Smooth agent status transitions and audit timeline reveals |
| Deployment | Vercel | — | Serverless Next.js API routes; Supabase Cloud for DB |
| Cloud provider config | Azure | — | `.azure/` directory present; Azure integration for enterprise deployments |

**Why Google Gemini 2.5 Pro:** The hackathon's theme required showcasing Google's ADK. Gemini 2.5 Pro's multimodal capability (reading both text and document images) is needed for the Evidence Sorter agent, which must parse scanned medical records and billing PDFs — not just plain text.

**Why Next.js API routes for agent orchestration:** ADK agents are stateless async functions. Next.js API routes in the `app/api/` directory are a natural home for the orchestrator — they run server-side (keeping Gemini API keys out of the browser), support async/await, and can call each agent in parallel using `Promise.all`.

---

## Architecture Overview

```
tenderpilot/
├── app/
│   ├── layout.tsx              # Root layout: Tailwind globals, metadata
│   ├── page.tsx                # Dashboard home: active cases, telemetry widgets
│   └── api/                   # Server-side agent orchestration endpoints
│       └── (agent routes)     # Orchestrator, Evidence Sorter, Classifier, Comms
├── components/                 # UI components
│   ├── (case management UI)   # Case cards, agent status indicators, audit timeline
│   ├── (telemetry dashboard)  # Task metrics, throughput charts
│   └── (approval UI)          # Attorney review and approval dialogs
├── lib/                        # Shared utilities
│   ├── gemini.ts              # Gemini API client + prompt templates per agent
│   ├── supabase.ts            # Supabase client for case/audit DB access
│   └── agents/                # Agent logic (Evidence Sorter, Comms, Classifier, Orchestrator)
├── public/                     # Static assets
├── schema.sql                  # Supabase table definitions
│                               #   - cases, tasks, audit_log, confidence_scores
├── .azure/                     # Azure deployment configuration
├── OPTIMIZATION_REPORT.md      # Performance optimization notes
├── RESUME_PROJECT_DESCRIPTION.md  # Hackathon project summary for portfolio
├── SETUP.md                    # Environment setup instructions
├── TASKS_COMPLETE.md           # Development milestone log
├── next.config.ts              # Next.js configuration
└── package.json                # Dependencies
```

### Agent Architecture

All four agents follow the same pattern:
1. Receive a structured input (message text, document URL, or case ID) via the API route
2. Construct a task-specific prompt and call `gemini.generateContent()`
3. Parse the structured JSON response
4. Write results + confidence score to Supabase
5. Return to the Orchestrator

The **Orchestrator** dispatches all agents via `Promise.all([...agentCalls])`, meaning Evidence Sorter, Classifier, and Client Comms run in parallel for each incoming case item. This parallel execution is a core ADK pattern: agent-to-agent (A2A) communication via the Orchestrator's result aggregation.

### Human-in-the-Loop Flow

```
Client communication arrives
    → Orchestrator dispatches all agents in parallel
    → Agents produce proposals + confidence scores
    → Results stored in Supabase with status: "pending_approval"
    → Attorney dashboard shows proposals with confidence indicators
    → Attorney approves or rejects each proposal
    → Approved proposals execute (email drafted, evidence filed, case routed)
    → Every step logged to audit_log table
```

### Database Schema (`schema.sql`)

- **cases** — case ID, client name, status, assigned attorney, created_at
- **tasks** — task ID, case ID, agent type, input, output, confidence score, status (pending/approved/rejected), created_at
- **audit_log** — immutable append-only log: task ID, agent name, action, timestamp
- **confidence_scores** — per-agent confidence ratings stored separately for the telemetry dashboard

---

## Setup & Install Steps

See `SETUP.md` in the repo root for the complete guide. Summary:

### Prerequisites
- Node.js 18+
- A Supabase project
- A Google AI Studio API key (Gemini 2.5 Pro access)

```bash
git clone https://github.com/tomiwaaluko/tenderpilot.git
cd tenderpilot
npm install
```

Create a `.env.local` file:
```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
GOOGLE_GEMINI_API_KEY=<gemini-api-key>
```

Apply the database schema:
```sql
-- Run schema.sql in the Supabase SQL editor
```

```bash
npm run dev      # → http://localhost:3000
npm run build
npm run start
npm run lint
```

---

## Notable Implementation Decisions

### Parallel agent dispatch as the core ADK pattern
The Orchestrator fires all agents simultaneously using `Promise.all`, not sequentially. This demonstrates the ADK's "parallelism" principle: the Evidence Sorter, Classifier, and Comms agents all process the same incoming case item at once, with their outputs merged by the Orchestrator. Total latency is bounded by the slowest agent rather than the sum of all agents.

### Confidence scoring on every AI proposal
Every agent response includes a numeric confidence score (0–1) stored in the `confidence_scores` table. The attorney dashboard renders these visually (e.g., color-coded indicators) so attorneys can prioritize low-confidence proposals for manual review. This is a safety-first design: the system degrades gracefully when Gemini is uncertain rather than proceeding automatically.

### Immutable audit log
Every agent action writes to `audit_log` as an append-only record. No UPDATE or DELETE operations are allowed on this table (enforced via Supabase RLS: `USING (false)` for update/delete policies). This gives attorneys and compliance officers a tamper-proof record of every AI decision for malpractice protection.

### Gemini 2.5 Pro for multimodal evidence parsing
The Evidence Sorter agent uses Gemini's vision capability to parse uploaded document images (scanned PDFs, photos of medical bills). The prompt instructs it to extract structured JSON: `{ document_type, date, amount, parties, key_findings }`. Using a multimodal model eliminates the need for a separate OCR service (no Tesseract or AWS Textract), simplifying the architecture.

### OPTIMIZATION_REPORT.md documents performance decisions
Rather than leaving performance choices implicit, the project documents them explicitly in `OPTIMIZATION_REPORT.md`. For a hackathon project demonstrated to judges, this transparency about tradeoffs (e.g., "parallel dispatch reduces P95 latency by ~60% vs sequential") is also a presentation asset.

### `.azure/` for enterprise deployment path
The presence of `.azure/` configuration suggests the project was designed with an enterprise deployment path in mind — law firms often require Azure over public cloud services for compliance reasons. The Vercel deployment is for demo/development; Azure would be the production target for a real firm.


## Resume Bullet Points

- Architected a multi-agent AI platform for legal case management using Google's Agent Development Kit (ADK) principles, implementing parallel agent dispatch via Promise.all for an Evidence Sorter, Classifier, and Client Communications Agent powered by Gemini 2.5 Pro.
- Built a human-in-the-loop attorney approval workflow with per-agent confidence scoring and an append-only Supabase audit log (RLS-enforced: no UPDATE/DELETE), providing tamper-proof compliance records for every AI decision.
- Delivered a production-deployed Next.js 16 + Gemini 2.5 Pro application on Vercel for the Google AI Hackathon 2025, featuring a live telemetry dashboard and multimodal evidence parsing for scanned medical records and billing documents.
