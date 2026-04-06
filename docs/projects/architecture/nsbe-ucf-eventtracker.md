# NSBE UCF Event Tracker — System Design Architecture

## Overview
Full-stack platform for managing National Society of Black Engineers (NSBE) UCF chapter events and tracking member attendance via QR-code check-ins. Includes a real-time achievement leaderboard, friend management, and admin controls.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend Framework | NestJS 11 (Node.js 20.x, TypeScript 5.7) |
| ORM | Prisma 6 + PostgreSQL 15 |
| Auth | Supabase JWT + OAuth (Google, Discord) |
| File Storage | Supabase Storage (Multer, 5MB limit) |
| Caching | node-cache (in-memory) |
| Frontend Framework | Next.js 16 (React 19, App Router) |
| Styling | Tailwind CSS 3.4 + Radix UI (97+ components) |
| Charts | Recharts 3.4 |
| Animations | Framer Motion 12.23 |
| Forms | React Hook Form 7.66 |
| Testing | Jest 30 + Supertest |
| Deployment | Vercel (frontend) · Railway (backend) · Supabase (DB) |

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────┐
│          Next.js 16 Frontend (Vercel)            │
│                                                  │
│  Pages: dashboard · events · checkin · admin     │
│         leaderboard · friends · members          │
│         achievements · onboarding · settings     │
└──────────────────────┬───────────────────────────┘
                       │ HTTP (Bearer JWT + X-API-Key)
                       │ lib/api.ts (centralized wrapper)
                       ▼
┌──────────────────────────────────────────────────┐
│        NestJS 11 Backend (Railway, port 4000)    │
│                                                  │
│  ┌─────────┐ ┌────────┐ ┌──────────┐ ┌────────┐ │
│  │  Auth   │ │Members │ │  Events  │ │Attend- │ │
│  │ Module  │ │ Module │ │  Module  │ │ ance   │ │
│  └─────────┘ └────────┘ └──────────┘ └────────┘ │
│  ┌─────────┐ ┌────────┐ ┌──────────┐ ┌────────┐ │
│  │  Stats  │ │Friends │ │ EventInt-│ │Storage │ │
│  │ Module  │ │ Module │ │ erest    │ │ Module │ │
│  └─────────┘ └────────┘ └──────────┘ └────────┘ │
│                                                  │
│  ┌──────────────────┐   ┌─────────────────────┐  │
│  │  Prisma ORM      │   │  Supabase Auth      │  │
│  │  (DB service)    │   │  (JWT verification) │  │
│  └────────┬─────────┘   └─────────────────────┘  │
└───────────┼──────────────────────────────────────┘
            ▼
┌──────────────────────────────────────────────────┐
│          PostgreSQL 15 (Supabase Cloud)          │
│                                                  │
│  Member · Event · Attendance · OAuthAccount      │
│  Friendship · EventInterest                      │
└──────────────────────────────────────────────────┘
```

---

## Backend Module Breakdown (NestJS)

| Module | Responsibility |
|---|---|
| `AuthModule` | Supabase JWT verification, Google/Discord OAuth, user sync to DB |
| `MembersModule` | Profile CRUD, role management, photo uploads |
| `EventsModule` | Event CRUD, QR code generation (per-event `qrSecret`) |
| `AttendanceModule` | QR check-in validation, attendance history |
| `StatsModule` | Achievement stats, bucket-based leaderboard |
| `FriendsModule` | Friend requests + friendship management |
| `EventInterestModule` | Plan-to-attend tracking (PLANNING / CANCELLED / ATTENDED) |
| `StorageModule` | Multer file uploads (5MB, JPEG/PNG/WebP) |
| `CacheModule` | Global in-memory caching via node-cache |
| `PrismaModule` | Database service with lifecycle hooks |

---

## Data Models (Prisma Schema)

```prisma
model Member {
  id              String   @id @default(uuid())
  email           String   @unique
  firstName       String
  lastName        String
  role            String   @default("member")
  bio, discordUsername, major, graduationYear
  photoUrl, linkedInUrl, phoneNumber
  attendance      Attendance[]
  eventsCreated   Event[]
  oauthAccounts   OAuthAccount[]
  eventInterests  EventInterest[]
  friendships     Friendship[]  (bidirectional)
}

model Event {
  id          String   @id @default(uuid())
  name        String
  description String
  category    EventCategory  // GBM | SOCIAL | WORKSHOP | FUNDRAISER | COMMUNITY_SERVICE | COMMITTEE_PARTICIPATION
  startTime   DateTime
  endTime     DateTime
  location    String
  semester    String
  qrSecret    String
  checkInCode String
  isActive    Boolean
  createdById String   @relation(Member)
}

model Attendance {
  id            String   @id @default(uuid())
  memberId      String
  eventId       String
  checkedInAt   DateTime
  checkInMethod String   @default("qr")
  @@unique([memberId, eventId])
}

model Friendship {
  id          String
  userId      String
  friendId    String
  requesterId String
  status      FriendStatus  // PENDING | ACCEPTED | DECLINED | BLOCKED
  @@unique([userId, friendId])
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Email/password auth |
| GET | `/api/auth/oauth/:provider` | OAuth redirect (Google/Discord) |
| GET/PUT | `/api/members` | Profile read/update |
| POST | `/api/events` | Create event |
| POST | `/api/attendance/checkin` | QR code check-in |
| GET | `/api/stats` | Leaderboard + achievements |
| POST | `/api/friends` | Send friend request |
| POST | `/api/storage/upload` | Photo upload |

---

## Achievement System

Attendance is bucketed into 3 achievement categories:

| Bucket | Event Types |
|---|---|
| Bucket 1 | WORKSHOP + SOCIAL |
| Bucket 2 | FUNDRAISER + COMMUNITY_SERVICE |
| Bucket 3 | GBM (General Body Meeting) |

> `COMMITTEE_PARTICIPATION` does **not** count toward achievements.

---

## Auth Flow

```
User logs in via Supabase (email or OAuth)
  → Supabase issues JWT
  → JWT stored in localStorage
  → lib/api.ts injects Bearer token on every request
  → NestJS JwtAuthGuard extracts + verifies JWT
  → User auto-synced to PostgreSQL on first login
```

---

## Deployment

| Service | Platform |
|---|---|
| Frontend | Vercel |
| Backend API | Railway |
| Database | Supabase PostgreSQL (Session Pooler) |
| File Storage | Supabase Storage |
