# PullUp — Campus Events Mobile App — Project Overview

## Project Purpose

**PullUp** is a campus events mobile app for college students. Students discover and RSVP to events; student organizations create and manage events. The app bridges the gap between student orgs and members by providing a centralized event feed with real-time updates, RSVP tracking, calendar export, and organization management tools.

Two distinct user roles:
- **Members** — browse the event feed, RSVP, save events, follow organizations, view their own profile and RSVP history
- **Organizations** — register an org, create and publish events, view attendee lists, manage drafted events

Any authenticated user can register an organization. Users switch fluidly between their member view and an org dashboard within the same app session.

---

## Tech Stack & Rationale

| Technology | Version | Role |
|---|---|---|
| **React Native** | 0.81.5 | Cross-platform mobile UI for iOS and Android from one codebase |
| **Expo** | ^54.0.33 | Managed workflow: EAS Build, expo-av, expo-font, expo-router, OTA updates |
| **TypeScript** | — | End-to-end type safety across components, hooks, and Supabase query results |
| **Expo Router** | ~6.0.23 | File-based routing analogous to Next.js App Router; supports nested layouts and route groups |
| **Supabase** (`@supabase/supabase-js`) | ^2.49.1 | PostgreSQL database (PostgREST), Auth (email/Google/Apple OAuth), Realtime subscriptions, Storage |
| **TanStack Query** (`@tanstack/react-query`) | ^5.62.0 | Server-state management with automatic background refetch and cache invalidation |
| **React Navigation** | ^7.x | Bottom tab navigator (`@react-navigation/bottom-tabs`) for member-facing tab bar |
| **expo-av** | ~16.0.8 | Audio/video playback for event media |
| **expo-linear-gradient** | ~15.0.8 | Gradient backgrounds on cards and headers |
| **@expo-google-fonts/fredoka-one** | ^0.2.3 | Custom brand font |
| **Sentry** (`@sentry/react-native`) | ~7.2.0 | Error tracking and crash reporting |
| **Jest + React Native Testing Library** | — | 21 tests across 7 suites |
| **EAS Build** | — | Cloud builds for iOS and Android; bypasses local Xcode/Android Studio setup |

**Why Expo Router over React Navigation alone:** File-based routing mirrors how the web team (using Next.js App Router) thinks about routing, unifying the mental model. It also makes deep linking and route-based code splitting straightforward without additional configuration.

**Why Supabase over custom backend:** Row-Level Security (RLS) enforced at the database layer means the app can use PostgREST directly without a custom API server for most reads. Realtime subscriptions cover the event feed live-update use case. Auth handles email, Google, and Apple OAuth with a single SDK.

---

## Architecture Overview

```
pullup/
├── app/                        # Expo Router file-based routes
│   ├── _layout.tsx             # Root layout: SessionProvider, QueryClient
│   ├── (auth)/                 # Unauthenticated routes (sign-in, sign-up)
│   ├── (onboard)/              # First-time user onboarding flow
│   ├── (org)/                  # Organization dashboard routes
│   ├── (tabs)/                 # Member tab bar routes
│   │   ├── _layout.tsx         # Bottom tab navigator definition
│   │   ├── index.tsx           # Home / event feed
│   │   ├── rsvps.tsx           # My RSVPs list
│   │   └── profile.tsx         # Member profile
│   ├── events/                 # Event detail screens (shared between member + org views)
│   └── org/                    # Org-specific pages (event creation, attendee management)
├── components/
│   ├── AddToCalendar.tsx       # Generates ICS link + calls Linking.openURL
│   ├── Button.tsx              # Themed button with loading state
│   ├── Card.tsx                # Generic card container
│   ├── Chip.tsx                # Category/tag badge
│   ├── EmptyState.tsx          # Empty list placeholder with icon + CTA
│   ├── EventCard.tsx           # Event list item with image, title, date, RSVP count
│   ├── EventFilters.tsx        # Category and date filter chips
│   ├── HeaderBackButton.tsx    # Custom back button for nested screens
│   ├── Input.tsx               # Themed text input
│   └── Loading.tsx             # Skeleton / spinner components
├── lib/
│   ├── supabase.ts             # Supabase client singleton (reads EXPO_PUBLIC_ env vars)
│   ├── auth-context.tsx        # React context: current session, signIn, signOut, loading
│   ├── query-client.ts         # TanStack QueryClient config (staleTime, retry policy)
│   ├── org-context.tsx         # Current org identity context for org dashboard views
│   ├── analytics.ts            # Sentry breadcrumb helpers
│   ├── calendar.ts             # ICS generation for AddToCalendar
│   ├── export-csv.ts           # Attendee list CSV export for org admins
│   └── types.ts                # Shared TypeScript interfaces (Event, Org, Member, RSVP)
├── hooks/                      # Custom React hooks (useFeed, useRsvp, useOrg, etc.)
├── constants/                  # Design tokens (colors, spacing, typography)
├── supabase/
│   └── migrations/             # SQL migration files for the Supabase project
├── __tests__/                  # Jest test suites
├── docs/implementation/        # Step-by-step implementation guides (01–06)
└── roadmap.md                  # Feature roadmap
```

