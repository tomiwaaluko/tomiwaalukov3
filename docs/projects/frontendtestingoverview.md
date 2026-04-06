# frontendtesting (SkyGo Private Jets) — Project Overview

## Project Purpose

`frontendtesting` (internal name: **ai-studio-applet**) is a luxury private jet booking platform hero section built as a Google AI Studio applet. According to `metadata.json`, the project is named **"SkyGo Private Jets"** and is described as "a luxury private jet booking platform hero section with simple, ADHD-friendly copy." It is designed to be deployed as a Cloud Run service and embedded inside the Google AI Studio environment, where it receives a Gemini API key and hosting URL injected at runtime via environment variables.

---

## Tech Stack & Rationale

| Technology | Version | Role |
|---|---|---|
| **Next.js** | ^15.4.9 | Full-stack React framework; `output: 'standalone'` targets Cloud Run |
| **React** | ^19.2.1 | UI component model |
| **TypeScript** | 5.9.3 | Static typing; `strict: true` enforced in tsconfig |
| **Tailwind CSS** | 4.1.11 | Utility-first styling via `@tailwindcss/postcss` (v4 PostCSS plugin) |
| **Framer Motion / motion** | ^12.34.4 / ^12.23.24 | Animation library; transpiled via `transpilePackages` for ESM compat |
| **@google/genai** | ^1.17.0 | Google Gemini AI SDK |
| **@hookform/resolvers** | ^5.2.1 | Form validation (pairs with React Hook Form) |
| **lucide-react** | ^0.553.0 | Icon set |
| **clsx + class-variance-authority + tailwind-merge** | latest | Conditional class name composition (shadcn/ui pattern) |
| **react-use-measure** | ^2.1.7 | DOM element measurement for animation layout |
| **tw-animate-css** | ^1.4.0 | Tailwind-compatible animation utilities |

---

## Architecture Overview

```
frontendtesting/
├── app/                    # Next.js App Router — pages, layouts, API routes
├── components/             # Reusable React components
├── hooks/                  # Custom React hooks
├── lib/                    # Utility/helper modules
├── public/                 # Static assets
├── next.config.ts          # Next.js configuration
├── tsconfig.json           # TypeScript configuration (ES2017, bundler resolution, @/* alias)
├── postcss.config.mjs      # PostCSS + Tailwind v4
├── eslint.config.mjs       # ESLint flat config (Next.js ruleset)
├── metadata.json           # AI Studio applet metadata (name, description, permissions)
└── .env.example            # GEMINI_API_KEY and APP_URL documentation
```

Key configuration notes:
- `next.config.ts` sets `output: 'standalone'` for Cloud Run, allows remote images from `picsum.photos`, and disables webpack HMR when `DISABLE_HMR=true` is set.
- `tsconfig.json` uses `moduleResolution: 'bundler'`, maps `@/*` to the project root, and enforces `strict: true`.
- `metadata.json` registers this as an AI Studio applet with no special frame permissions requested.

---

## Setup & Install Steps

1. **Clone and install** (Node.js 20+ required)
   ```bash
   git clone https://github.com/tomiwaaluko/frontendtesting.git
   cd frontendtesting
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   # GEMINI_API_KEY — from aistudio.google.com/app/apikey
   # APP_URL — http://localhost:3000 for local dev
   ```

3. **Run dev server**
   ```bash
   npm run dev
   ```

4. **Production build**
   ```bash
   npm run build && npm start
   ```

For Cloud Run deployment, use `.next/standalone/` — the self-contained artifact from `output: 'standalone'`.

---

## Notable Implementation Decisions

### AI Studio applet structure
The project is scaffolded as a **Google AI Studio applet**, not a generic Next.js app. `metadata.json` registers it with AI Studio, credentials are injected at runtime from the Secrets panel, and the app is deployed as a Cloud Run service. The app must be fully self-contained and stateless across cold starts.

### Conditional HMR disable for agent edits
`next.config.ts` disables webpack file watching when `DISABLE_HMR=true`:
```ts
if (dev && process.env.DISABLE_HMR === 'true') {
  config.watchOptions = { ignored: /.*/ };
}
```
When an AI agent edits source files programmatically, rapid HMR re-renders cause visible flickering in the preview pane. Suppressing file watching during agent sessions eliminates this at the cost of requiring manual refreshes.

### Tailwind CSS v4 — no config file
Tailwind v4 is used via `@tailwindcss/postcss`, eliminating the `tailwind.config.js` file entirely. Theme configuration moves into CSS `@theme` directives. `tw-animate-css` provides animation utilities in this setup.

### `motion` package transpilation
`motion` ships as ESM-only. Next.js requires explicit transpilation:
```ts
transpilePackages: ['motion'],
```
Without this, server components importing from `motion` throw ES module errors at build time.

### ADHD-friendly copy as a design constraint
`metadata.json` explicitly names "ADHD-friendly copy" as a product goal. The hero section content is intentionally short and scannable — an unusual constraint for a luxury brand that would typically use aspirational, verbose prose.

### Media assets in version control
`blackjet1.jpg`, `blackjet2.jpg`, and `Animated_Hovering_Plane_Video.mp4` are committed directly to the repo. Appropriate for a small, fixed-asset applet where the media set is stable and doesn't warrant a CDN or LFS setup.


## Resume Bullet Points

- Explored AI-assisted frontend development workflows using Google AI Studio (applet scaffolding + Gemini integration), Higgsfield AI (generative visual assets), and Google Antigravity to rapidly prototype luxury brand hero sections and landing pages.
- Shipped a production-ready Next.js 15 + Tailwind CSS v4 application deployed as a Google AI Studio Cloud Run applet, implementing conditional HMR suppression during AI agent editing sessions to eliminate preview flickering.
- Developed proficiency in multi-tool AI-to-code pipelines, compressing design-to-deployment cycles from days to hours by orchestrating generative AI platforms for asset creation, layout generation, and interactive component prototyping.
