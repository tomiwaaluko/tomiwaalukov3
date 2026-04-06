# LinkedIn Link Scraper — Project Overview

## Project Purpose

`scraper` is a Chrome and Edge browser extension that extracts LinkedIn profile URLs from Discord and GroupMe chat pages. The primary use case is collecting profiles shared in professional networking channels (e.g. a `#linkedin-plug` Discord channel) and then optionally sending connection requests to every profile found — all without manually clicking through each link.

The extension operates in two phases:
1. **Scrape & Display** — triggered by a keyboard shortcut (`Ctrl+Shift+L` / `Cmd+Shift+L`) or a popup button; scans the current tab's chat DOM for LinkedIn `/in/` URLs and presents them in a list with a one-click copy-all action.
2. **Auto-Connect** — iterates through the scraped URLs, opens each LinkedIn profile in a background tab, detects connection status via DOM inspection, sends a connection request if not already connected, and stops automatically after 3 consecutive already-connected or pending profiles.

---

## Tech Stack & Rationale

| Technology | Role | Reason |
|---|---|---|
| **Vanilla JavaScript (ES2020)** | All extension logic | No build system needed — files loaded directly by the browser; trivial to load as an unpacked extension |
| **Chrome Extension Manifest V3** | Extension platform | Current Chrome/Edge standard; enforces service workers over background pages |
| **`chrome.storage.local`** | State persistence | Service workers can be terminated at any time; storage survives restarts and lets the popup restore state |
| **`chrome.alarms`** | Service worker keep-alive | MV3 service workers terminate after ~30 s of inactivity; a repeating alarm every ~25 s (`periodInMinutes: 0.4`) keeps the worker alive during auto-connect |
| **`chrome.commands`** | Keyboard shortcut | Declarative shortcut (`Ctrl+Shift+L`) registered in `manifest.json` |

No npm, no bundler, no transpiler. The entire extension is loaded from source files exactly as written.

---

## Architecture Overview

```
manifest.json
    │
    ├── src/background.js          ← Service worker (orchestrator)
    │
    ├── src/content.js             ← Injected into GroupMe/Discord tabs
    │   ├── src/platform/detectors.js
    │   └── src/platform/scrapers.js
    │
    ├── src/linkedin/linkedin-connect.js  ← Injected into LinkedIn /in/* tabs
    │
    └── src/popup/
        ├── popup.html
        ├── popup.js
        └── popup.css
```

### Message Flow — Scraping

```
User presses Ctrl+Shift+L
    → chrome.commands.onCommand (background.js)
    → chrome.tabs.sendMessage({ action: 'scrape' })
    → content.js: detectPlatform() → scrapeLinkedInLinks(platform)
    → sendResponse({ platform, links[], count })
    → background.js: storeResults() + notifyPopup('scrapeResults', ...)
    → popup.js: displayResults()
```

### Message Flow — Auto-Connect

```
User clicks "Connect All" in popup
    → background.js: startAutoConnect(links)
        for each URL:
            → chrome.tabs.create({ url, active: false })
            → waitForTabLoad(tabId, 15000ms)
            → humanDelay(800–1600ms)   // wait for LinkedIn SPA to render
            → sendMessageWithTimeout(tabId, { action: 'detectStatus' }, 20000ms)
            → if not connected: sendMessageWithTimeout(tabId, { action: 'sendConnect' }, 30000ms)
            → chrome.tabs.remove(profileTab.id)
            → sleep(1000–3000ms)       // rate limiting
            → if consecutiveSkips >= 3: stop
    → notifyPopup('connectProgress', state) after each profile
```

### Key Components

**`src/background.js`** — Central orchestrator. Owns `connectState` (running, total, processed, connected, skipped, failed, consecutiveSkips, log). Persists state to `chrome.storage.local` after every profile. On startup, restores any persisted `connectState` and marks it stopped if the worker had restarted mid-run.

**`src/platform/detectors.js`** — `detectPlatform()` reads `window.location.hostname` and returns `'groupme'`, `'discord'`, or `'unknown'`.

**`src/platform/scrapers.js`** — `scrapeLinkedInLinks(platform)` runs two regex passes: one for URLs with protocol, one for raw text without. Deduplicates by profile slug. Discord containers found via `[data-list-id="chat-messages"]` with fallbacks; GroupMe via `.message-pane` with fallbacks.

