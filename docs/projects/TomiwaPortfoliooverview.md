# Tomiwa's ePortfolio — Project Overview

## Project Purpose

A personal ePortfolio website for Tomiwa Aluko, a Computer Engineering student at the University of Central Florida. The site serves as a comprehensive professional profile showcasing:

- Background and professional experience
- Technical and soft skills
- Projects and achievements
- A functional contact form
- Resume/CV

The portfolio is designed as a single-page application with smooth scroll-based section navigation and animated transitions, targeting recruiters, collaborators, and prospective employers.

---

## Tech Stack & Rationale

| Technology | Version | Role |
|---|---|---|
| **Next.js** | ^15.4.7 | Full-stack React framework; App Router for layout + API routes for the contact form |
| **React** | ^18.2.0 | Component-based UI |
| **TypeScript** | — | Type safety across components and API route handlers |
| **Tailwind CSS** | ^3.4.17 | Utility-first styling; dark background (`#121212`) with consistent spacing |
| **Framer Motion** | ^12.9.4 | Page and section entry animations; scroll-triggered reveals |
| **Resend** | ^2.1.0 | Transactional email API for the contact form; server-side API route keeps the API key out of the browser |
| **react-type-animation** | ^3.2.0 | Typed text animation in the hero section (role/title cycling) |
| **react-icons** | ^5.5.0 | Icon library for tech stack badges and social links |
| **@heroicons/react** | ^2.0.18 | Hand-crafted SVG icons (navigation, CTA buttons) |
| **@vercel/analytics** | ^1.5.0 | Lightweight page-view and event analytics; injected via the root layout |
| **Vercel** | — | Deployment platform; automatic preview deployments on every push |

Resend is used over EmailJS because it keeps the API key entirely server-side (a Next.js API route), avoiding the security exposure of embedding credentials in client-side code.

---

## Architecture Overview

```
TomiwaPortfolio/
├── src/
│   └── app/
│       ├── layout.js           # Root layout: <Analytics />, global fonts, metadata
│       ├── page.js             # Home page: assembles all sections in order
│       ├── components/
│       │   ├── Navbar.jsx          # Fixed top nav with scroll-aware active-section detection
│       │   ├── HeroSection.jsx     # Name, animated role title, CTA buttons, profile image
│       │   ├── AchievementsSection.jsx  # Stats cards (GPA, project count, etc.)
│       │   ├── AboutSection.jsx    # Bio text, skills grid, experience timeline
│       │   ├── ProjectSection.jsx  # Project cards with tech stack tags and links
│       │   ├── EmailSection.jsx    # Contact form — posts to /api/send
│       │   └── Footer.jsx          # Links and copyright
│       └── api/
│           └── send/
│               └── route.js    # Next.js API route: validates form data → Resend.send()
├── public/                     # Static assets (images, resume PDF)
├── next.config.mjs             # Next.js configuration
├── tailwind.config.js          # Tailwind theme
└── package.json
```

### Page Structure (`page.js`)

The home page renders all sections in a fixed vertical order:
```jsx
<Navbar />
<HeroSection />
<AchievementsSection />
<AboutSection />
<ProjectSection />
<EmailSection />
<Footer />
```

The dark theme (`bg-[#121212]`) is set at the `<main>` level and propagates to all sections via Tailwind's utility classes.

### Contact Form Flow

1. User fills in the `EmailSection` form (name, email, message).
2. The form POSTs to `/api/send` (a Next.js API Route).
3. The route handler calls `resend.emails.send(...)` with the form data.
4. The `RESEND_API_KEY` environment variable is read server-side only — never exposed to the browser.
5. Success/error response is returned as JSON and displayed inline in the form.

---

## Setup & Install Steps

```bash
git clone https://github.com/tomiwaaluko/TomiwaPortfolio.git
cd TomiwaPortfolio
npm install
```

Create a `.env.local` file:
```
RESEND_API_KEY=re_...
```

```bash
npm run dev      # → http://localhost:3000
npm run build    # production build
npm run start    # serve production build
npm run lint     # ESLint check
```

Deploy to Vercel by connecting the repo — `RESEND_API_KEY` must be set as an environment variable in the Vercel dashboard.

---

## Notable Implementation Decisions

### Server-side contact form via Next.js API route
The contact form uses a Next.js API route (`/api/send/route.js`) rather than a client-side email service. This keeps `RESEND_API_KEY` entirely server-side. The pattern is identical to the ucf-alphas-website contact API: both use Resend for the same reason.

### Framer Motion for scroll-triggered section animations
Each section component uses Framer Motion's `motion.div` with `initial={{ opacity: 0, y: 20 }}` and `whileInView={{ opacity: 1, y: 0 }}` variants. Sections animate in as the user scrolls down, giving the portfolio a polished, professional feel without heavy JavaScript overhead — Framer Motion's bundle is tree-shaken to only include used features.

### `react-type-animation` for role cycling
The hero section uses `react-type-animation` to cycle through role descriptions (e.g., "Software Engineer", "Computer Engineering Student", "Full Stack Developer"). This creates a dynamic first impression without requiring a custom typing animation implementation.

### `@vercel/analytics` via root layout
`<Analytics />` from `@vercel/analytics` is placed in the root `layout.js`, meaning it tracks every page and client-side navigation automatically. No manual event tracking needed for basic pageview metrics.

### Single `page.js` entry point for all sections
All portfolio content is on one page (`/`). This is a deliberate UX choice: portfolios are scanned rather than navigated — recruiters want to scroll through everything in one pass. React Router or Next.js multi-page routing would fragment this flow.

### Dark background as a design system anchor
The `bg-[#121212]` Tailwind arbitrary value is set once at the `<main>` wrapper level. All component backgrounds build on top of this, creating a consistent dark-mode-first design that matches the aesthetic of tools like VS Code and Linear.


## Resume Bullet Points

- Built a personal ePortfolio using Next.js 15 App Router with Framer Motion scroll-triggered animations and a react-type-animation hero section, deployed on Vercel with automatic analytics via @vercel/analytics.
- Implemented a server-side Resend contact form API route in Next.js, keeping API credentials out of the browser bundle while delivering reliable transactional email from a public-facing contact form.
- Designed a dark-theme design system (bg-[#121212]) using Tailwind CSS v3 propagated from a single root wrapper, showcasing projects, skills, and professional experience in a single-page scroll layout.
