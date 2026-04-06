# AirFryHub — Project Overview

## Project Purpose

AirFryHub is a community forum web application centered on air fryer cooking. Users can share recipes, tips, food photos, and links; upvote posts they find useful; and comment on others' contributions. The project was built as a web development final project by Olatomiwa Aluko, with design inspiration drawn from Vercel, Linear, and Stripe.

The app operates without mandatory account creation: anonymous authentication via Supabase means any visitor immediately gets a persistent session identity, so they can post, vote, and comment without signing up. Ownership of posts is tracked silently through this anonymous user ID, enabling edit and delete controls to appear only for the original poster.

---

## Tech Stack & Rationale

| Layer | Technology | Version | Why chosen |
|---|---|---|---|
| UI framework | React | 19.1 | Industry-standard component model; latest concurrent rendering features |
| Build tool | Vite | 7.1 | Fast HMR and ES-module-native bundling |
| Language | TypeScript | — | Type safety across components and Supabase query return shapes |
| Styling | Tailwind CSS | v4 | Utility-first, zero runtime CSS; v4 uses the PostCSS plugin directly |
| Routing | React Router DOM | 7.8 | Client-side SPA routing for Feed, CreatePost, PostPage, and EditPost |
| Backend-as-a-service | Supabase | 2.54 | PostgreSQL database, anonymous auth, file Storage — no custom backend server needed |
| Data fetching/caching | TanStack Query (React Query) | 5.84 | Declarative server-state management with automatic cache invalidation after mutations |
| Validation | Zod | 4.0 | Schema-first validation; inferred TypeScript types flow directly into form state |

---

## Architecture Overview

The repo root contains only a `.gitattributes` file and a single `finalproject/` subdirectory, which holds the entire application.

```
finalproject/
├── index.html                  # Vite HTML shell
├── src/
│   ├── main.jsx                # React DOM root
│   ├── App.jsx                 # QueryClientProvider + BrowserRouter + layout shell
│   ├── pages/
│   │   ├── Feed.tsx            # Home: post list with search, sort, and flag filter chips
│   │   ├── CreatePost.tsx      # New post form with image upload and link preview
│   │   ├── PostPage.tsx        # Individual post detail, comments, and upvote button
│   │   └── EditPost.tsx        # Edit form restricted to post owner
│   ├── components/
│   │   ├── FilterChips.tsx     # Reusable category chip buttons
│   │   ├── FlagDisplay.tsx     # Renders flag badges on a post card
│   │   ├── FlagSelector.tsx    # Multi-select flag picker used in create/edit forms
│   │   ├── ImageUpload.tsx     # Drag-and-drop upload to Supabase Storage with simulated progress
│   │   ├── LinkPreview.tsx     # URL card preview (fetches favicon + mocked open-graph metadata)
│   │   └── ThemeToggle.tsx     # Dark/light mode button
│   ├── hooks/
│   │   ├── useOwner.ts         # Manages anonymous Supabase auth session; exposes userId
│   │   └── useTheme.ts         # Reads/writes localStorage theme preference
│   └── lib/
│       ├── supabase.ts         # Supabase client singleton
│       └── validations.ts      # Zod schemas: createPostSchema, commentSchema
```

**Data flow:** Components query and mutate Supabase directly — no custom API layer. TanStack Query wraps every Supabase call with a `queryKey` for automatic cache invalidation. The `useOwner` hook calls `supabase.auth.signInAnonymously()` on mount if no existing session is found.

**Database tables:**
- `posts` — id, title, content, image_url, link_url, flags (text array), user_id, created_at, upvotes
- `comments` — id, content, user_id, post_id, created_at

**Supabase stored procedure:** `increment_upvotes(post_id uuid)` atomically increments upvotes, called via `supabase.rpc(...)` in PostPage.

---

## Setup & Install Steps

### Prerequisites
- Node.js 18+
- A Supabase project with:
  - `posts` and `comments` tables (columns listed above)
  - `increment_upvotes(post_id uuid)` stored procedure
  - An `images` storage bucket set to public
  - Anonymous authentication enabled under Auth → Providers

### Steps

```bash
git clone https://github.com/tomiwaaluko/airfryhub.git
cd airfryhub/finalproject
npm install
cp .env.example .env
# Fill in:
# VITE_SUPABASE_URL=https://<your-project>.supabase.co
# VITE_SUPABASE_ANON_KEY=<your-anon-key>
npm run dev
# → http://localhost:5173
```

Production build:
```bash
npm run build && npm run preview
```

---

## Notable Implementation Decisions

### Anonymous authentication as the identity primitive
`useOwner.ts` calls `supabase.auth.signInAnonymously()` on first visit. Supabase persists this session in localStorage so the identity survives reloads. Post ownership is enforced client-side by comparing `post.user_id === userId` — no route guards needed.

### Zod validation before database writes
`createPostSchema` and `commentSchema` are run through `schema.safeParse()` before any Supabase `.insert()`. Field-level errors from `result.error.issues` render inline next to each field.

### Simulated upload progress bar
The Supabase JS client doesn't emit upload progress events. `ImageUpload.tsx` starts a `setInterval` incrementing a progress state by 10% every 100 ms, capping at 90%, then jumping to 100% when the upload promise resolves.

### Dual image input paths (file upload + URL paste)
CreatePost offers both drag-and-drop upload and a URL text field. Both paths write into the same `imageUrl` state — file uploads go to Supabase Storage and its public URL is placed into that state, making both paths interchangeable downstream.

### TanStack Query `queryKey` includes all filter parameters
Every read's `queryKey` includes active filter params — `["posts", searchTerm, sortBy, selectedFilters]`. Changing any filter causes React Query to treat it as a new cache entry and fetch immediately. No manual `refetch()` calls needed. `queryClient.invalidateQueries({ queryKey: ["posts"] })` after mutations clears all post-related cache in one call.

### Flag system backed by a Postgres array column
Posts carry an array of string tags (`flags`): Recipe, Tip, Question, Review, Beginner. Supabase's `.contains("flags", selectedFilters)` array operator filters in the database, so only matching rows transfer over the wire. Multiple filters are ANDed.

### Theme persistence without a React context provider
`useTheme.ts` reads `localStorage.getItem("airfryhub-theme")` on mount, falls back to `prefers-color-scheme`, and toggles `document.documentElement.classList` for the `"dark"` class. Tailwind's `dark:` prefix handles all conditional styling — no React context, no runtime style injection.


## Resume Bullet Points

- Built a full-stack community forum SPA using React 19, Vite 7, TypeScript, and Supabase, implementing anonymous authentication so users can post, vote, and comment without account creation while tracking post ownership client-side.
- Engineered TanStack Query data fetching with filter-inclusive queryKey arrays enabling automatic cache invalidation on any filter change without manual refetch calls; used Supabase array-column containment for multi-tag server-side filtering.
- Designed a dual-input image system (drag-and-drop file upload + URL paste) with simulated progress feedback, and a Zod validation layer running safeParse before every database write to surface inline field-level errors.
