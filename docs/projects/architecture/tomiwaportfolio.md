# Tomiwa Portfolio — System Design Architecture

## Overview
Personal ePortfolio website for Tomiwa Aluko, a Computer Engineering student at UCF. Showcases professional experience, technical skills, projects, and achievements with a modern, animated single-page interface. Live at [tomiwaaluko.com](https://tomiwaaluko.com).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) + React 18 |
| Styling | Tailwind CSS 3.4.17 + PostCSS |
| Animation | Framer Motion 12.9.4 |
| Icons | React Icons 5.5.0 · Heroicons 2.0.18 |
| Email | Resend 2.1.0 |
| Analytics | Vercel Analytics 1.5.0 |
| Typing Effect | react-type-animation 3.2.0 |
| Deployment | Vercel |

---

## Architecture Diagram

```
┌──────────────────────────────────────────────┐
│          Next.js 15 App (Vercel)             │
│                                              │
│  src/app/page.js  (Single Page)              │
│  ┌────────────┐  ┌────────────────────────┐  │
│  │ AnimatedNav│  │     HeroSection        │  │
│  │  (mobile   │  │  (type animation,      │  │
│  │  + desktop)│  │   social links)        │  │
│  └────────────┘  └────────────────────────┘  │
│  ┌────────────┐  ┌────────────────────────┐  │
│  │  About     │  │   ProjectSection       │  │
│  │  Section   │  │  (filterable cards)    │  │
│  │  (Skills,  │  │                        │  │
│  │  Education,│  │  ProjectCard           │  │
│  │  Certs)    │  │  ProjectTag            │  │
│  └────────────┘  └────────────────────────┘  │
│  ┌────────────┐  ┌────────────────────────┐  │
│  │Achievement │  │   EmailSection         │  │
│  │  Section   │  │   (contact form)       │  │
│  └────────────┘  └────────────────────────┘  │
│  ┌─────────────────────────────────────────┐ │
│  │               Footer                   │ │
│  └─────────────────────────────────────────┘ │
└──────────────────────┬───────────────────────┘
                       │ POST /api/send
                       ▼
┌──────────────────────────────────────────────┐
│          Next.js API Route                   │
│          app/api/send/route.js               │
│                                              │
│  Receives: { email, subject, message }       │
│  Sends: admin notification + user confirm    │
│  Via: Resend API (styled HTML emails)        │
└──────────────────────────────────────────────┘
```

---

## Component Structure

```
src/app/
├── page.js                  # Home page (single SPA page)
├── layout.js                # Root layout (Analytics, metadata)
├── api/
│   └── send/
│       └── route.js         # Contact form email endpoint
└── components/
    ├── AnimatedNavbar.jsx   # Responsive nav with mobile menu
    ├── Navbar.jsx
    ├── NavLink.jsx
    ├── MenuOverlay.jsx
    ├── HeroSection.jsx      # Landing + typing animation
    ├── AboutSection.jsx     # Tabbed: Skills / Education / Certs
    ├── AchievementsSection.jsx
    ├── ProjectSection.jsx   # Filterable project grid
    ├── ProjectCard.jsx
    ├── ProjectTag.jsx
    ├── EmailSection.jsx     # Contact form
    └── Footer.jsx
```

---

## Data Models

Projects are stored as a static array in `ProjectSection.jsx`:

```javascript
{
  id:          number,
  title:       string,
  description: string,
  image:       string,    // relative path in /public
  tag:         string[],  // filter tags
  gitUrl:      string,
  previewUrl:  string
}
```

No database — all content is static.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/send` | Contact form submission |

**Request body:**
```json
{ "email": "user@example.com", "subject": "Hello", "message": "..." }
```

**Behavior:**
- Sends admin notification email to site owner
- Sends confirmation email to the user
- Uses Resend API with styled HTML templates

**Environment Variables:**
- `RESEND_API_KEY`
- `FROM_EMAIL`

---

## Deployment

| Concern | Detail |
|---|---|
| Platform | Vercel (automatic deploys from main branch) |
| Build | `npm run build` → `.next/` |
| Start | `npm run start` |
| Live URL | https://tomiwaaluko.com |
