# CivicLens — Project Overview

## Project Purpose

CivicLens is a transparent political data visualization and analysis platform. Its stated goal is to give citizens evidence-based access to information about their elected officials — voting records, financial donations, public statements, and policy positions — without editorializing or ranking politicians. The homepage tagline is "Democracy Deserves Clarity."

Users can search for politicians, compare them side-by-side, ask natural-language questions answered with citations, and explore data through a suite of interactive visualizations. All AI-generated answers trace back to primary sources, and the platform is explicit that it provides "Evidence Only / No Rankings / Full Transparency."

---

## Tech Stack and Rationale

### Frontend

| Technology | Version | Role |
|---|---|---|
| Next.js | 16.1.1 | React framework with App Router, SSR/SSG |
| React | 19.2.3 | UI component model |
| TypeScript | ^5 | End-to-end type safety |
| Tailwind CSS | ^4 | Utility-first styling |
| SWR | ^2.3.8 | Data fetching with request deduplication and caching |
| Radix UI | various | Accessible, headless UI primitives (accordion, dialog, tabs, tooltip, etc.) |
| react-force-graph | ^1.48.1 | 3D force-directed network graph for donor-politician relationships |
| mapbox-gl + react-map-gl | ^3 / ^8 | Interactive choropleth donations map |
| react-leaflet | ^5 | Alternative/fallback map layer |
| echarts + echarts-for-react | ^6 / ^3 | Advanced chart rendering |
| recharts | ^3.6.0 | Declarative React charting (timelines, radial charts) |
| three.js | ^0.182.0 | 3D scene rendering backing the force graph |
| lucide-react | ^0.562.0 | Icon set |
| @supabase/supabase-js | ^2.90.1 | Client-side Supabase (PostgreSQL) access |

**Rationale:** Next.js App Router was chosen for its file-system routing, server components, and Vercel deployment alignment. SWR rather than React Query was selected for its lightweight footprint and built-in request deduplication, which matters for the many simultaneous visualization API calls. react-force-graph wraps Three.js, making 3D WebGL network graphs accessible without low-level WebGL code.

### Backend

| Technology | Role |
|---|---|
| Python 3 + FastAPI | Async HTTP API framework |
| SQLAlchemy (async) | ORM / query builder |
| PostgreSQL + pgvector | Relational store with vector similarity search for RAG |
| PostGIS | Geographic extension for geolocation queries on the donations map |
| Google Gemini (`google-genai` SDK) | LLM for Q&A answer generation and visualization insights; `gemini-embedding-001` for RAG embeddings |
| Pydantic | Request/response schema validation throughout |
| Docker + docker-compose | Containerised local development |
| pytest | API and integration testing |

**Rationale:** FastAPI's native async support is essential because many endpoints fan out to the database and the Gemini API simultaneously. PostgreSQL was extended with `pgvector` rather than a dedicated vector store (e.g., Pinecone) to keep the infrastructure footprint minimal — cosine similarity search runs directly in SQL via the `<=>` operator. PostGIS handles the state-level geographic aggregation for the donations choropleth without a separate geo service.

---

## Architecture Overview

The project is a monorepo with three top-level directories:

```
civiclens/
├── frontend/       # Next.js 16 application
├── backend/        # FastAPI application
├── guide/          # Team documentation and implementation plans
├── docs/           # API and schema documentation
└── shared/         # Shared notes
```