**`src/linkedin/linkedin-connect.js`** — Handles `detectStatus` and `sendConnect` messages. Detects connection status via DOM inspection (button count, "1st" degree label, More dropdown). For connect, clicks the button, handles the "Send without a note" modal, and waits for the success toast.

**`src/popup/popup.js` + `popup.html`** — Popup UI with Scrape Now, Copy All, Connect All buttons; auto-connect progress section (progress bar, per-profile slug, counters, Stop button). On open, requests last scrape results and current connect status from storage.

---

## Setup & Install Steps

No build step — runs directly from source files.

1. Clone the repository:
   ```bash
   git clone https://github.com/tomiwaaluko/scraper.git
   ```

2. Open Chrome/Edge and navigate to `chrome://extensions`.

3. Enable **Developer mode** (toggle in top-right).

4. Click **Load unpacked** and select the `scraper/` directory (containing `manifest.json`).

5. Navigate to a GroupMe or Discord chat and press `Ctrl+Shift+L` to trigger a scrape.

**Reloading after code changes:** Go to `chrome://extensions` and click the reload icon. For background changes, click reload. For content script changes, also reload the target tab.

**Debugging:** Background: `chrome://extensions` → "Service Worker" → DevTools. Content script: DevTools on the GroupMe/Discord tab.

---

## Notable Implementation Decisions

### No Build System
Vanilla JavaScript loaded directly by the manifest — zero tooling overhead. The tradeoff: no `import`/`export` module system, so `detectors.js` and `scrapers.js` are loaded as separate content script entries in `manifest.json` before `content.js`, relying on sequential browser script loading to make functions available in the global scope.

### Service Worker Keep-Alive via Alarms
A repeating `chrome.alarms` alarm (`periodInMinutes: 0.4`, ~25 s) runs when auto-connect starts and clears when it ends. The alarm listener does nothing — its firing event is enough to keep the MV3 worker alive during a multi-minute workflow.

### State Persistence and Restart Recovery
`connectState` is written to `chrome.storage.local` after every profile operation. On service worker startup, if persisted state shows `running: true`, it is immediately marked stopped with a log entry. The popup will correctly show "stopped" rather than a stale "running" display.

### Two-Pass LinkedIn URL Extraction
Pass 1: URLs with `http://` or `https://` — catches hyperlinks as plain text. Pass 2: URLs without protocol (e.g., `www.linkedin.com/in/name`) — catches profiles typed as raw text. Both passes go through `normalizeLinkedInUrl`, which prepends `https://`, strips query params and fragments, and extracts the slug for deduplication via a `Set`.

### Platform-Specific Fallback Selector Chains
Discord aggressively obfuscates class names. `getMessageContainer` for Discord tries three selectors in order: `[data-list-id="chat-messages"]` (most stable) → `ol[data-list-id]` (structural) → `[class*="chatContent"]` (last resort). GroupMe tries `.message-pane` → `.messages-container` → `[class*="message-list"]` → `document.body`.

### 3-Consecutive-Skip Stop Rule
Both "already connected" and "Pending" profiles increment `consecutiveSkips`; only a successful new connection request resets it. When the counter reaches 3, the workflow stops. This avoids wastefully re-processing an entire historical channel when the most-recent profiles are already connections.

### `humanDelay` After Tab Load
After `waitForTabLoad` resolves, the background waits an additional randomized 800–1600 ms before sending `detectStatus`. LinkedIn is a React SPA: `document` may be complete while profile action buttons are still rendering. Without this delay, `detectStatus` would frequently find no buttons.


## Resume Bullet Points

- Built a Manifest V3 Chrome/Edge browser extension in vanilla JavaScript that scrapes LinkedIn profile URLs from Discord and GroupMe chat pages using dual-pass regex extraction with platform-specific DOM fallback selector chains.
- Engineered an auto-connect workflow that opens LinkedIn profiles in background tabs, detects connection status via DOM inspection, and applies a 3-consecutive-skip stop rule with randomized 1-3 second rate limiting to simulate human interaction patterns.
- Implemented chrome.alarms-based service worker keep-alive (25s interval) and chrome.storage.local state persistence with automatic restart recovery, ensuring a multi-minute connection workflow survives Chrome MV3's 30-second worker termination limit.