### Security Model
Row-Level Security (RLS) is enforced at the database layer, not the application layer. Events with `status = 'published'` are publicly readable; drafts are visible only to the creator org. RSVPs, saved events, and org follows are scoped to the owning user via `auth.uid()` in RLS policies. The app's Supabase client uses the `anon` key; it never has elevated privileges.

### Data Flow
Components use custom hooks that wrap TanStack Query's `useQuery` and `useMutation`. The hooks call the Supabase JS client directly — no custom API server. TanStack Query handles caching, background refetch, and optimistic updates. The `lib/query-client.ts` sets a global `staleTime` so the event feed doesn't refetch on every tab switch.

---

## Setup & Install Steps

### Prerequisites
- Node.js 18+, Expo CLI (`npm install -g expo-cli`)
- A Supabase project with Auth enabled (email, Google, Apple providers)
- EAS CLI for builds (`npm install -g eas-cli`) — optional for local dev

```bash
git clone https://github.com/tomiwaaluko/pullup.git
cd pullup
npm install
```

Create a `.env` file at the root:
```
EXPO_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SENTRY_DSN=<your-sentry-dsn>   # optional
```

Apply database migrations:
```bash
npx supabase db push    # or run migration files in supabase/migrations/ manually
```

Start the dev server:
```bash
npx expo start            # Expo Go or dev build on physical device
npx expo start --ios      # iOS simulator
npx expo start --android  # Android emulator
```

Run tests:
```bash
npm test                  # 21 Jest tests across 7 suites
npm run test:coverage     # with coverage report
```

Build for production (EAS):
```bash
eas build --platform ios
eas build --platform android
```

---

## Notable Implementation Decisions

### File-based routing with Expo Router route groups
The four route groups `(auth)`, `(onboard)`, `(org)`, and `(tabs)` are Expo Router "groups" — they don't appear in the URL/path but allow sharing layouts. The member tab bar (`(tabs)/_layout.tsx`) wraps only the three member screens; organization screens in `(org)/` get their own layout without the tab bar, so the UI is contextually appropriate for each role.

### Supabase RLS as the authorization layer
No authorization logic exists in application code — all data access rules are expressed as PostgreSQL RLS policies. A member cannot read another member's draft RSVP because the database policy for `rsvps` table is `USING (auth.uid() = user_id)`. This means even if a client-side bug constructs a query for the wrong user, the database silently returns zero rows.

### TanStack Query for all server state
All Supabase data reads go through `useQuery` hooks with explicit `queryKey` arrays. This provides: automatic background refetch when the app comes back to the foreground, stale-while-revalidate behavior for fast perceived performance, and a single `queryClient.invalidateQueries()` call after an RSVP mutation to update all relevant lists simultaneously.

### `AddToCalendar` via ICS + `Linking.openURL`
Rather than integrating a native calendar API (which requires additional Expo modules and permissions), the `AddToCalendar` component generates a `.ics` file URL and calls `Expo.Linking.openURL()`. On iOS and Android, this opens the native calendar app and prompts the user to add the event — no calendar permissions required, and no native module to maintain.

### CSV export for org admins
`lib/export-csv.ts` generates a CSV string from the attendee list query result and saves it to the device's file system via Expo FileSystem, then shares it via the native share sheet. This gives org admins a practical tool for checking people in at events without needing a dedicated check-in interface in the MVP.

### Step-based implementation docs in `docs/implementation/`
The `docs/implementation/` directory contains six numbered markdown guides (`01-project-setup.md` through `06-design-testing-operations.md`) that define the full implementation plan. Each guide has tasks, file structures, and success criteria. This mirrors the mortgage-app step-based pattern and documents architectural decisions made during development.

### Sentry for mobile crash reporting
`@sentry/react-native` is integrated from day one rather than added later. Mobile crash rates are harder to observe than web errors (no browser console), so Sentry breadcrumbs in `lib/analytics.ts` capture the user action trail leading to any crash. `SENTRY_DSN` is optional so contributors without a Sentry account can still run the app.


## Resume Bullet Points

- Built a cross-platform campus events mobile app using React Native + Expo with file-based Expo Router navigation, Supabase Auth (email/Google/Apple OAuth), and TanStack Query for server-state management across Member and Organization user roles.
- Enforced authorization exclusively at the PostgreSQL database layer via Row-Level Security policies, ensuring draft events and private RSVPs are never returned to unauthorized clients regardless of client-side query construction.
- Developed 21 Jest + React Native Testing Library tests across 7 suites, integrated Sentry crash reporting from day one, and built a CSV attendee export feature via Expo FileSystem and the native share sheet for organization admin workflows.
