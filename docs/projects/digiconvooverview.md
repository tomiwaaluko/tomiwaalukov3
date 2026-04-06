# DigiConvo — Project Overview

## Project Purpose

DigiConvo is an AI-powered conversation practice platform built to help users develop emotional intelligence and communication skills. The core idea is that difficult conversations — breakups, performance reviews, family disagreements, handling difficult customers — can be practiced safely with an AI partner before being faced in real life.

Users select from a set of pre-built scenarios, each featuring a distinct AI persona with a defined personality and emotional tendency. After sending a message, two things happen in parallel: the AI persona responds in character (with audio via text-to-speech), and a separate Gemini call analyzes the emotional tone of the user's message and surfaces suggestions in a live Emotion Analysis panel. Sessions can be saved and exported for later review.

The platform was built for the KnightHacks hackathon at UCF and targets communication coaches, HR professionals, relationship counselors, and individuals wanting to improve their interpersonal effectiveness.

---

## Tech Stack and Rationale

| Technology | Version | Role |
|---|---|---|
| Next.js | ^15.2.3 | React framework (App Router), server components, API routes |
| React | ^19.0.0 | UI component model |
| TypeScript | ^5.8.2 | Full-stack type safety |
| Tailwind CSS | ^4.0.15 | Utility-first styling with dark mode support |
| tRPC | ^11.0.0 | End-to-end typesafe API layer (no REST, no manual serialization) |
| TanStack React Query | ^5.69.0 | Server state management backing tRPC |
| Zustand | ^5.0.6 | Client-side state (chat messages, current scenario, emotion state, audio) |
| Framer Motion | ^12.19.2 | Declarative animation (panel slide-ins, message transitions, landing parallax) |
| Google Gemini (`@google/genai`) | ^1.7.0 | AI conversation replies and tone analysis |
| Prisma | ^6.5.0 | Database ORM (PostgreSQL, optional) |
| `@t3-oss/env-nextjs` | ^0.12.0 | Build-time environment variable validation with Zod |
| superjson | ^2.2.1 | Type-preserving JSON serialization for tRPC (Dates, Maps, etc.) |
| react-hook-form + zod | ^7 / ^3 | Form handling and schema validation |
| react-markdown | ^10.1.0 | Render AI markdown responses in the chat |
| Web Speech API | browser native | Speech-to-text input |
| Web Audio API | browser native | PCM-to-WAV conversion and TTS audio playback |
| lucide-react | ^0.525.0 | Icon set |

**Rationale:** The project was bootstrapped with the T3 Stack (`ct3aMetadata.initVersion: 7.39.3`), which bundles Next.js, tRPC, Prisma, and Tailwind as opinionated defaults. tRPC was chosen over a REST API because it eliminates the need to maintain separate type definitions for frontend and backend — the router's input/output types are inferred directly from Zod schemas. Zustand was chosen over React Context or Redux for client state because the chat store has many disparate slices (messages, scenario, emotion history, audio playback state) that benefit from Zustand's selector-based access without forcing re-renders across the entire tree. Framer Motion handles the animated landing page, message entrance animations, and the sliding emotion panel, where CSS transitions alone would require verbose imperative code.

---

## Architecture Overview

The project is a standard T3 Stack monorepo (single Next.js application with a co-located tRPC backend):

