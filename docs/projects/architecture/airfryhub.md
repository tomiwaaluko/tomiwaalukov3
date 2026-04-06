# AirFryHub — System Design Architecture

## Overview
Air fryer recipe and community forum platform where users can share recipes, cooking tips, and food photos. Built as a web development course final project. Features anonymous authentication, real-time updates, image uploads, and a voting system.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 19 + JavaScript (JSX) |
| Build Tool | Vite 7 + @vitejs/plugin-react |
| Routing | React Router DOM v7 |
| Styling | Tailwind CSS v4 |
| Data Fetching | TanStack Query v5 |
| Validation | Zod v4 |
| Backend / Database | Supabase (PostgreSQL + Realtime + Auth + Storage) |

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│            React SPA (Vite 7) — finalproject/               │
│                                                              │
│  src/
│  ├── App.jsx              # Root + routing                  │
│  ├── pages/               # Feed, Post Detail, Upload       │
│  ├── components/          # PostCard, CommentList, etc.     │
│  ├── hooks/               # Custom React hooks              │
│  └── lib/                 # Supabase client                 │
│                                                              │
│  TanStack Query (caching + data sync)                        │
│                                                              │
│  Theme: dark/light toggle (localStorage)                     │
└────────────────────────┬─────────────────────────────────────┘
                         │  Supabase JS client
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                   Supabase                                  │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Auth        │  │  Realtime    │  │   Storage        │  │
│  │ (Anonymous   │  │ (live post + │  │  (user-uploaded  │  │
│  │  sessions,   │  │  comment     │  │   images)        │  │
│  │  persistent) │  │  updates)    │  └──────────────────┘  │
│  └──────────────┘  └──────────────┘                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  PostgreSQL                          │   │
│  │  posts · comments · upvotes                          │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## Data Models (Supabase)

```sql
posts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users,
  title        TEXT NOT NULL,
  content      TEXT,
  image_url    TEXT,          -- URL or Supabase Storage path
  upvotes      INTEGER DEFAULT 0,
  repost_of    UUID REFERENCES posts(id),   -- for threading
  created_at   TIMESTAMPTZ DEFAULT NOW()
)

comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id      UUID REFERENCES posts(id),
  user_id      UUID REFERENCES auth.users,
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
)

upvotes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id      UUID REFERENCES posts(id),
  user_id      UUID REFERENCES auth.users,
  UNIQUE(post_id, user_id)
)
```

---

## Key Features

| Feature | Implementation |
|---|---|
| Post creation | Title + text content + optional image (URL or file upload to Supabase Storage) |
| Feed | Sort by date or upvote count; search by title/content; pagination |
| Post detail | Per-post page with full content, comments, upvotes, edit/delete |
| Reposting | Thread-style repost by post ID |
| Upvoting | Per-user upvote with unique constraint; optimistic UI update |
| Auth | Anonymous Supabase Auth with session persistence (no account required) |
| Real-time | Supabase Realtime subscriptions — new posts/comments appear instantly |
| Theme | Dark/light toggle stored in localStorage |
| Image upload | Direct to Supabase Storage from the browser |
| Link preview | Auto-generated link previews for external URLs |

---

## Anonymous Auth Flow

```
App loads
  → Supabase checks for existing anonymous session in localStorage
  → If none: auto-creates anonymous session (no sign-up required)
  → Session persists across page refreshes
  → All posts/comments/upvotes tied to anonymous user_id
```

---

## Real-time Updates

```
Supabase Realtime subscription on posts and comments tables
  → INSERT events trigger UI update via TanStack Query cache invalidation
  → New posts appear in feed without page refresh
  → New comments appear on post detail page in real time
```

---

## Project Structure

```
finalproject/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── components/      # PostCard, CommentList, UpvoteButton, etc.
│   ├── hooks/           # usePost, useFeed, useComments, useUpvote
│   ├── lib/
│   │   └── supabase.js  # Supabase client init
│   ├── pages/           # Feed, PostDetail, CreatePost
│   └── assets/
├── .env.example         # NEXT_PUBLIC_SUPABASE_URL + ANON_KEY
├── vite.config.js
└── package.json
```

---

## Deployment

| Concern | Platform |
|---|---|
| App | Vercel, Netlify, or any static host |
| Database | Supabase Cloud |
| File Storage | Supabase Storage |
| License | Apache 2.0 |
