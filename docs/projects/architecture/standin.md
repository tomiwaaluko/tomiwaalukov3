# StandIn — System Design Architecture

## Overview
StandIn is an AI agent network built for LA Hacks 2026. It replaces the need to attend status meetings by sending an intelligent agent in your place. A network of Fetch.ai uAgents gathers live status from Slack, Jira, and Calendar; detects contradictions across teams; retrieves historical decisions via RAG; and executes approved actions — all coordinated through Fetch.ai Agentverse and surfaced via ASI:One. Every claim is backed by an Evidence Passport so users always know where information came from.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Agent Framework | Fetch.ai uAgents 0.22.5 |
| Agent Marketplace | Fetch.ai Agentverse (hosted mailboxes + discovery) |
| Chat Interface | ASI:One (user-facing entry point) |
| LLM | Google Gemini `gemini-2.5-flash` |
| Embeddings | Gemini `text-embedding-004` (768-dim) |
| RAG / Vector Search | MongoDB Atlas Vector Search (cosine similarity) |
| Database | MongoDB Atlas |
| Voice | ElevenLabs (30-second spoken executive brief) |
| External APIs | Slack · Jira · Google Calendar · Gmail (currently stubbed) |
| Runtime | Python 3.11 · local venv |
| LangGraph | `langchain` 0.3.23 · `langgraph` 0.3.20 |

---

## Architecture Diagram

```
User / ASI:One
      │  (Chat Protocol)
      ▼
┌─────────────────────────────────────────────────────┐
│        Orchestrator Agent (port 8000)               │
│                                                     │
│  Gemini classifies intent → one of 5 types:         │
│  1. Status query      → Status Agent               │
│  2. Conflict check    → Status Agent               │
│  3. Action request    → Perform Action Agent        │
│  4. History query     → Historical Agent            │
│  5. Briefing request  → Status Agent               │
└────────┬─────────────────┬──────────────┬───────────┘
         │ FullBriefRequest │ RAGRequest   │ ActionRequest
         ▼                  ▼              ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
│ Status Agent │  │ Historical   │  │ Perform Action   │
│ (port 8007)  │  │ Agent        │  │ Agent (port 8008) │
│              │  │ (port 8009)  │  │                  │
│ 4-phase:     │  │ 3-tier RAG:  │  │ 8 action types   │
│ Gather       │  │ 1. Vector    │  │ Approval gate    │
│ Synthesise   │  │    search    │  │ REST endpoints   │
│ Contradict   │  │ 2. BM25      │  │ Audit log        │
│ Passports    │  │ 3. Gemini    │  │                  │
└──────┬───────┘  └──────────────┘  └──────────────────┘
       │                  │                   │
       └──────────────────┴───────────────────┘
                          │
              ┌───────────▼───────────┐
              │    MongoDB Atlas      │
              │  (database: standin) │
              └───────────────────────┘

Watchdog Agent (port 8010)
  → Polls Status Agent every 30 min
  → On change → draft_slack via Perform Action
  → Stores snapshots in standin.watchdog_snapshots
```

---

## Agent Roster

| Agent | Port | File | Purpose |
|---|---|---|---|
| Orchestrator | 8000 | `backend/agents/orchestrator/agent.py` | Intent classification + routing |
| Status Agent | 8007 | `backend/agents/status_agent/agent.py` | Gather + synthesise + contradict + passports |
| Perform Action | 8008 | `backend/agents/perform_action/agent.py` | Execute actions + human approval gate |
| Historical Agent | 8009 | `backend/agents/historical_agent/agent.py` | RAG — historical Q&A |
| Watchdog Agent | 8010 | `backend/agents/watchdog_agent/agent.py` | Proactive monitoring + alerts |

---

## Intent Classification

The Orchestrator uses Gemini to classify every incoming message before routing. Extracted fields: `intent_type`, `teams`, `topic`, `time_window`, `action_type`, `parties`.

| Intent | Name | Routes to | Example |
|---|---|---|---|
| 1 | Status query | Status Agent | "What is engineering working on?" |
| 2 | Conflict check | Status Agent | "Is GTM aligned with engineering on the launch date?" |
| 3 | Action request | Perform Action | "Schedule a call between Alice and Carol" |
| 4 | History query | Historical Agent | "What was decided in last week's launch sync?" |
| 5 | Briefing request | Status Agent | "Give me a morning brief" |

---

## Status Agent — Four-Phase Pipeline

1. **Gather** — parallel async queries per role (Slack stubs, Jira stubs, local RAG keyword search)
2. **Synthesise** — parallel Gemini synthesis per role; falls back to seeded hardcoded data if Gemini is unavailable
3. **Contradict** — rule engine (always fires) + optional Gemini enrichment; rules are authoritative on `escalation_required`
4. **Passports** — Evidence Passport generated for every high-risk or contradicted claim

Stores per-user conversation history in `standin.brief_history`. Detects deltas (status changes, new blockers, confidence drops > 0.10) on repeated calls for the same user.

---

## Evidence Passport

Every Status Agent output stamps each claim with a passport. This is the core feature that distinguishes StandIn from a generic chatbot.

