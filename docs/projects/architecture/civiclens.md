# CivicLens — System Design Architecture

## Overview
Transparent political data visualization and analysis platform that aggregates government data (FEC, Congress.gov, OpenSecrets) and presents it through interactive visualizations with AI-powered RAG insights. The largest and most technically complex project in the portfolio.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | Next.js 16.1.1 + React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | Radix UI + shadcn/ui |
| Visualizations | react-force-graph (3D network) · Mapbox GL · react-leaflet · ECharts · Recharts · Three.js |
| Backend Framework | FastAPI (Python) |
| ORM | SQLAlchemy (async) + asyncpg |
| Database | Supabase (PostgreSQL + pgvector extension) |
| Migrations | Alembic |
| AI / RAG | Google Gemini 2.5 Flash (`google-genai==1.0.0`) + embeddings |
| Fuzzy Matching | RapidFuzz |
| Testing | pytest + integration test scripts |
| Containerization | Docker + docker-compose |
| Deployment | Vercel (frontend) · Docker (backend) |

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│               Next.js 16 Frontend (Vercel)                  │
│                                                              │
│  Choropleth map     → state-by-state donation visualization  │
│  Timeline chart     → bills, votes, statements over time     │
│  3D force graph     → donor-politician relationship network  │
│  Radial chart       → donations broken down by industry      │
│                                                              │
│  Libraries: react-force-graph · mapbox-gl · echarts         │
│             recharts · three.js · react-leaflet             │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTP → NEXT_PUBLIC_API_URL
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                FastAPI Backend (Docker)                      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │  Data Routes │  │  AI / RAG    │  │  Ingest Scripts    │ │
│  │  /politicians│  │  Routes      │  │  ingest/           │ │
│  │  /donations  │  │              │  │  populate_         │ │
│  │  /bills      │  │  Gemini 2.5  │  │  database.py       │ │
│  │  /votes      │  │  Flash       │  │                    │ │
│  └──────────────┘  └──────────────┘  └────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │           SQLAlchemy Async ORM + Alembic               │  │
│  └────────────────────────────────────────────────────────┘  │
└───────────────────────────┬──────────────────────────────────┘
                            │ asyncpg
                            ▼
┌──────────────────────────────────────────────────────────────┐
│           Supabase (PostgreSQL + pgvector)                   │
│                                                              │
│  Politicians · Donations · Bills · Votes · Statements        │
│  Embeddings (pgvector) for semantic search                   │
└──────────────────────────────────────────────────────────────┘
         ▲
         │ Data Ingestion
┌────────┴─────────────────────────────────────────────────────┐
│                    External Data Sources                     │
│  Congress.gov API · FEC API · OpenSecrets API               │
└──────────────────────────────────────────────────────────────┘
```

---

## Monorepo Structure

```
civiclens/
├── frontend/              # Next.js 16 application
│   ├── app/               # App Router pages + API routes
│   ├── components/        # Visualization + UI components
│   └── shared/            # Shared types/utilities
├── backend/               # FastAPI service
│   ├── app/               # FastAPI routes, models, services
│   ├── alembic/           # Database migrations
│   ├── ingest/            # Data ingestion scripts
│   └── populate_database.py
├── shared/                # Cross-service types
├── Dockerfile
└── docker-compose.yml
```

---

## Key Visualizations

| Visualization | Library | Data Shown |
|---|---|---|
| Choropleth donations map | Mapbox GL / react-map-gl | State-by-state campaign donation totals |
| Timeline chart | Recharts / ECharts | Bills introduced, votes cast, public statements over time |
| 3D force-directed network | react-force-graph + Three.js | Donor ↔ Politician relationship graph |
| Radial/hierarchical chart | ECharts | Donations broken down by industry sector |

---

## AI / RAG Pipeline

```
1. Data ingested from FEC/Congress.gov/OpenSecrets
2. Text fields (statements, bill summaries) embedded via Gemini
3. Embeddings stored in PostgreSQL pgvector extension
4. User query → embedded → nearest-neighbor search (pgvector)
5. Retrieved documents passed to Gemini 2.5 Flash as context
6. Gemini generates insight response grounded in real data
```

---

## Data Sources & Ingestion

| Source | Data | Log File |
|---|---|---|
| Congress.gov API | Bills, votes, legislators | `congress_gov_ingest.log` |
| FEC API | Campaign finance, donations | `fec_ingest.log` |
| OpenSecrets API | Donor profiles, industry breakdowns | `ingest.log` |

---

## Environment Variables

**Frontend (`.env.local`):**
| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | FastAPI backend URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |

**Backend (`.env`):**
| Variable | Purpose |
|---|---|
| `DATABASE_URL` | asyncpg connection string |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GEMINI_MODEL` | Model ID (e.g., gemini-2.5-flash) |

---

## Deployment

| Service | Platform |
|---|---|
| Frontend | Vercel (automatic from main branch) |
| Backend | Docker container (self-hosted or cloud) |
| Database | Supabase Cloud (PostgreSQL + pgvector) |

```bash
# Run full stack locally
docker-compose up

# Frontend only
cd frontend && npm run dev

# Backend only
cd backend && uvicorn app.main:app --reload
```