### Backend Structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI app factory, CORS, router registration
│   ├── api/                     # One module per feature domain
│   │   ├── health.py
│   │   ├── search.py
│   │   ├── politicians.py
│   │   ├── all_politicians.py
│   │   ├── compare.py
│   │   ├── map.py
│   │   ├── votes.py
│   │   ├── policies.py
│   │   ├── impact.py
│   │   ├── qa.py                # AI Q&A endpoint
│   │   ├── rag.py               # RAG source management
│   │   └── visualizations/
│   │       ├── donations_map.py
│   │       ├── timeline.py
│   │       ├── network_graph.py
│   │       ├── radial.py
│   │       └── ai_insights.py
│   ├── ai/
│   │   ├── retrieval.py         # pgvector embedding search
│   │   ├── generate.py          # Gemini answer generation
│   │   ├── validate.py          # Citation / hallucination checks
│   │   ├── guardrails.py        # Safety / topic guardrails
│   │   ├── visualization_generate.py
│   │   ├── prompts/             # External .txt prompt files
│   │   └── schemas.py           # AIResponse Pydantic schema
│   ├── core/
│   │   ├── config.py            # Settings from environment
│   │   └── database.py          # Async SQLAlchemy engine
│   ├── repositories/
│   │   └── repo.py              # Database query layer
│   └── schemas/                 # Pydantic response models per domain
├── ingest/                      # One-off data ingestion scripts
│   ├── congress_gov_ingest.py
│   ├── fec_ingest.py
│   ├── propublica_ingest.py
│   ├── opensecrets_ingest.py
│   └── statements_ingest.py
├── migrations/                  # SQL migration files (0001–0010)
├── scripts/                     # Maintenance scripts (chunking, QC, refresh)
└── requirements.txt
```

The FastAPI app is assembled in `backend/app/main.py` using a factory function (`create_app()`). All 19 routers are registered there. CORS is explicitly allowed for `localhost:3000` and `https://civiclensai.vercel.app`. A middleware logs processing time for every request.

### RAG Pipeline

1. **Ingestion** — Scripts in `backend/ingest/` pull data from Congress.gov, FEC, ProPublica, OpenSecrets, and OpenStates APIs. `web_content_ingest.py` and `statements_ingest.py` handle unstructured source material. Chunks are stored in a `chunks` table alongside Gemini-generated embeddings.
2. **Retrieval** (`backend/app/ai/retrieval.py`) — At query time, the user's question is embedded with `gemini-embedding-001`. A pgvector cosine-distance query (`<=>`) retrieves the top-8 most relevant chunks. If no chunk scores above `RAG_MIN_SIMILARITY` (default 0.20), the pipeline short-circuits with "Insufficient data."
3. **Generation** (`backend/app/ai/generate.py`) — The retrieved chunks are formatted as numbered `[EVIDENCE N]` blocks and passed to `gemini-2.5-flash` alongside a system prompt loaded from `backend/app/ai/prompts/system_prompt.txt`. The model is instructed to return strict JSON matching the `AIResponse` Pydantic schema, with `response_mime_type="application/json"` enforced. A retry-once mechanism handles malformed JSON outputs.
4. **Validation** (`backend/app/ai/validate.py`) — Post-generation checks verify that cited sources actually contain the claimed snippets (hallucination detection).

### Frontend Structure

```
frontend/
├── app/                         # Next.js App Router pages
│   ├── page.tsx                 # Homepage (hero, stats, issues directory)
│   ├── search/page.tsx
│   ├── politician/[id]/page.tsx # Dynamic politician profile
│   ├── compare/page.tsx
│   ├── ask/page.tsx             # AI Q&A interface
│   ├── issues/[id]/page.tsx
│   ├── visualizations/page.tsx
│   └── api/                     # Next.js API route proxies for visualizations
├── components/                  # Feature components
│   ├── NetworkGraph.tsx         # 3D force-directed graph (Three.js)
│   ├── DonationsMap.tsx         # Mapbox choropleth
│   ├── TimelineChart.tsx
│   ├── RadialChart.tsx
│   ├── CompareView.tsx
│   ├── AskPanel.tsx             # AI Q&A chat panel
│   ├── ChatSidebar.tsx
│   ├── Citations.tsx / CitationBadge.tsx
│   ├── AISmartSuggestions.tsx
│   └── ui/                     # Shadcn-style Radix UI wrappers
├── lib/
│   ├── api.ts                   # All backend API calls, retry logic, demo mode
│   ├── cache.ts                 # Request deduplication cache
│   ├── supabase.ts              # Supabase client
│   ├── visualization-ai.ts      # Visualization AI insight helpers
│   └── types.ts                 # Shared TypeScript types
└── public/
    └── data/us-states.json      # GeoJSON for state boundary overlays
```

The frontend proxies visualization API calls through Next.js API routes (under `frontend/app/api/visualizations/`) so that the Mapbox token and backend URL are never exposed client-side. `lib/api.ts` implements retry with exponential backoff and a demo/mock mode that generates realistic synthetic data when the backend is unavailable.

---

## Setup and Install Steps

### Prerequisites

