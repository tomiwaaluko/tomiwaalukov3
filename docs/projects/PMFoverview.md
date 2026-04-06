# PMF (Pioneer Mortgage Funding) — Project Overview

## Project Purpose

PMF is the public-facing marketing and lead-generation website for **Pioneer Mortgage Funding, Inc.**, a licensed mortgage broker based in Lake Mary, Florida. The site presents the company's loan programs, introduces the loan officer team, and captures prospective client leads through quote-request forms on multiple pages.

Visitors can:
- Learn about available mortgage programs (FHA, Renovation, VA, Conventional, Fixed-Rate)
- Use interactive financial calculators (loan affordability and refinance break-even)
- Read profiles for each loan officer (Branch Manager and two Mortgage Loan Originators)
- Read a step-by-step guide to the home-buying process
- Submit a quote request form routed by email to the responsible loan officer
- Click through to the external online loan application (`pioneermortgagefunding.my1003app.com`)

The site is entirely frontend — no backend server or database. All form submissions are handled client-side via EmailJS.

---

## Tech Stack & Rationale

| Technology | Role | Why |
|---|---|---|
| **React 19** | UI component framework | Industry-standard for interactive SPAs |
| **React Router 7** | Client-side routing | Multi-page navigation without full page reloads |
| **Vite 7** | Build tool | Fast HMR; produces optimized static bundles |
| **EmailJS** (`@emailjs/browser`) | Transactional email from the browser | Removes the need for any backend API — form data posted directly from the client to EmailJS's service |
| **Netlify** | Hosting | `netlify.toml` includes an SPA redirect rule (`/* -> /index.html, 200`) for React Router |
| **Vercel** | Alternative deployment | `vercel.json` present with equivalent SPA rewrite rules |
| **Unsplash / external CDN** | Hero slideshow photography | All hero images loaded directly from Unsplash URLs |

The project is **frontend-only** — no Express server, no database, no authentication.

---

## Architecture Overview

```
PMF/
├── src/
│   ├── assets/              # Local image files (team headshots)
│   ├── components/
│   │   ├── Footer.jsx
│   │   ├── Navbar.jsx
│   │   ├── QuotePanel.jsx   # Reusable lead-capture form used on program pages
│   │   ├── ScrollToTop.jsx  # Resets scroll position on route change
│   │   └── TopBar.jsx       # Top contact/info bar above the main nav
│   ├── data/
│   │   └── content.js       # Central data: programCards, steps, stats, teamMembers, navLinks
│   ├── pages/
│   │   ├── HomePage.jsx                     # Landing: hero slideshow, programs, stats, quote form
│   │   ├── AboutPage.jsx
│   │   ├── FhaLoanPage.jsx
│   │   ├── RenovationLoanPage.jsx
│   │   ├── VaLoanPage.jsx
│   │   ├── AffordabilityCalculatorPage.jsx  # Interactive loan affordability calculator
│   │   ├── RefinanceCalculatorPage.jsx      # Interactive refinance break-even calculator
│   │   ├── BuyingHomePage.jsx               # Step-by-step home buying guide
│   │   └── TeamProfile.jsx                  # Dynamic profile page, routed via /team/:slug
│   ├── utils/
│   │   └── emailConfig.js   # EmailJS credentials + per-page recipient routing
│   ├── App.jsx              # Root: layout shell + all <Route> definitions
│   └── main.jsx             # Vite entry point
├── netlify.toml             # SPA redirect rule
├── vercel.json              # SPA rewrite rule
└── LOCAL_RUN.md             # Local development instructions
```

### Routing Table

| URL | Component |
|---|---|
| `/` | `HomePage` |
| `/about` | `AboutPage` |
| `/programs/fha` | `FhaLoanPage` |
| `/programs/renovation` | `RenovationLoanPage` |
| `/programs/va` | `VaLoanPage` |
| `/tools/affordability-calculator` | `AffordabilityCalculatorPage` |
| `/tools/refinance-calculator` | `RefinanceCalculatorPage` |
| `/tools/buying-home` | `BuyingHomePage` |
| `/team/:slug` | `TeamProfile` |
| `*` | `HomePage` |

