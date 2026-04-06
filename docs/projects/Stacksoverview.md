# Stacks (Wealthly) — Project Overview

## Project Purpose

**Stacks** (deployed as **Wealthly** at `wealthly-phi.vercel.app`) is a personal finance and wealth management web application built as a hackathon project ("Hackathon25"). The app is forked from a base by Sultanlodi and extended for the hackathon. The deployment name "Wealthly" suggests the product is positioned as a consumer-facing wealth tracking or financial education tool.

---

## Tech Stack & Rationale

| Technology | Version | Role |
|---|---|---|
| **Next.js** | — | Full-stack React framework; App Router for page routing and API routes |
| **TypeScript** | — | Type safety across the frontend and API handlers |
| **Tailwind CSS** | — | Utility-first styling |
| **Supabase** | — | PostgreSQL database, Auth, and Storage (confirmed by `SUPABASE_SETUP.md`) |
| **pnpm** | — | Package manager (`pnpm-lock.yaml`); faster and more disk-efficient than npm |
| **Vercel** | — | Deployment platform; live at `wealthly-phi.vercel.app` |

This is a Next.js + Supabase + Tailwind project (the T3-adjacent "modern SaaS" stack), optimized for fast development during a hackathon timeline.

---

## Architecture Overview

```
Stacks/
├── src/                     # Application source code
├── .env.example             # Environment variable template
├── SUPABASE_SETUP.md        # Supabase project setup guide
├── README.md                # Project documentation
├── next.config.js           # Next.js configuration
├── tailwind.config.js       # Tailwind theme
├── tsconfig.json            # TypeScript configuration
├── postcss.config.js        # PostCSS + Tailwind
├── package.json             # Dependencies and scripts
├── pnpm-lock.yaml           # Locked dependency versions
├── .eslintrc.json           # ESLint rules
└── .prettierrc.json         # Prettier formatting config
```

The `src/` directory holds all application source. Based on the Supabase integration and the product name "Wealthly," the app likely includes:
- Financial account or portfolio tracking views
- Supabase Auth for user authentication
- Database tables for financial data (accounts, transactions, goals)
- Dashboard with charts or metrics

---

## Setup & Install Steps

### Prerequisites
- Node.js 18+, pnpm (`npm install -g pnpm`)
- A Supabase project (see `SUPABASE_SETUP.md` for database setup steps)

```bash
git clone https://github.com/tomiwaaluko/Stacks.git
cd Stacks
pnpm install
cp .env.example .env.local
# Fill in Supabase credentials per SUPABASE_SETUP.md
pnpm dev        # → http://localhost:3000
pnpm build
pnpm start
```

Follow `SUPABASE_SETUP.md` to configure the database schema, Auth providers, and RLS policies required by the app.

---

## Notable Implementation Decisions

### Forked and extended from a hackathon base
The project is a fork of "Hackathon25" by Sultanlodi — meaning the core scaffold, Supabase setup, and initial feature set came from a collaborator's repo, with this fork extending it for the final submission. This is a common hackathon pattern: teams split scaffold setup and feature implementation to maximize speed.

### pnpm over npm
`pnpm-lock.yaml` indicates pnpm is the package manager. pnpm's content-addressable store is significantly faster and more disk-efficient than npm's `node_modules` duplication, which matters when iterating quickly during a hackathon where `npm install` wait times add up.

### `SUPABASE_SETUP.md` as a first-class setup document
The dedicated `SUPABASE_SETUP.md` file (separate from the main `README.md`) documents the Supabase configuration steps needed to run the app. This separation keeps the README focused on the product and puts infrastructure setup in its own reference document — a sign that the Supabase setup is non-trivial (likely involves custom tables, RLS policies, and Edge Functions or triggers).

### Deployed under a product brand name
The repo is named `Stacks` (the developer/code name) but the deployment at `wealthly-phi.vercel.app` uses the consumer brand name "Wealthly." This code-name / brand-name separation is typical of startups and hackathon projects that are still evolving their product identity.


## Resume Bullet Points

- Led development of Wealthly, a personal finance and wealth management platform, as project lead on a hackathon team, architecting a Next.js + Supabase application delivered and deployed live at wealthly-phi.vercel.app within hackathon time constraints.
- Directed technical architecture decisions and coordinated team contributions across a forked collaborative codebase, managing scope and feature prioritization to ship a production-quality product end-to-end.
- Implemented user authentication and financial data persistence using Supabase Auth and PostgreSQL with Row-Level Security policies, leveraging pnpm and Tailwind CSS for rapid, consistent development.