```
digiconvo/
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── page.tsx                 # Root — renders LandingPage
│   │   ├── chat/page.tsx            # Main chat experience
│   │   ├── upload/page.tsx          # Screenshot upload / image analysis
│   │   ├── layout.tsx               # Root layout with ThemeProvider
│   │   └── api/trpc/[trpc]/route.ts # tRPC HTTP handler (catch-all)
│   │   └── _components/
│   │       ├── chat/
│   │       │   ├── ChatInterface.tsx # Primary chat UI (input, messages, mic, send)
│   │       │   ├── ChatMessage.tsx
│   │       │   └── TypingIndicator.tsx
│   │       ├── emotion/
│   │       │   └── EmotionPanel.tsx  # Collapsible real-time emotion analysis panel
│   │       ├── sidebar/
│   │       │   └── ScenarioSidebar.tsx # Scenario picker with 7 pre-built scenarios
│   │       ├── landing/
│   │       │   └── LandingPage.tsx  # Animated marketing landing page
│   │       ├── controls/
│   │       │   └── SessionControls.tsx
│   │       ├── welcome/
│   │       │   └── WelcomeScreen.tsx
│   │       ├── theme/
│   │       │   ├── ThemeProvider.tsx
│   │       │   └── ThemeToggle.tsx
│   │       └── ui/                  # Generic UI primitives
│   ├── server/
│   │   ├── api/
│   │   │   ├── root.ts              # tRPC app router (merges all sub-routers)
│   │   │   ├── trpc.ts              # Context creation, publicProcedure, timing middleware
│   │   │   └── routers/
│   │   │       ├── gemini.ts        # AI procedures: getAiScenarioReply, toneAnalysis
│   │   │       └── post.ts          # Prisma example router (T3 scaffold)
│   │   └── db.ts                    # Prisma singleton (global hot-reload safe)
│   ├── stores/
│   │   ├── chat.ts                  # Zustand store — messages, scenario, emotion, audio
│   │   └── theme.ts                 # Zustand store — dark/light mode
│   ├── hooks/
│   │   └── useSpeechToText.ts       # Web Speech API hook
│   ├── lib/
│   │   ├── audioPlayerService.ts    # PCM → WAV conversion + HTMLAudioElement playback
│   │   ├── theme-classes.ts         # Centralised Tailwind class composition helpers
│   │   └── utils.ts
│   ├── trpc/
│   │   ├── react.tsx                # Client-side tRPC provider
│   │   ├── server.ts                # Server-side tRPC caller
│   │   └── query-client.ts          # TanStack Query client config
│   ├── styles/globals.css
│   └── env.js                       # T3 env validation (GEMINI_API_KEY, DATABASE_URL)
├── prisma/
│   └── schema.prisma                # Prisma schema (PostgreSQL, optional)
├── components/
│   ├── ImageUploadForm.tsx          # Screenshot upload form
│   └── ui/                          # Shared button, form, label primitives
├── public/
├── package.json
└── next.config.js
```

### Request Flow: Chat Message

1. The user types (or speaks via the Web Speech API hook) a message in `ChatInterface.tsx`.
2. On send, the component immediately calls `addMessage()` on the Zustand store to render the user message optimistically, then clears the input.
3. Two tRPC mutations fire in parallel:
   - `api.gemini.toneAnalysis.useMutation` — sends the raw text for emotion classification. On success, `setCurrentEmotion()` updates the `EmotionPanel`.
   - `api.gemini.getAiScenarioReply.useMutation` — sends the full message history plus the selected `Scenario` object. On success, `addMessage()` adds the AI reply and, if `audioContent` is returned, `playAiAudio()` is called.
4. Both mutations are routed through the tRPC catch-all API route (`/api/trpc/[trpc]`) to `src/server/api/routers/gemini.ts`, which calls the Gemini API server-side (keeping the API key off the client).
5. If audio is returned, `audioPlayerService.ts` decodes the base64 PCM data, converts it to a WAV `Blob` using a hand-written WAV header encoder, creates an object URL, and plays it via `HTMLAudioElement`.

### Scenarios

Seven pre-built conversation scenarios are defined as static data in `ScenarioSidebar.tsx`. Each `Scenario` object contains:
- `title`, `description`, `category`, `difficulty` (`easy | medium | hard`)
- `persona`: `name`, `personality`, `emotionalTendency`, `gender`, `voiceName`

The persona voice name maps to a Gemini TTS voice. Scenarios include: Relationship Breakup (Alex, hard), Performance Review (Jordan, medium), Friend Conflict (Sam, medium), Family Disagreement (Casey, hard), Team Conflict Resolution (Taylor, medium), Difficult Customer (Morgan, easy), and KnightHacks Hackathon (Faris, hard).

### Emotion Analysis

After every user message, `toneAnalysis` returns an `EmotionAnalysis` object:
```typescript
{
  primaryEmotion: string;   // e.g. "Anxious"
  intensity: number;        // 1–10
  confidence: number;       // 0–100%
  suggestions: string[];    // actionable communication tips
  color: string;            // hex color for the intensity bar
}
```
This is stored in the Zustand store and rendered in `EmotionPanel.tsx` as a live intensity bar, confidence percentage, and a list of suggestion cards. The history of all emotion readings is kept in `emotionHistory[]` for potential session export.

---

## Setup and Install Steps

### Prerequisites

- Node.js 20+, npm 10+
- A Google Gemini API key (`GEMINI_API_KEY`)
- (Optional) PostgreSQL 15+ if using the Prisma database features

### Basic Setup (no database required)

```bash
git clone https://github.com/tomiwaaluko/digiconvo.git
cd digiconvo

# Install dependencies (also runs `prisma generate` via postinstall)
npm install

# Copy the example environment file
cp .env.example .env
# Edit .env and set:
#   GEMINI_API_KEY=your_key_here
#   DATABASE_URL=          # leave blank or omit to skip DB features

npm run dev
# App starts at http://localhost:3000
```

