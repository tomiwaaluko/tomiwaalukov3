# POOSD-Small-Project — Project Overview

## Project Purpose

A full-stack contact management web application built by Group 2 for UCF's COP4331c (Processes of Object-Oriented Software Development) course. Users can register, log in, and manage a personal address book: searching, adding, editing, and deleting contacts. The app is branded as "Contact Manager" / "Team 2's Professional Contact Hub" in the UI.

The application is deployed against a live backend at `https://luisalban.xyz`.

---

## Tech Stack & Rationale

| Layer | Technology | Version | Why |
|---|---|---|---|
| Frontend framework | React | ^19.1.1 | Component-based UI; team familiarity |
| Language | TypeScript | ~5.8.3 | Type safety for API response shapes and component props |
| Routing | React Router DOM | ^7.9.1 | Client-side SPA routing with declarative `<Routes>` |
| Build tool | Vite | ^7.1.2 | Fast HMR; handles the dev-proxy to LAMPAPI |
| Backend language | PHP | (server-defined) | LAMP stack is the course's prescribed server environment |
| Database | MySQL | (server-defined) | Course-standard; database named `CONTACTS`, table is `Users` |

The Vite dev server is configured with a proxy so that requests to `/LAMPAPI/*` forward to `https://luisalban.xyz`, avoiding CORS issues during local development:

```ts
server: {
  proxy: {
    '/LAMPAPI': {
      target: 'https://luisalban.xyz',
      changeOrigin: true,
      secure: false
    }
  }
}
```

---

## Architecture Overview

```
POOSD-Small-Project/
├── src/                      # React/TypeScript frontend (SPA)
│   ├── main.tsx              # ReactDOM.createRoot entry point
│   ├── App.tsx               # Router root — defines the 3 routes
│   ├── Login.tsx             # /  (root path)
│   ├── Signup.tsx            # /signup
│   ├── Contacts.tsx          # /contacts  (authenticated page)
│   ├── config/               # Shared config (API_URL constant)
│   └── App.css / Contacts.css
└── LAMPAPI/                  # PHP REST API endpoints (deployed on luisalban.xyz)
    ├── config.php            # DB constants + shared helpers (CORS, JSON helpers)
    ├── Login.php
    ├── Register.php
    ├── AddContact.php
    ├── DeleteContact.php
    ├── EditContacts.php
    └── SearchContacts.php
```

### Frontend

`App.tsx` declares four routes: `/` → `Login`, `/signup` → `Signup`, `/contacts` → `Contacts`, `*` → redirect to `/`.

**Login.tsx** — posts `{ login, password }` as JSON to `${API_URL}/Login.php`. On success (`data.error === ""`), stores `userId` and `userName` in `localStorage` and redirects to `/contacts` after a 2-second delay via `setTimeout`. Uses a `LoginResponse` interface (`{ id, firstName, lastName, error }`) for type-safe response parsing.

**Signup.tsx** — posts `{ firstName, lastName, login, password }` to `Register.php`. Unlike Login, it calls `response.text()` first then manually `JSON.parse`s with a try/catch — defensive handling added after encountering PHP error pages during development.

**Contacts.tsx** — the main authenticated view. On mount reads `userId` from `localStorage`; if absent, redirects to `/`. Key behaviors:
- **Search**: posts `{ search: term, userId }` to `SearchContacts.php`. An empty string fetches all contacts.
- **Add**: modal form posts `{ firstName, lastName, phone, email, userId }` to `AddContact.php`.
- **Edit**: builds a diff-only `updates` object containing only changed fields; aborts client-side with "No changes made" if nothing changed.
- **Delete**: calls `window.confirm` before posting `{ firstName, lastName, userId }` to `DeleteContact.php`.

The `Contact` TypeScript interface is `{ firstName, lastName, phone, email }` — no client-visible primary key.

### Backend (LAMPAPI — PHP + MySQL)

`config.php` defines all shared infrastructure:
- **CORS headers** — `setCorssHeaders()` (note the typo) emits `Access-Control-Allow-Origin: *`
- **Preflight handling** — `handlePreflight()` responds to OPTIONS and exits
- **JSON input** — `getRequestInfo()` reads from `php://input` and `json_decode`s it
- **DB constants**: `DB_HOST=localhost`, `DB_USER=admin`, `DB_PASS=1234`, `DB_NAME=CONTACTS`

`Login.php` uses a MySQLi prepared statement querying `Users WHERE Login=? AND Password=?`, returning `ID`, `firstName`, `lastName`. Passwords are stored and compared in plain text — a course-project shortcut.

---

## Setup & Install Steps

### Frontend

```bash
git clone https://github.com/tomiwaaluko/POOSD-Small-Project.git
cd POOSD-Small-Project
npm install
npm run dev        # Vite proxy auto-forwards /LAMPAPI/* to luisalban.xyz
npm run build      # production build
```

### Backend (self-hosting)

1. Copy `LAMPAPI/` to your web server's document root.
2. Create a MySQL database `CONTACTS` with a `Users` table (columns: `ID`, `Login`, `Password`, `firstName`, `lastName`).
3. Update credentials in `config.php`.
4. Update the `vite.config.ts` proxy target and any hardcoded `luisalban.xyz` references.

---

## Notable Implementation Decisions

### Dual API URL strategy
`Login.tsx` imports `API_URL` from `src/config/api`, but `Signup.tsx` and `Contacts.tsx` hardcode `https://luisalban.xyz/LAMPAPI/...` directly. The config abstraction was added but not consistently applied across all components.

### Typo in Contacts.tsx API path
The fetch URLs in `Contacts.tsx` use `/LAMPAAPI/` (double-A) — e.g., `https://luisalban.xyz/LAMPAAPI/SearchContacts.php` — while the actual deployed directory is `LAMPAPI`. This works only because the live server has a matching alias or directory under the misspelled name.

### Diff-only edit payload
`handleSaveEdit` compares each field against the original contact values and only includes changed fields in `updates`. If nothing changed, the request is skipped and the user sees "No changes made." This avoids unnecessary writes.

### Name-based contact identity
Contacts have no client-visible numeric ID. Edits and deletes identify a record by `{ firstName, lastName }` — meaning two contacts with identical names would be ambiguous. A deliberate simplification for course-project scope.

### Plain-text password storage
`Login.php` queries `WHERE Login=? AND Password=?` with no hashing. `config.php` also hard-codes `DB_PASS=1234`. Acknowledged course-project shortcuts not suitable for production.

### Two-second redirect delay on auth success
Both `Login.tsx` and `Signup.tsx` display a success message then invoke `window.location.href = "/contacts"` inside `setTimeout(..., 2000)`, giving users visible feedback before the page transitions.

### Raw-text response parsing in Signup.tsx
`Signup.tsx` calls `response.text()` then manually parses with `JSON.parse`, catching parse errors and logging the raw text truncated to 100 characters. Defensive handling added after encountering PHP error pages.

### Typo in shared CORS helper name
`setCorssHeaders()` (double-s) is called by the same misspelled name in every PHP endpoint file — the typo is consistently baked into the entire backend.


## Resume Bullet Points

- Developed a full-stack contact management SPA for UCF's COP4331c course using React 19, TypeScript, and React Router 7, backed by a PHP/MySQL LAMP API with MySQLi prepared statements for SQL injection prevention.
- Implemented diff-based edit payloads that compute only changed fields before issuing a PATCH request, and configured Vite's dev server proxy to forward LAMPAPI requests transparently during local development without CORS issues.
- Collaborated on a team-delivered application with create, search, update, and delete contact operations, applying full-stack development skills across frontend SPA architecture and server-side PHP/MySQL data persistence.
