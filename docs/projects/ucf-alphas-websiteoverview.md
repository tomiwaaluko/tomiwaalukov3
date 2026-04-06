# Xi Iota Chapter — Alpha Phi Alpha Website — Project Overview

## Project Purpose

The official website for the **Xi Iota Chapter of Alpha Phi Alpha Fraternity, Inc.** at the University of Central Florida. Alpha Phi Alpha is the first intercollegiate Greek-letter fraternity established by African Americans. The site showcases the chapter's rich history, current leadership, brotherhood, annual events, and community service, and serves as the digital home for the chapter's public presence.

Key sections include:
- **Chapter history** and fraternity-wide founding history
- **Executive board** (Eboard) and **leadership** directory
- **Meet the Brothers** — profiles for each active member
- **Lineage** — complete crossing/intake history
- **Miss Black & Gold** — the chapter's annual pageant
- **Service** — community service initiatives with a photo gallery
- **Jewels** — profiles of the seven founders of Alpha Phi Alpha
- **National Programs** — the fraternity's national service programs
- **Contact form** — powered by the Resend API via a serverless function
- **Become an Alpha** — interest form for prospective members

Live site: `https://xi-iota-beacon-site.vercel.app/`

---

## Tech Stack & Rationale

| Technology | Version | Role |
|---|---|---|
| **React** | — | UI component framework |
| **TypeScript** | — | Type safety across components, hooks, and API handlers |
| **Vite** | — | Build tool; fast HMR during development |
| **Tailwind CSS** | — | Utility-first styling |
| **Radix UI** | — | 30+ accessible, unstyled component primitives (accordion, dialog, dropdown, select, tabs, etc.) |
| **React Router DOM** | — | Client-side routing for 30+ page components |
| **Resend** (`@emailjs/browser` replaced by Resend API) | — | Server-side transactional email for the contact form |
| **Supabase** | — | Backend storage for dynamic content (lineage data, member info) |
| **Bun** | — | Package manager (`bun.lockb`); faster installs than npm |
| **Vercel** | — | Deployment; serverless function hosting for the contact API |

**Why Radix UI:** The site has many interactive components — accordions for chapter history, dialogs for brother profiles, dropdowns for navigation — all of which need ARIA-compliant accessibility. Radix provides the behavior and accessibility semantics; Tailwind handles the visual styling. This is the same shadcn/ui architecture used across the other TypeScript projects in this portfolio.

**Why Resend over client-side EmailJS:** Client-side email SDKs expose API keys in the browser. The contact form uses a serverless API function (`api/contact.ts`) that calls Resend server-side, keeping the `RESEND_API_KEY` out of the client bundle.

---

## Architecture Overview

```
ucf-alphas-website/
├── src/
│   ├── App.tsx                   # Root: React Router <Routes> definition
│   ├── main.tsx                  # Vite entry point
│   ├── index.css                 # Global styles + Tailwind directives
│   ├── components/               # Shared layout components
│   │   ├── Navigation.tsx        # Top nav with mobile hamburger menu
│   │   ├── Hero.tsx              # Landing hero with chapter tagline
│   │   ├── Greeting.tsx          # Welcome section
│   │   ├── Footer.tsx            # Links, social media, copyright
│   │   ├── Eboard.tsx            # Executive board card grid
│   │   ├── Contact.tsx           # Contact form UI (posts to /api/contact)
│   │   ├── Service.tsx           # Community service highlights
│   │   ├── Lineage.tsx           # Intake/crossing timeline
│   │   ├── About.tsx             # Chapter about section
│   │   ├── ScrollToTop.tsx       # Resets scroll on route change
│   │   └── ui/                   # Radix UI + shadcn component wrappers
│   ├── pages/                    # Full-page route components (30+ pages)
│   │   ├── Index.tsx             # Home page
│   │   ├── About.tsx             # About the chapter
│   │   ├── ChapterHistory.tsx    # Chapter founding and history
│   │   ├── FraternityHistory.tsx # National fraternity history
│   │   ├── Eboard.tsx            # Executive board page
│   │   ├── Leadership.tsx        # All leadership roles
│   │   ├── MeetTheBrothers.tsx   # Brother profile grid
│   │   ├── BrotherDetail.tsx     # Individual brother profile
│   │   ├── Lineage.tsx           # Full lineage list
│   │   ├── LineageDetail.tsx     # Individual intake class detail
│   │   ├── MissBlackAndGold.tsx  # Pageant overview
│   │   ├── MissBlackAndGoldDetails.tsx
│   │   ├── MissXiIotaDetails.tsx
│   │   ├── MissYellowRoseDetails.tsx
│   │   ├── Service.tsx           # Service initiatives
│   │   ├── ServiceGallery.tsx    # Service photo gallery
│   │   ├── ServiceGalleryDetail.tsx
│   │   ├── MeetTheJewels.tsx     # Seven founders overview
│   │   ├── JewelDetail.tsx       # Individual founder profile
│   │   ├── NationalPrograms.tsx  # Go-to-High-School, etc.
│   │   ├── ProgramDetail.tsx
│   │   ├── Advisors.tsx          # Chapter advisors
│   │   ├── AdvisorDetail.tsx
│   │   ├── BecomeAnAlpha.tsx     # Rush/interest form
│   │   ├── Contact.tsx           # Contact page
│   │   ├── Poems.tsx
│   │   ├── CharlesHWesleyAward.tsx
│   │   ├── FFACAwards.tsx
│   │   ├── OutstandingChapterAward.tsx
│   │   └── AdminServiceEvents.tsx # Admin interface for service event management
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Utilities (cn() helper, Supabase client)
│   └── test/                     # Test files
├── api/
│   └── contact.ts                # Serverless function: validates form → Resend.send()
├── public/                       # Static assets
├── clean_images.ps1              # PowerShell script to clean up image assets
├── replace_images.ps1            # PowerShell script to batch-update image references
├── update_lineage_details.ps1    # PowerShell script to update lineage data
├── components.json               # shadcn/ui component registry config
├── vite.config.ts                # Vite + React plugin
├── tailwind.config.ts            # Tailwind theme config
└── vercel.json                   # Vercel deployment config (SPA rewrite + serverless function)
```

