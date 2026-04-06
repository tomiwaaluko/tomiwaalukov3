# DigiConvo — System Design Architecture

## Overview
AI-powered conversation practice platform for developing emotional intelligence and communication skills. Users practice difficult conversations with AI personas that respond in character, with real-time emotion analysis, voice I/O, and session feedback. Built on the T3 Stack.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Turbo) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 + Framer Motion v12 |
| API Layer | tRPC v11 (end-to-end type-safe API) |
| Data Fetching | TanStack Query v5 |
| State Management | Zustand v5 |
| AI | Google Gemini (`@google/genai` v1.7 + `@google/generative-ai` v0.24) |
| Voice I/O | Web Speech API (browser-native STT + TTS) |
| Markdown | react-markdown |
| UI Primitives | Radix UI (label, slot) + Lucide React |
| Forms | React Hook Form v7 |
| ORM | Prisma v6 (optional — for session persistence) |
| Database | PostgreSQL via Supabase (optional) |
| Validation | Zod v3 |

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│            Next.js 15 App (Vercel)                          │
│                                                              │
│  /           → Landing page with scenario selection         │
│  /chat       → Main conversation interface                  │
│  /upload     → Conversation screenshot analysis page        │
└──────────────────────────────────────────────────────────────┘
         │                          │
         ▼ tRPC client              ▼ Web Speech API (browser)
┌──────────────────────────────────────────────────────────────┐
│              Zustand State Stores                           │
│  conversationStore: messages, persona, emotion timeline     │
│  sessionStore: current scenario, history                    │
└────────────────────────┬─────────────────────────────────────┘
                         │ tRPC routers
                         ▼
┌──────────────────────────────────────────────────────────────┐
│               tRPC Server Routers                           │
│               server/api/routers/                           │
│                                                              │
│  chat router       → send message → Gemini → AI response   │
│  emotion router    → analyze emotion → Gemini               │
│  upload router     → analyze screenshot → Gemini            │
│  session router    → save/load conversation sessions        │
└────────────────────────┬─────────────────────────────────────┘
                         │ Google Gemini SDK
                         ▼
┌──────────────────────────────────────────────────────────────┐
│               Google Gemini API                            │
│                                                              │
│  lib/gemini.ts (service wrapper)                            │
│                                                              │
│  Chat: Persona-aware responses (system prompt per scenario) │
│  Emotion analysis: detects emotions in conversation turns   │
│  Upload analysis: analyzes conversation screenshots         │
└────────────────────────┬─────────────────────────────────────┘
                         │ Prisma ORM (optional)
                         ▼
┌──────────────────────────────────────────────────────────────┐
│          PostgreSQL / Supabase (optional persistence)       │
│  Conversation sessions · Message history                    │
└──────────────────────────────────────────────────────────────┘
```

---

## Pre-Built Conversation Scenarios

| Category | Scenario |
|---|---|
| Personal | Breakup Conversation |
| Professional | Job Interview |
| Social | Friend Conflict |
| Family | Parent Discussion |
| Professional | Team Conflict Resolution |
| Professional | Difficult Customer |

Each scenario has a distinct AI persona with defined emotional tendencies, communication style, and response patterns baked into the system prompt.

---

## Key Features

| Feature | Implementation |
|---|---|
| Persona AI | Gemini generates responses in-character per scenario |
| Emotion Analysis | Real-time panel showing emotion detection per conversation turn |
| Emotion Timeline | Visual timeline of emotional shifts throughout session |
| Voice Input | Web Speech API — speech-to-text in browser |
| Voice Output | Web Speech API — text-to-speech for AI responses |
| Screenshot Upload | Upload a conversation screenshot → Gemini analyzes communication patterns |
| Session Export | Save/export full conversation transcript |
| Dark/Light Mode | Theme toggle with localStorage persistence |
| Responsive Design | Mobile + desktop layout |

---

## Component Architecture

```
src/app/_components/
├── chat/              # Message bubbles, input bar, conversation display
├── emotion/           # Real-time emotion panel + timeline chart
├── landing/           # Scenario selection grid
├── sidebar/           # Session history, scenario switcher
└── ui/                # Base UI components (Button, Input, etc.)

src/app/
├── chat/              # /chat page
└── upload/            # /upload page

src/
├── hooks/             # useConversation, useVoice, useEmotion
├── lib/
│   └── gemini.ts      # Gemini API service (chat + emotion + upload)
├── server/api/routers/
│   ├── chat.ts        # tRPC chat router
│   ├── emotion.ts     # tRPC emotion analysis router
│   └── session.ts     # tRPC session router
└── stores/
    ├── conversationStore.ts  # Zustand: messages, persona, emotion
    └── sessionStore.ts       # Zustand: active scenario, history
```

---

## Conversation Flow

```
1. User selects scenario on landing page
2. System prompt configured for chosen persona (emotional style, role)
3. User types message (or speaks via Web Speech API STT)
4. tRPC chat route sends conversation history + new message to Gemini
5. Gemini returns in-character response
6. Simultaneously: emotion analysis tRPC route analyzes latest turn
7. Response displayed (+ optionally spoken via TTS)
8. Emotion panel updates with detected emotion + timeline appends entry
9. Session optionally saved to Prisma/PostgreSQL
```

---

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Google Gemini API access |
| `DATABASE_URL` | Optional | PostgreSQL for session persistence |

---

## Deployment

| Concern | Platform |
|---|---|
| App | Vercel (T3 Stack optimized) |
| Database | Supabase Cloud (optional) or local PostgreSQL |
| Local DB | `./start-database.sh` |
| Build | `npm run build` |
