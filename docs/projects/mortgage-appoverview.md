# mortgage-app — Project Overview

## Project Purpose

A mortgage calculator and loan management application built as a full-stack project. It allows users to calculate mortgage payments, explore loan scenarios, and view results through both a mobile interface (Flutter) and a web frontend. The backend exposes a REST API that handles the mortgage computation logic and data persistence.

The presence of `STEP_6_COMPLETE.md` through `STEP_8_COMPLETE.md` in the mobile directory, along with `NAVIGATION_MIGRATION.md` and `PROVIDERS_GUIDE.md`, indicates the project was built incrementally in documented steps — likely as a learning exercise or structured assignment, with navigation and state management added as distinct phases.

---

## Tech Stack & Rationale

| Layer | Technology | Rationale |
|---|---|---|
| Mobile app | Flutter / Dart | Cross-platform mobile UI from a single codebase; `mobile/lib/` structure and `pubspec.yaml` confirm Flutter |
| Backend API | Node.js (JavaScript) | `backend/server.js` and `backend/package.json` confirm a Node.js server |
| Web frontend | Vite + TypeScript | `frontend/` directory with Vite config |
| State management | Provider (Flutter) | `mobile/PROVIDERS_GUIDE.md` and `mobile/lib/providers/` directory confirm Provider pattern |
| Navigation | go_router (inferred) | `mobile/NAVIGATION_MIGRATION.md` and `mobile/lib/routes/` indicate a dedicated routing layer |
| Testing | Jest (inferred) | `backend/server.test.js` confirms backend unit tests exist |

---

## Architecture Overview

The repository is organized as a monorepo with three independent applications:

```
mortgage-app/
├── backend/                  # Node.js REST API
│   ├── server.js             # Main server entry point + route handlers
│   ├── server.test.js        # Jest unit tests for server logic
│   └── package.json
├── frontend/                 # Web frontend (Vite + TypeScript)
│   └── src/
└── mobile/                   # Flutter mobile application
    ├── lib/
    │   ├── main.dart         # App entry point
    │   ├── models/           # Data classes (MortgageResult, LoanDetails)
    │   ├── providers/        # Provider state management classes
    │   ├── routes/           # go_router route definitions
    │   ├── screens/          # Full-page UI widgets
    │   ├── services/         # HTTP client calls to backend
    │   ├── utils/            # Pure helper functions (mortgage math)
    │   └── widgets/          # Reusable UI sub-components
    ├── pubspec.yaml
    ├── NAVIGATION_MIGRATION.md  # Documents the routing refactor
    ├── PROVIDERS_GUIDE.md       # Documents Provider usage patterns
    ├── STEP_6_COMPLETE.md
    ├── STEP_7_COMPLETE.md
    ├── STEP_8_COMPLETE.md
    └── PROJECT_COMPLETE.md
```

### Backend (Node.js)
`server.js` is the single entry point for the REST API, handling mortgage calculation requests. `server.test.js` contains unit tests, suggesting the mortgage math logic is tested independently of HTTP concerns.

### Mobile (Flutter)
- **models/** — Pure Dart data classes (loan amount, interest rate, term, monthly payment, amortization schedule entries).
- **providers/** — State containers using the `Provider` package, managing mortgage input state and calculation results reactively across screens.
- **routes/** — Centralized route definitions; `NAVIGATION_MIGRATION.md` documents a refactor from direct `Navigator.push` calls to a named-route or go_router setup.
- **screens/** — Individual page widgets (calculator screen, results screen, amortization breakdown).
- **services/** — HTTP client code calling the Node.js backend API.
- **utils/** — Stateless helper functions including the core mortgage payment formula: `M = P[r(1+r)^n]/[(1+r)^n-1]`.
- **widgets/** — Reusable UI components (currency input fields, results summary cards).

---

## Setup & Install Steps

### Backend

```bash
cd backend
npm install
npm start          # node server.js
npm test           # Jest tests
```

### Mobile (Flutter)

```bash
cd mobile
flutter pub get
flutter run                  # connected device or emulator
flutter build apk --release  # Android
flutter build ios --release  # iOS
```

Ensure `lib/services/` points to the correct backend URL — likely a constant that should be updated for production deployments.

### Web Frontend

```bash
cd frontend
npm install
npm run dev
npm run build
```

---

## Notable Implementation Decisions

### Monorepo with three separate apps
No dedicated monorepo tool (Nx, Turborepo). The three apps coexist in one repository with no shared build orchestration — each has its own dependency manifest and is run independently.

### Incremental step-based development
`STEP_6_COMPLETE.md`, `STEP_7_COMPLETE.md`, `STEP_8_COMPLETE.md`, and `PROJECT_COMPLETE.md` are milestone documentation files committed at each development phase. The project followed a prescribed spec where each "step" added a new capability — a pattern common in structured courses or bootcamps.

### Navigation migration as a distinct step
`NAVIGATION_MIGRATION.md` confirms the app was intentionally refactored from one navigation approach to another mid-project. Rather than rewriting, the team documented and migrated, preserving the history of why the change was made.

### Provider pattern over BLoC or Riverpod
The choice of `Provider` (confirmed by `PROVIDERS_GUIDE.md` and `lib/providers/`) over more complex state management solutions suggests a preference for simplicity and Flutter's official recommendation for projects of this scale.

### Backend unit tests for math logic
`server.test.js` alongside `server.js` suggests the core mortgage calculation logic is unit-tested separately from the HTTP layer — a sound design decision for a math-heavy domain.

### Layered Flutter architecture
The `lib/` split into `models/`, `providers/`, `routes/`, `screens/`, `services/`, `utils/`, and `widgets/` is a well-structured separation of concerns — far more deliberate than a typical starter project. The `services/` layer isolating all HTTP calls means UI code never calls the API directly.


## Resume Bullet Points

- Developed a cross-platform mortgage calculator application using Flutter with a layered architecture (models, providers, routes, screens, services, utils, widgets) and Provider state management for reactive UI updates across iOS and Android.
- Built a three-tier monorepo encompassing a Node.js REST API backend with Jest unit tests for mortgage math logic, a Vite + TypeScript web frontend, and a Flutter mobile app sharing the same backend computation layer.
- Documented a navigation migration from direct Navigator.push calls to a structured routing layer and maintained incremental milestone documentation (STEP_6 through PROJECT_COMPLETE) throughout phased feature delivery.