### With PostgreSQL (full persistence)

```bash
# Start a local Postgres instance (Docker helper provided)
./start-database.sh

# Edit .env and set DATABASE_URL=postgresql://...

# Run migrations
npm run db:generate    # prisma migrate dev (creates/updates schema)
# or
npm run db:push        # prisma db push (faster for prototyping)

# Inspect data
npm run db:studio      # Opens Prisma Studio at http://localhost:5555

npm run dev
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Google Gemini API key for chat replies and tone analysis |
| `DATABASE_URL` | No | PostgreSQL connection string; omit to run without a database |
| `NODE_ENV` | No | `development` / `production` (defaults to `development`) |

### Other Commands

```bash
npm run build          # Production build
npm run check          # Lint + type-check
npm run typecheck      # tsc --noEmit
npm run format:write   # Prettier formatting
npm run preview        # Build then start production server
```

---

## Notable Implementation Decisions

### 1. T3 Stack Scaffold with tRPC for Full-Stack Type Safety

The project uses the T3 Stack (`create-t3-app`), which provides zero-configuration wiring between Next.js, tRPC v11, TanStack Query, Prisma, and Tailwind. The key benefit is that the Gemini router's Zod input/output schemas are the single source of truth for both the server handler and the React Query mutation hooks in `ChatInterface.tsx` — there are no duplicated type definitions or manual `fetch` calls.

### 2. Parallel Gemini Calls for Reply and Tone Analysis

The chat handler fires two Gemini mutations simultaneously: one for the conversational AI reply (`getAiScenarioReply`) and one for emotional tone analysis (`toneAnalysis`). These are intentionally not awaited sequentially, so the emotion panel updates as soon as tone analysis completes while the chat reply is still being generated. This keeps the UI feeling responsive even if one call is slower.

### 3. Hand-Written PCM to WAV Conversion

When Gemini's TTS returns audio, it delivers raw PCM data (base64-encoded, 16-bit little-endian, 24000 Hz). The browser cannot play raw PCM directly, so `audioPlayerService.ts` implements a complete WAV file writer in plain TypeScript: it constructs the 44-byte RIFF/WAVE/fmt/data header using a `DataView`, normalises the Int16 samples to Float32, and wraps the result in a `Blob`. A `URL.createObjectURL()` hands it to `HTMLAudioElement` for playback. Object URLs are explicitly revoked after playback to prevent memory leaks.

### 4. Zustand Store as the Single Source of Truth for Chat State

Rather than threading state through React props or React Context, all mutable chat state — message history, current scenario, emotion history, audio playback flags, sidebar visibility, emotion panel visibility — lives in a single Zustand store (`src/stores/chat.ts`). Components subscribe to only the slices they need, and actions like `clearCurrentScenario()` reset multiple state fields atomically. The `startNewSession()` action generates a new `crypto.randomUUID()` session ID, enabling future server-side session persistence with a single change point.

### 5. Theme System via Centralised Class Composition

Rather than scattering raw Tailwind class strings throughout components, `src/lib/theme-classes.ts` exports a structured `themeClasses` object (e.g. `themeClasses.background`, `themeClasses.buttonSecondary`, `themeClasses.typography.xl`) and a `cx()` helper. A `composeButton()` and `composeInput()` factory produces full class strings for variants. This makes dark mode and theme changes a single-file edit rather than a grep-and-replace across every component.

### 6. Database is Optional

The `DATABASE_URL` environment variable is marked `.optional()` in `src/env.js`, and the Prisma client is accessed only through the tRPC context. The core features — AI chat, emotion analysis, speech, TTS — work entirely without a database. This was a deliberate choice to enable rapid hackathon development and deployment on hosts that do not provide a PostgreSQL instance.

### 7. T3 Timing Middleware in Development

`src/server/api/trpc.ts` includes a `timingMiddleware` that adds a random 100–500ms artificial delay to all tRPC procedures in development. This simulates realistic network latency and surfaces unwanted sequential waterfall requests early, before they appear in production profiling. The middleware also logs `[TRPC] {path} took {n}ms` to the console for every procedure call.


## Resume Bullet Points

- Led end-to-end development of an emotional intelligence conversation training platform as project lead, architecting a full T3 Stack application (Next.js 15, tRPC, Prisma, Zustand) with Gemini-powered AI scenario responses.
- Implemented parallel Google Gemini API calls for simultaneous text generation and emotion analysis, and engineered a custom PCM-to-WAV encoder running entirely in the browser for audio playback without external dependencies.
- Designed a centralized Zustand store as the application state hub, enabling real-time emotion panel updates synchronized with AI response streaming across multiple independent UI components.