### Data Flow for Lead Capture Forms

1. User fills in the quote form (name, email, phone, loan type, credit history, property value).
2. `handleSubmit` calls `getRecipientEmail(currentPath)` from `emailConfig.js` to determine which loan officer receives the email.
3. Data is sent to EmailJS via `emailjs.send(serviceId, templateId, templateParams, publicKey)`.
4. On success, a green confirmation message shows for 5 seconds; the form resets. No data is stored anywhere.

---

## Setup & Install Steps

### Prerequisites
- Node.js v18+

```bash
git clone https://github.com/tomiwaaluko/PMF.git
cd PMF
npm install
# Configure EmailJS credentials in src/utils/emailConfig.js
npm run dev      # → http://localhost:5173
```

### Additional Scripts

| Command | Effect |
|---|---|
| `npm run build` | Produces optimized bundle in `dist/` |
| `npm run preview` | Serves `dist/` locally to test production build |
| `npm run lint` | Runs ESLint |

### Deployment

After `npm run build`, push to the connected Netlify branch or drag `dist/` into the dashboard. The `netlify.toml` handles SPA path rewriting. `vercel.json` provides equivalent config for Vercel.

---

## Notable Implementation Decisions

### Centralized content in `src/data/content.js`
All marketing copy — program card titles/descriptions/images, process step text, stat values, team member bios, NMLS numbers, contact details, and the full nav link tree — is stored in a single exported module. Content updates are a single-file change rather than a hunt across multiple components.

### Per-page email routing via `emailConfig.js`
`getRecipientEmail(path)` maps URL paths to individual loan officer email addresses. The VA Loan page routes to Luis Alban (the certified veterans lending specialist); the home page routes to Joshua Goff (Branch Manager). A `USE_TEST_EMAIL` flag redirects all submissions to a test inbox during development.

### Auto-advancing hero slideshow with `setInterval`
`HomePage` manages an 8-slide carousel using `currentSlide` integer state. A `useEffect` sets a 6-second `setInterval` incrementing the index modulo the slide count, with cleanup on unmount. Slides are absolutely-positioned `div` elements with inline background images, toggled by an `active` CSS class.

### Dynamic team profiles via URL slug
A single `TeamProfile.jsx` reads the `:slug` parameter from React Router's `useParams`, then finds the matching entry in the `teamMembers` array from `content.js`. Adding a new team member requires only a new object in `content.js` — no new route, no new component.

### `QuotePanel` as a reusable lead form
The quote form on program pages is extracted into a shared `QuotePanel` component that accepts the current page path as a prop and calls `getRecipientEmail(path)` internally. The `HomePage` has its own inline version for its unique layout requirements.

### No backend, no state management library
EmailJS eliminates backend infrastructure entirely. Form state is managed with `useState` in each component. No Redux, Zustand, or Context API — prop-passing and module-level constants cover all cases.

### Commented-out Mortgage Rate page
`App.jsx` contains a commented-out route for `MortgageRatePage` (`/tools/mortgage-rate`), and the nav link in `content.js` is similarly commented out. The page was planned but excluded — likely because live rate data would require an API integration not yet implemented.

### Dual deployment configuration
Both `netlify.toml` and `vercel.json` are committed. This gives the team flexibility to switch hosting providers without any code changes — both files serve the same purpose of rewriting all URL paths to `index.html`.


## Resume Bullet Points

- Built a full-stack marketing and lead-generation website for a licensed mortgage broker using React 19, React Router 7, and Vite, featuring 8+ loan program pages, two interactive financial calculators, and dynamic team profile routing via URL slugs.
- Integrated EmailJS for client-side transactional email with per-page recipient routing logic (getRecipientEmail), automatically directing lead-capture form submissions to the appropriate loan officer based on the current URL path.
- Centralized all marketing copy, team bios, program cards, and nav links in a single data module, enabling content updates without component-level code changes; deployed to Netlify with SPA redirect rules and a dual Vercel configuration.
