# PullUp — System Design Architecture

## Overview
PullUp is a mobile application enabling college students to discover, RSVP to, and manage campus events. Dual-user model: **members** browse/RSVP to events; **organizations** create and manage events.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile Framework | React Native + Expo 54 (TypeScript) |
| Navigation | Expo Router 6.0 (file-based routing) |
| State / Data Fetching | TanStack React Query 5.62 |
| Backend / Database | Supabase (PostgreSQL, PostgREST, Auth, Realtime, Storage) |
| Authentication | Supabase Auth (Email, Google OAuth, Apple OAuth) |
| Error Tracking | Sentry 7.2 |
| Build | EAS Build (Expo Application Services) |
| Testing | Jest 29.7 + React Native Testing Library 12.9 |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────┐
│              Expo / React Native             │
│                                             │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  │
│  │  (auth)  │  │ (onboard) │  │  (tabs)  │  │
│  │ Sign In  │  │ Welcome   │  │  Home    │  │
│  │ Sign Up  │  │ Interests │  │  RSVPs   │  │
│  └──────────┘  │ Notifs    │  │ Profile  │  │
│                └───────────┘  └──────────┘  │
│  ┌──────────┐  ┌──────────────────────────┐  │
│  │  (org)   │  │     events/[id]          │  │
│  │ Dashboard│  │     Event Detail         │  │
│  │ Create   │  └──────────────────────────┘  │
│  └──────────┘                               │
└───────────────────────┬─────────────────────┘
                        │ TanStack React Query
                        ▼
┌─────────────────────────────────────────────┐
│                  Supabase                   │
│                                             │
│  ┌────────┐  ┌──────────┐  ┌─────────────┐ │
│  │  Auth  │  │PostgREST │  │   Storage   │ │
│  │ Email  │  │   API    │  │ (avatars,   │ │
│  │ Google │  │          │  │  org logos) │ │
│  │ Apple  │  └──────────┘  └─────────────┘ │
│  └────────┘                                │
│  ┌─────────────────────────────────────┐   │
│  │         PostgreSQL Database         │   │
│  │  profiles · organizations · events  │   │
│  │  rsvps · saved_events · org_follows │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## Routing Structure (Expo Router)

| Route Group | Screens |
|---|---|
| `(auth)` | Sign In, Sign Up |
| `(onboard)` | Welcome, Interests, Notifications |
| `(tabs)` | Home Feed, My RSVPs, Profile |
| `(org)` | Org Overview, Events, Profile, Create Event |
| `org/` | Org Registration Flow |
| `events/[id]` | Event Detail Page |

---

## Data Models

```sql
profiles
  id UUID (FK → auth.users)
  school, major, graduation_year, interests

organizations
  id UUID
  name, description, owner_id (FK → profiles)

events
  id UUID
  title, description, location, start_time, end_time
  type ENUM(academic, sports, social, career, club, greek, other)
  status ENUM(draft, published)
  org_id (FK → organizations)

rsvps
  id UUID
  user_id (FK → profiles), event_id (FK → events)
  created_at

saved_events
  user_id, event_id

org_follows
  user_id, org_id
```

---

## Key Libraries & Modules

| File/Module | Purpose |
|---|---|
| `lib/supabase.ts` | Supabase client initialization |
| `lib/auth-context.tsx` | Auth state provider |
| `lib/org-context.tsx` | Org switcher context |
| `lib/analytics.ts` | Event tracking + CSV export |
| `lib/calendar.ts` | ICS generation + `Linking.openURL` |
| `hooks/useEvents` | Event listing + filtering |
| `hooks/useRSVP` | RSVP create/delete |
| `hooks/useSavedEvents` | Bookmarks |
| `hooks/useOrganizations` | Org management |

---

## Security

- Row-Level Security (RLS) enforced at the database layer
- Published events are publicly readable; drafts visible only to the creator
- RSVPs, saved events, and org follows are scoped to the authenticated user

---

## Deployment

| Target | Platform |
|---|---|
| iOS / Android | EAS Build |
| Web (experimental) | Expo Web |
| Backend | Supabase Cloud |

**Environment Variables:**
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
