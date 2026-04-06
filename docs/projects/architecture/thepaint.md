# The Paint — System Design Architecture

## Overview
Machine learning system that predicts NBA player and team statlines for any given matchup. Powers player stat predictions, team game projections, sports betting over/under probability distributions, and fantasy game scoring (DraftKings, FanDuel, Yahoo).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend Language | Python 3.11+ |
| Web Framework | FastAPI (async) |
| ML Models | XGBoost 2.0 + LightGBM 4.3 |
| Feature Engineering | scikit-learn pipelines |
| Data Processing | pandas 2.2, polars 0.20 |
| Probabilistic Output | MAPIE 0.8 + quantile regression |
| Experiment Tracking | MLflow 2.10 |
| Hyperparameter Tuning | Optuna 3.6 |
| Database | PostgreSQL 15 + TimescaleDB |
| ORM | SQLAlchemy 2.0 (async) + Alembic |
| Caching | Redis 5.0 (15-min TTL) |
| Task Scheduling | Apache Airflow (local) · Railway Cron Jobs (prod) |
| Data Source | nba_api 1.4 (NBA official stats) · Odds API |
| Frontend | React 19 + Recharts 3.4 + Tailwind CSS |
| Deployment | Railway (all services) · Supabase PostgreSQL |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Data Ingestion Layer                     │
│  nba_api (game logs) · Odds API (lines) · Injury feeds     │
│                 Daily @ 8 AM ET                             │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                Feature Engineering Pipeline                 │
│  rolling.py    · opponent.py   · situational.py            │
│  roster.py     · pipeline.py                               │
│  (all accept as_of_date to prevent data leakage)           │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   ML Training Layer                         │
│  One XGBoost/LightGBM regressor per stat:                  │
│  pts · reb · ast · stl · blk · to_committed · fg3m        │
│  Walk-forward validation (train 2015-2022, val 2023)       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Model Registry (MLflow)                        │
│         Loaded from disk in production                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         FastAPI Prediction Service (Railway)                │
│                                                             │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐  │
│  │ /players   │  │ /teams     │  │ /games · /props      │  │
│  │ /predict   │  │ /predict   │  │ /fantasy/optimize    │  │
│  └────────────┘  └────────────┘  └──────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          Redis Cache (15-min TTL)                   │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │
               ┌────────────┴────────────┐
               ▼                         ▼
┌──────────────────────────┐  ┌──────────────────────────────┐
│  Betting Module          │  │  Fantasy Module              │
│  over_under.py           │  │  scoring.py (DK/FD/Yahoo)    │
│  edge.py (EV calc)       │  │  simulation.py (lineup opt.) │
└──────────────────────────┘  └──────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│           React Dashboard Frontend (Railway)                │
│           Recharts visualizations · Tailwind CSS            │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema (PostgreSQL)

```sql
players       (player_id, name, team_id, position, height_inches, weight_lbs, birth_date, is_active)
teams         (team_id, name, abbreviation, conference, division, arena, city)
games         (game_id, date, season, home_team_id, away_team_id, is_playoffs, status)

player_game_logs
  (log_id, game_id, player_id, team_id, min_played, pts, reb, ast, stl, blk,
   to_committed, fgm, fga, fg3m, fg3a, ftm, fta, plus_minus, starter)

team_game_logs
  (log_id, game_id, team_id, pts, pace, off_rtg, def_rtg, ts_pct, ast,
   to_committed, oreb, dreb, fg3a_rate)

injuries      (injury_id, player_id, report_date, game_id, status, description, source)

betting_lines (line_id, game_id, player_id, sportsbook, market, line, over_odds, under_odds, timestamp)

predictions
  (pred_id, game_id, player_id, model_version, as_of_ts, stat,
   p10, p25, p50, p75, p90, created_at)
```

---

## Core Modules (`chalk/`)

| Module | Files | Purpose |
|---|---|---|
| `ingestion/` | `nba_fetcher.py`, `odds_fetcher.py`, `injury_fetcher.py` | Fetch + UPSERT all game/odds/injury data |
| `features/` | `rolling.py`, `opponent.py`, `situational.py`, `roster.py`, `pipeline.py` | Generate 60+ features per player-game |
| `models/` | `base.py`, `player.py`, `team.py`, `registry.py` | Train and serve XGBoost/LightGBM models |
| `predictions/` | `player.py`, `team.py`, `distributions.py` | Inference + quantile probability distributions |
| `betting/` | `over_under.py`, `edge.py` | O/U probability and expected value calculation |
| `fantasy/` | `scoring.py`, `simulation.py` | DK/FD/Yahoo scoring + lineup optimization |
| `api/` | `main.py`, `routes/`, `schemas.py`, `cache.py` | FastAPI app, endpoints, Pydantic schemas, Redis cache |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/v1/players/{id}/predict` | Player stat predictions |
| GET | `/v1/teams/{id}/predict` | Team total predictions |
| GET | `/v1/games/{id}` | Game schedule |
| GET | `/v1/games/{id}/props` | Prop betting lines |
| GET | `/v1/fantasy/optimize` | DFS lineup optimization |
| GET | `/health` | Service health check |

---

## Data Pipeline Schedule

| Job | Time (UTC) | Action |
|---|---|---|
| `ingest` | 07:00 daily | Fetch game logs (2015+), injuries, odds → UPSERT to PostgreSQL |
| `prediction` | 18:00 daily | Run inference on upcoming games → cache in Redis |

---

## Non-Negotiable Engineering Rules

1. **`as_of_date` leakage prevention** — All feature functions accept `as_of_date`; only use data where `game_date < as_of_date`
2. **Idempotent ingestion** — All jobs use UPSERT (`INSERT ... ON CONFLICT DO UPDATE`); never plain INSERT
3. **Async throughout** — All DB calls use asyncpg via SQLAlchemy async sessions; no sync calls in hot path
4. **Time-series validation only** — Walk-forward splits; never random k-fold cross-validation
5. **One model per stat** — Separate regressors for pts, reb, ast, stl, blk, to_committed, fg3m

---

## Target MAE Benchmarks

| Stat | Target MAE | Vegas Baseline |
|---|---|---|
| PTS | ≤ 5.0 | ~4.5 |
| REB | ≤ 2.5 | — |
| AST | ≤ 2.0 | — |
| 3PM | ≤ 1.2 | — |
| Team Total | ≤ 8.0 | — |

---

## Production Deployment (Railway)

| Service | Type | Description |
|---|---|---|
| `web` | Web service | FastAPI prediction API |
| `thepaint` | Web service | React frontend |
| `Redis` | Redis | Shared cache |
| `ingest` | Cron (07:00 UTC) | Daily data ingestion |
| `prediction` | Cron (18:00 UTC) | Daily inference run |

- Database: Supabase PostgreSQL via Session Pooler (required for Railway compatibility)
- Service-to-service calls use Railway private networking: `http://web.railway.internal:8000`
- MLflow **not** deployed in production — models committed to git and loaded from disk