### Contact Form Serverless Function (`api/contact.ts`)

The contact form is handled by a Vercel serverless function:
1. Form data POSTs to `/api/contact` (handled by `api/contact.ts`).
2. The function validates and sanitizes all inputs server-side.
3. Calls `resend.emails.send(...)` with the validated data.
4. Returns a JSON success/error response.
5. `RESEND_API_KEY`, `TO_EMAIL`, and `FROM_EMAIL` are environment variables set in the Vercel dashboard — never exposed to the browser.

### PowerShell Automation Scripts
Three PowerShell scripts (`clean_images.ps1`, `replace_images.ps1`, `update_lineage_details.ps1`) handle bulk content management tasks that would otherwise be tedious manual edits — batch image path updates and lineage data refreshes when new intake classes cross.

---

## Setup & Install Steps

### Prerequisites
- Node.js 18+ or Bun runtime
- A Vercel account (for serverless function deployment)
- A Resend account (for contact form email delivery)

```bash
git clone https://github.com/tomiwaaluko/ucf-alphas-website.git
cd ucf-alphas-website
bun install    # or: npm install
```

Create a `.env` file:
```
RESEND_API_KEY=re_...
TO_EMAIL=your-chapter-email@example.com
FROM_EMAIL=onboarding@resend.dev
```

```bash
bun run dev      # → http://localhost:5173
bun run build    # production build
bun run preview  # serve production build locally
bun run lint     # ESLint
```

For the serverless contact form to work locally:
```bash
npm run dev:api    # runs the dev-api-server.cjs (local Resend proxy)
```

Deploy to Vercel by connecting the repository. Set `RESEND_API_KEY`, `TO_EMAIL`, and `FROM_EMAIL` in the Vercel Environment Variables dashboard.

---

## Notable Implementation Decisions

### 30+ page components for granular content
Each distinct piece of chapter content (individual brother profiles, each pageant participant, each lineage class, each founder profile) gets its own page component and route. This enables deep-linking directly to any piece of content and makes the site SEO-addressable without a CMS. The tradeoff is a large `pages/` directory, but it is manageable with consistent naming conventions.

### Radix UI + Tailwind (shadcn/ui pattern)
`components.json` confirms the project uses shadcn/ui's component registry system. Radix provides unstyled, accessible component behavior; Tailwind utility classes apply the visual style. The `ui/` subdirectory in `components/` holds all shadcn-generated component wrappers. This pattern was chosen over Material UI or Chakra to avoid opinionated default styles that would clash with the chapter's brand aesthetic.

### Bun as package manager
`bun.lockb` indicates Bun is used instead of npm or yarn. Bun's faster install time and compatible `package.json` support make it a drop-in improvement. The scripts in `package.json` still use standard Node/Vite commands so contributors without Bun installed can fall back to `npm run`.

### PowerShell scripts for content bulk-updates
Lineage data (intake class details, member profiles) needs periodic updates when new brothers join. Rather than requiring each update to be done component-by-component in JSX, `update_lineage_details.ps1` scripted the bulk data replacement. This was a pragmatic choice: the data is structured enough to be batch-updated but not complex enough to warrant a full CMS.

### `AdminServiceEvents.tsx` for content management
A dedicated admin page exists for managing service event entries (`AdminServiceEvents.tsx`). This provides a minimal admin interface within the site itself, allowing chapter officers to add/edit service gallery entries without direct code changes.

### Supabase for dynamic content
While most chapter history, biographies, and lineage data is static JSX/TypeScript, Supabase is integrated for any content that needs to be updated without a code deployment — likely service event records, gallery photos, or RSVP-style data for events.

### Dev API server for local testing
`package.json` includes a `dev:api` script that runs `dev-api-server.cjs` — a local Node server that proxies the serverless contact API function. This allows testing the contact form locally without deploying to Vercel, and a `test-contact-api.js` script (callable via `window.testContactAPI()` in the browser console) verifies the endpoint behavior during development.


## Resume Bullet Points

- Engineered the official website for the Xi Iota Chapter of Alpha Phi Alpha Fraternity, Inc. at UCF using Vite + React + TypeScript with 30+ page components, full Radix UI accessibility primitives, and a Vercel-deployed serverless contact API using Resend.
- Built PowerShell automation scripts for bulk content management (image cleanup, lineage data updates), enabling chapter officers to update brotherhood records and service galleries without direct code changes.
- Implemented dynamic team profile routing where a single component reads URL slugs to render any brother or advisor profile, reducing route maintenance to a single data file update when chapter membership changes.
