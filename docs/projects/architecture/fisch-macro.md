# Fisch Macro — System Design Architecture

## Overview
A keyboard and mouse macro recorder and automation tool for the Roblox game "Fisch." Includes automated SHAKE event detection via on-screen image recognition. Controlled entirely via global hotkeys. Runs as a local Python desktop application.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Python 3 |
| GUI | Tkinter (built-in Python GUI framework) |
| Input Recording | Keyboard + mouse macro capture (pynput / keyboard library) |
| Image Recognition | On-screen element detection (pyautogui / opencv-python) |
| Global Hotkeys | System-wide hotkey listener |
| Deployment | Local only — `python "Fisch Macro.py"` |

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                  Tkinter GUI Window                         │
│                                                              │
│  [Record Keyboard F5]  [Record Mouse F6]   [Play F7]       │
│  [Pause F8]            [Start SHAKE F9]    [Stop F10]       │
│                                                              │
│  Status display: recording / playing / detecting / idle     │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                  Global Hotkey Listener                     │
│                                                              │
│  F5  → start_keyboard_recording()                           │
│  F6  → start_mouse_recording()                              │
│  F7  → play_macro()                                         │
│  F8  → pause_macro()                                        │
│  F9  → start_shake_detection()                              │
│  F10 → stop_shake_detection()                               │
└────────────────────────┬─────────────────────────────────────┘
                         │
            ┌────────────┼────────────────────┐
            ▼            ▼                    ▼
┌─────────────────┐  ┌──────────────┐  ┌──────────────────────┐
│  Keyboard Macro │  │  Mouse Macro │  │  SHAKE Detector      │
│  Recorder       │  │  Recorder    │  │                      │
│                 │  │              │  │  Monitors screen for │
│  Captures key   │  │  Captures    │  │  "SHAKE" image       │
│  press/release  │  │  mouse moves │  │  pattern             │
│  with timestamps│  │  + clicks    │  │                      │
└────────┬────────┘  └──────┬───────┘  │  On detection:       │
         │                  │          │  → triggers auto-    │
         └──────────────────┘          │    response input    │
                  │                    └──────────────────────┘
                  ▼
┌──────────────────────────────────────────────────────────────┐
│                   Macro Playback Engine                     │
│                                                              │
│  Replays recorded keyboard + mouse actions                  │
│  with original timing intervals                             │
└──────────────────────────────────────────────────────────────┘
```

---

## Hotkey Map

| Key | Action |
|---|---|
| F5 | Start recording keyboard actions |
| F6 | Start recording mouse actions |
| F7 | Play back recorded macro |
| F8 | Pause macro playback |
| F9 | Start SHAKE event detection |
| F10 | Stop SHAKE event detection |

---

## Core Modules (Single File: `Fisch Macro.py`)

| Component | Description |
|---|---|
| Tkinter GUI | Main window with status display and control labels |
| Global Hotkey Listener | System-wide F5–F10 key bindings that work even when the game window is focused |
| Keyboard Recorder | Captures key press/release events with timestamps via `pynput` or `keyboard` |
| Mouse Recorder | Captures mouse movement and click events with positions and timestamps |
| Playback Engine | Replays captured inputs at original timing |
| SHAKE Detector | Polls screen at intervals, uses image recognition to find the SHAKE event UI element, then triggers the appropriate in-game input |

---

## SHAKE Detection Flow

```
User presses F9
  → Background thread starts polling screen
  → Each tick: capture screenshot → search for SHAKE pattern image
  → If pattern found:
      → Simulate key press / mouse click (game-specific response)
  → Continues until user presses F10
```

---

## Setup & Usage

```bash
# Install dependencies
pip install -r requirements.txt

# Run the macro tool
python "Fisch Macro.py"
```

**Requirements (typical):**
```
pynput
pyautogui
opencv-python
Pillow
keyboard
```

---

## Constraints & Notes

- **Local only** — no server, no database, no network calls
- **Windows-focused** — global hotkeys and screen capture APIs are Windows-compatible
- **Game-specific** — SHAKE detection image templates are tuned for the Fisch Roblox game UI
- **Single script** — entire application is one Python file; no modules or packages