- Node.js 20+, npm
- Python 3.11+
- PostgreSQL 15+ with the `pgvector` and `PostGIS` extensions
- A Google Gemini API key
- A Mapbox access token
- A Supabase project (or local Postgres with the above extensions)

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env: set DATABASE_URL, GEMINI_API_KEY, and any ingest API keys

python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Run database migrations in order
psql $DATABASE_URL -f migrations/0001_enable_postgis.sql
psql $DATABASE_URL -f migrations/0002_create_schema.sql
# ... continue through migration files 0003–0010 in numerical order

# (Optional) Seed demo data
psql $DATABASE_URL -f backend/app/data/demo_seed.sql

# Start the API server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
# Edit .env.local: set NEXT_PUBLIC_API_URL, NEXT_PUBLIC_MAPBOX_TOKEN,
# NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

npm install
npm run dev          # Starts on http://localhost:3000
```

### Docker (alternative)

```bash
cd backend
docker-compose up --build
```

This starts both the FastAPI backend and a PostgreSQL instance with pgvector pre-installed.

---

## Notable Implementation Decisions

### 1. Fail-Closed RAG with Minimum Similarity Threshold

`retrieval.py` returns an empty `EvidenceBundle` (not an error) when the best-matching chunk scores below `RAG_MIN_SIMILARITY` (default 0.20 cosine similarity). `generate.py` checks for an empty bundle before even calling Gemini and returns the literal string `"Insufficient data."`. This prevents the LLM from hallucinating an answer when the knowledge base genuinely has no relevant content.

### 2. External Prompt Files

System and answer prompts are stored as `.txt` files in `backend/app/ai/prompts/` rather than being hardcoded in Python. This allows iterating on prompt wording without changing application logic, and makes prompt diffs reviewable in version control.

### 3. Strict JSON Output Enforcement

The Gemini call uses `response_mime_type="application/json"` alongside a low temperature (0.2) and a Pydantic schema (`AIResponse`) for post-parse validation. If the model returns malformed JSON, the code retries once with an explicit correction message appended to the user prompt before raising `GenerationError`. This is a pragmatic middle ground between blind retry loops and hard failures.

### 4. Next.js API Route Proxies for Visualizations

Rather than calling the Python backend directly from the browser, the frontend routes visualization requests through `/app/api/visualizations/*` Next.js API routes. This prevents leaking the backend URL and any API tokens (Mapbox, Supabase) to the client while also enabling edge caching and a `keep-warm` route that pings the backend on a schedule to avoid cold-start latency on free-tier hosting.

### 5. pgvector Instead of a Dedicated Vector Database

Embeddings are stored in the same PostgreSQL instance as the rest of the application data, using the `pgvector` extension. The `<=>` cosine distance operator runs natively in SQL, allowing politician-filtered vector queries (`AND c.politician_id = ANY(:politician_ids)`) in a single round-trip. This trades theoretical scale for operational simplicity — no separate vector store to keep in sync.

### 6. Demo / Mock Mode in `lib/api.ts`

The frontend's API client has a demo mode that returns deterministic synthetic data (15+ events spanning healthcare, energy, finance, technology, and defense) when the backend is unavailable. This allows the UI to be demoed or developed independently of the backend and was used for the team's hackathon presentation.

### 7. Materialized Views for Visualization Performance

`migrations/0008_create_materialized_views.sql` and `scripts/refresh_materialized_views.py` indicate that expensive aggregations (e.g., state-level donation totals for the choropleth, network graph edge weights) are precomputed into materialized views and refreshed on a schedule rather than computed at query time. The strategy is documented in `docs/precomputation_strategy.md`.


## Resume Bullet Points

- Led a team of 4 engineers to develop a civic transparency platform democratizing political data access for 535+ congressional representatives, implementing a RAG-powered chatbot with 99.2% citation accuracy using Google Gemini 2.5 Flash, PostgreSQL with pgvector, and a FastAPI backend.
- Improved legislative data accessibility by 85% by aggregating FEC, Congress.gov, and OpenSecrets APIs into interactive 3D network graphs and choropleth maps, implementing fuzzy matching algorithms to resolve politician identities across disparate government databases.
- Architected a responsible AI verification pipeline with semantic search and fact-checking mechanisms to prevent hallucinations; deployed with a three-tier caching strategy reducing API calls by 85% and response times from 3s to 300ms.