```json
{
  "claim": "...",
  "source": "...",
  "owner": "...",
  "timestamp": "...",
  "confidence": "high | medium | low",
  "contradictions": ["..."],
  "recommended_action": "...",
  "escalation_required": true
}
```

---

## Perform Action — Action Types

| Action | Approval Required? |
|---|---|
| `send_email` | Yes |
| `send_slack` | Yes |
| `schedule_meeting` | Yes |
| `draft_slack` | No |
| `create_jira` | No |
| `update_jira_status` | No |
| `create_action_item` | No (live — writes to MongoDB) |
| `post_brief` | No (live — writes to MongoDB) |

Approval-required actions are saved to `standin.pending_approvals`. REST endpoints on port 8008:
- `GET /graph` — user interaction graph
- `GET /approvals` — list pending approvals
- `POST /approvals/approve` — approve + execute
- `POST /approvals/reject` — reject

---

## Historical Agent — Three-Tier RAG

| Tier | Method | Requires |
|---|---|---|
| 1 | MongoDB Atlas Vector Search (768-dim cosine) | `MONGODB_URI` + `GEMINI_API_KEY` + vector index |
| 2 | BM25-style keyword search across 25 seed docs | Nothing — always available |
| 3 | Gemini synthesis with no context | `GEMINI_API_KEY` |

Corpus: 12 seed JSON files + 5 Slack messages + 5 Jira tickets + 3 Calendar events = 25 docs total.

---

## MongoDB Collections (database: `standin`)

| Collection | Purpose | Seeded? | Live Writes? |
|---|---|---|---|
| `documents` | RAG corpus — 25 docs + embeddings | Yes | No |
| `agent_profiles` | User/agent identity | Yes | No |
| `meetings` | Calendar events | Yes | No |
| `interactions` | Graph edges (Slack, Jira, meetings) | Yes | No |
| `brief_history` | Conversation memory per user | No | Yes — status_agent |
| `action_items` | Actions from perform_action | No | Yes — perform_action |
| `evidence_passports` | Stored briefs | No | Yes — perform_action |
| `pending_approvals` | Actions awaiting human approval | No | Yes — perform_action |
| `action_log` | Audit log of all actions | No | Yes — perform_action |
| `watchdog_snapshots` | Periodic status snapshots | No | Yes — watchdog |

---

## File Structure

```
standin/
├── backend/
│   ├── agents/
│   │   ├── orchestrator/agent.py       # Intent classification + routing
│   │   ├── status_agent/agent.py       # Gather → synthesise → contradict → passports
│   │   ├── perform_action/agent.py     # Actions + approval gate + graph API
│   │   ├── historical_agent/agent.py   # RAG historical Q&A
│   │   └── watchdog_agent/agent.py     # Proactive monitoring + alerts
│   ├── data/
│   │   ├── company_data.py             # Seeded NovaLoop demo data
│   │   ├── seed_db.py                  # MongoDB seeder + embedding generator
│   │   └── seed/                       # 12 JSON seed documents
│   ├── models.py                       # Shared uAgents message models
│   ├── main.py                         # Local Bureau launcher
│   └── test_orchestrator.py            # One-shot Chat Protocol test harness
├── frontend/                           # (not yet built)
├── .env                                # API keys (project root)
└── CLAUDE.md
```

---

## Registered Agent Addresses

| Agent | Agentverse Address |
|---|---|
| Orchestrator | `agent1qg806566n3lkkceend90ung744z7vst3v3n8nx9zvjve6cc74cstq9mlkth` |
| Status Agent | `agent1q2l8xf3dvwvmarl2dpxwtv5ym7pvge53szhstykukmrwuhm93z6k68tphgh` |
| Perform Action | `agent1qf83fffdv22j2etuqarww9nwqcenq5zavvekh7k2utflqaxx08j4x38e69v` |
| Historical Agent | `agent1qf60yzmr9reyjnduq8qneum5nf03zzaw60cl6yny9l7la676unf7jdfdtrv` |
| Watchdog Agent | `agent1q0pt4zqv2z2fhe7e25w3pfdkjrh6fqzmu4lplkw0tp3uvkhlqmmful2h754` |

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `ASI_ONE_API_KEY` | ASI:One API key |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `GEMINI_API_KEY` | Google Gemini API key |
| `ELEVENLABS_API_KEY` | ElevenLabs voice brief |
| `ORCHESTRATOR_SEED` | Stable seed for Orchestrator address |
| `STATUS_AGENT_SEED` | Stable seed for Status Agent |
| `PERFORM_ACTION_SEED` | Stable seed for Perform Action |
| `HISTORICAL_AGENT_SEED` | Stable seed for Historical Agent |
| `WATCHDOG_SEED` | Stable seed for Watchdog |

---

## Running Locally

```bash
.venv\Scripts\activate

# Seed MongoDB (once)
python backend/data/seed_db.py

# Start the full local agent topology
python backend/main.py

# Test a single orchestrator query
python backend/test_orchestrator.py "Give me a briefing on Launch Alpha readiness."
```
