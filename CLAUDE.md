# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend
```bash
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run lint         # ESLint
npm run preview      # Preview production build
```

### Backend (api/)
```bash
npm run dev:all      # Start both frontend + backend concurrently
npm run server       # Backend only (ts-node api/index.ts)
cd api && npm run build  # Compile TypeScript backend
```

There are no automated tests; the CI pipeline only runs `npm run build` and `cd api && npm run build`.

## Architecture

This is Tomiwa Aluko's personal portfolio — a React + Vite SPA with a separate Express backend.

### Frontend (`src/`)

**Routing** (React Router v6, three active routes):
- `/` → `pages/Home.tsx` — single-page layout composing all sections in order: Hero → About → Timeline → Skills → Projects → DevActivity → Contact → Footer
- `/projects` → `pages/Projects.tsx` — engineering index list
- `/projects/:id` → `pages/ProjectDetail.tsx` — individual project blueprint page

**App-level setup** (`src/App.tsx`):
- Lenis smooth scroll is driven by `gsap.ticker` (not its own RAF) so it stays in sync with GSAP `ScrollTrigger`
- GSAP `ScrollTrigger` is registered globally once
- A full-screen `Loader` component runs on first mount; content fades in when the loader exits
- Page transitions use a GSAP timeline stored in `TransitionContext`

**Contexts** (`src/context/`):
- `ThemeContext` — dark/light toggle, persisted in `localStorage`, defaults to dark
- `MusicContext` — shuffled playlist of MP3s hosted on GitHub Release `media-v1` (see `src/data/hostedMedia.ts`), autoplay on first user interaction
- `TransitionContext` — GSAP timeline ref + `playTransition(path)` for animated route changes

**Project data** (`src/data/`):
- `projectSchema.ts` — `Project` and `ProjectArchitecture` TypeScript interfaces
- `projects.ts` — the canonical project array (newest first); archived entries are block-commented at the bottom of the file
- `projectArchitectures.ts` — Mermaid diagram strings (`hld`, `lld`, `dataFlow`) keyed by project ID, consumed by `ProjectDetail` via `ArchitectureTabs`

**To add a new project:**
1. Add an entry to `src/data/projects.ts`
2. Optionally add architecture diagrams to `src/data/projectArchitectures.ts`
3. Drop still images into `public/project-images/<id>/`. Host large videos on GitHub Release `media-v1` and reference them from `src/data/hostedMedia.ts`.

**To add background music tracks:**
- Upload the `.mp3` to GitHub Release `media-v1`
- Add a URL in `src/data/hostedMedia.ts` and a track entry in `src/data/musicTracks.ts`
- Do not put large MP3/MP4 files in `public/` — they are copied into every Vercel deploy

### Backend (`api/`)

Single-file Express server: `api/index.ts`. Runs on port 5000 by default.

**Endpoints:**
- `POST /api/contact` — contact form, sends via Resend
- `POST /api/collaborate` — collaboration form, sends via Nodemailer (Gmail)
- `GET|POST|DELETE /api/guestbook` — guestbook backed by Neon PostgreSQL (GuestBook page is currently commented out of routing)
- `GET /api/profile-views` — proxy for GitHub profile-view badge SVG
- `GET /api/commit-stats` — proxy for GitHub commit-language card SVG
- `GET /api/docs` — Swagger UI (requires `api/swagger.yaml`)

**Required environment variables (backend):**
```
DATABASE_URL       # Neon PostgreSQL connection string
RESEND_API_KEY     # Resend API key
RESEND_FROM        # "From" address for Resend emails
RESEND_TO          # Recipient address (or EMAIL_TO)
EMAIL_USER         # Gmail address for Nodemailer (collaborate form)
EMAIL_PASS         # Gmail app password
PORT               # Optional, defaults to 5000
```

**Frontend env vars:**
```
VITE_API_URL          # API base URL; falls back to http://localhost:5000/api in dev
VITE_CONTACT_EMAIL    # Display email in UI; falls back to hardcoded address
```

The Contact component resolves `VITE_API_URL` at runtime — in production, set it to the deployed backend URL or a relative `/api` prefix if proxied.
