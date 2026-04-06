# UCF Alphas Website — System Design Architecture

## Overview
Official website for the Xi Iota Chapter of Alpha Phi Alpha Fraternity at UCF. Features chapter history, leadership profiles, brotherhood directory, community service initiatives, Miss Black & Gold pageant information, and admin-controlled content management.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Build Tool | Vite + React 18.3.1 + TypeScript |
| Styling | Tailwind CSS 3.4.11 + PostCSS |
| UI Components | shadcn/ui (Radix UI primitives) + Lucide React |
| Forms | React Hook Form 7.53.0 + Zod validation |
| Data Fetching | TanStack Query 5.56.2 |
| Routing | React Router DOM 6.26.2 |
| Animation | Framer Motion 12.15.0 |
| Database | Supabase (PostgreSQL) with Row Level Security |
| Email | Resend 6.0.1 |
| Analytics | Vercel Analytics 1.5.0 |
| Theme | next-themes 0.3.0 |
| Testing | Vitest 4.0.15 + Testing Library |
| Deployment | Vercel |

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│           Vite + React SPA (Vercel)                         │
│                                                              │
│  React Router DOM (client-side routing)                      │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────────┐  │
│  │  Navigation │  │    Pages    │  │    Components      │  │
│  │  Hero       │  │  / (Home)   │  │  shadcn/ui prims   │  │
│  │  About      │  │  /leadership│  │  Button, Card,     │  │
│  │  Eboard     │  │  /brothers  │  │  Form, Dialog,     │  │
│  │  Service    │  │  /lineage   │  │  40+ more          │  │
│  │  Contact    │  │  /service   │  └────────────────────┘  │
│  │  Footer     │  │  /contact   │                           │
│  └─────────────┘  │  /admin/..  │                           │
│                   │  + 20 more  │                           │
│                   └─────────────┘                           │
│                                                              │
│  TanStack Query (server state + caching)                    │
└────────────────────────┬─────────────────────────────────────┘
                         │  CRUD / RLS enforced
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                   Supabase Backend                          │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Auth         │  │  PostgREST   │  │   Storage        │  │
│  │ (email-based │  │  REST API    │  │  service-gallery/│  │
│  │  admin login)│  │  (auto-gen)  │  │  images          │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              PostgreSQL Database                     │   │
│  │  service_events · service_event_images               │   │
│  │  allowed_admin_emails                                │   │
│  │  Row Level Security (public read / admin write)      │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬─────────────────────────────────────┘
                         │ POST (Resend API)
                         ▼
                ┌─────────────────────┐
                │   api/contact.js    │
                │  Contact form email │
                │  endpoint (Resend)  │
                └─────────────────────┘
```

---

## Pages (24+ Routes)

| Route | Description |
|---|---|
| `/` | Homepage |
| `/chapter-history` | Xi Iota chapter history |
| `/fraternity-history` | Alpha Phi Alpha national history |
| `/leadership` | Executive board |
| `/meet-the-brothers` | Active brothers directory |
| `/brother/:id` | Individual brother detail |
| `/advisors` | Chapter advisors |
| `/advisor/:id` | Individual advisor detail |
| `/lineage` | Chapter crossing lines |
| `/lineage/:lineId` | Individual line detail |
| `/meet-the-jewels` | Founding fathers |
| `/jewel/:id` | Individual founder detail |
| `/miss-black-and-gold` | Pageant info |
| `/service` | Community service initiatives |
| `/service-gallery` | Service event photo gallery |
| `/contact` | Contact form |
| `/become-an-alpha` | Membership information |
| `/national-programs` | National APA programs |
| `/admin/service-events` | Admin event management panel |

---

## Database Schema (Supabase)

```sql
service_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  date             DATE,
  location         TEXT,
  attendee_count   INTEGER,
  description      TEXT,
  tags             TEXT[],
  primary_image_url TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
)

service_event_images (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID REFERENCES service_events(id),
  image_url  TEXT NOT NULL,
  caption    TEXT,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

allowed_admin_emails (
  email TEXT PRIMARY KEY
)
```

---

## Row Level Security (RLS) Policy

| Table | Public | Authenticated Admin |
|---|---|---|
| `service_events` | SELECT only | SELECT, INSERT, UPDATE, DELETE |
| `service_event_images` | SELECT only | SELECT, INSERT, UPDATE, DELETE |
| `allowed_admin_emails` | None | SELECT (to verify self) |

Admin status is determined by the `is_admin()` function that checks if the authenticated user's email exists in `allowed_admin_emails`.

---

## Contact Form Flow

```
User submits /contact form
  → POST api/contact.js
  → Validated via React Hook Form + Zod
  → Resend API sends email to site owner
  → User receives confirmation
```

**Environment Variables:**
- `RESEND_API_KEY`
- `FROM_EMAIL`
- `TO_EMAIL`

---

## Deployment

| Concern | Detail |
|---|---|
| Platform | Vercel (CI/CD from main branch) |
| Live URL | https://ucfalphas.vercel.app |
| Build | `npm run build` → `dist/` |
| Database | Supabase Cloud |
| Storage | Supabase Storage bucket (`service-gallery`) |
