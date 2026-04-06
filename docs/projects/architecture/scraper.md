# LinkedIn Link Scraper — System Design Architecture

## Overview
A Chrome/Edge browser extension (Manifest V3) that scrapes LinkedIn profile URLs from Discord and GroupMe chat messages. Triggered via keyboard shortcut, results displayed in a popup. Phase 2 includes an auto-connect workflow.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Extension Standard | Chrome Manifest V3 |
| Language | Vanilla JavaScript (no build system) |
| Extension APIs | Chrome Service Worker, Storage, Messages, Commands, Tabs |
| DOM Manipulation | Vanilla JS |
| Target Platforms | Chrome, Edge |

---

## Architecture Diagram

```
User presses Ctrl+Shift+L (or Cmd+Shift+L)
         │
         ▼
┌────────────────────────────────────┐
│    Service Worker (background.js)  │
│                                    │
│  chrome.commands.onCommand listener│
│  → sends "scrape" message          │
│  → stores results in chrome.storage│
│  → relays results to popup         │
│  → manages auto-connect state      │
│  ← keep-alive alarm handler        │
└──────────┬─────────────────────────┘
           │ chrome.tabs.sendMessage
           ▼
┌────────────────────────────────────┐
│     Content Script (content.js)    │
│     (injected into active page)    │
│                                    │
│  Receives "scrape" message         │
│  → delegates to platform modules   │
└──────────┬─────────────────────────┘
           │
           ▼
┌────────────────────────────────────┐
│    Platform Modules (src/platform/)│
│                                    │
│  detectors.js                      │
│    → detects Discord vs GroupMe    │
│      from window.location.hostname │
│                                    │
│  scrapers.js                       │
│    → platform-specific DOM selectors│
│    → extracts LinkedIn URLs (regex) │
│    → handles lazy-loaded content   │
│      (scroll for virtualized chat) │
└──────────┬─────────────────────────┘
           │ results returned
           ▼
┌────────────────────────────────────┐
│     chrome.storage.local           │
│     (persisted scraped URLs)       │
└──────────┬─────────────────────────┘
           │
           ▼
┌────────────────────────────────────┐
│     Popup (popup.html / popup.js)  │
│                                    │
│  Displays scraped profile links    │
│  Copy-all button                   │
│  Manual "Scrape Now" trigger       │
│  Link to keyboard shortcuts page   │
└────────────────────────────────────┘
```

---

## Key Components

### Service Worker (`src/background.js`)
- Listens for `chrome.commands.onCommand` (keyboard shortcut)
- Sends `scrape` message to active tab's content script
- Stores results in `chrome.storage.local`
- Relays results to popup on open
- Manages Phase 2 auto-connect workflow state
- Keep-alive alarm to prevent service worker termination (MV3 limitation)

### Content Script (`src/content.js`)
- Injected into Discord/GroupMe pages
- Receives `scrape` message from background
- Delegates detection and scraping to platform modules
- Returns extracted URLs back to background

### Platform Modules (`src/platform/`)

**`detectors.js`**
- Checks `window.location.hostname`
- Returns platform identifier (`discord` / `groupme`)

**`scrapers.js`**
- Platform-specific DOM selectors for message containers
- LinkedIn URL regex: `https?://(?:www\.)?linkedin\.com/in/[^\s"'\?\#]+`
- Scrolling logic for virtualized/lazy-loaded chat history

### LinkedIn Connect Module (`src/linkedin/linkedin-connect.js`) — Phase 2
- Detects connection status on LinkedIn profile pages
- Handles invitation modal interactions
- Tab management (open → process → close)
- Stop rule: 3 consecutive "already connected" results ends the run

### Popup (`src/popup/`)
- Reads `chrome.storage.local` on open
- Renders scraped links as clickable list
- Copy-all functionality
- Manual scrape trigger button

---

## Message Flow

```
1. User triggers keyboard shortcut
2. background.js receives chrome.commands.onCommand
3. background.js sends { type: "scrape" } to content script
4. content.js calls detectors.js → identifies platform
5. content.js calls scrapers.js → extracts LinkedIn URLs from DOM
6. content.js returns URLs to background.js
7. background.js stores URLs in chrome.storage.local
8. popup.js reads storage.local and renders results
```

---

## Host Permissions

| Domain | Purpose |
|---|---|
| `discord.com`, `*.discord.com` | Discord server/DM pages |
| `groupme.com`, `web.groupme.com` | GroupMe chat pages |
| `linkedin.com`, `www.linkedin.com` | LinkedIn profile interaction (Phase 2) |

**Other Permissions:** `activeTab`, `tabs`, `storage`, `alarms`

---

## Implementation Phases

| Phase | Status | Features |
|---|---|---|
| Phase 1 | Complete | Scrape & Display — manifest, background, content script, platform detection, popup |
| Phase 2 | Planned | Auto-Connect — LinkedIn profile interaction, connection status detection, modal handling |

---

## Technical Constraints

- **Manifest V3**: No persistent background pages — uses service workers + keep-alive alarm
- **No build system**: Vanilla JS loaded directly from manifest; no webpack/vite/esbuild
- **Lazy-loaded chat**: Discord and GroupMe virtualize message lists — scraper must scroll to load older messages
- **URL deduplication**: LinkedIn profile slugs normalized and deduplicated before storage

---

## Loading the Extension

1. Navigate to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select repo root directory
4. Reload after any code changes
