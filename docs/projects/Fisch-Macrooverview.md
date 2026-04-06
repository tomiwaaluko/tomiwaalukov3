# Fisch-Macro: Project Overview

## Project Purpose

Fisch-Macro is a desktop automation tool built for **Fisch**, a fishing minigame on Roblox. It solves two distinct problems players face:

1. **Repetitive input sequences** — players often need to repeat the same keyboard or mouse actions (casting, reeling, baiting). The macro recorder captures these sequences once and replays them on demand.
2. **SHAKE button reaction** — Fisch presents a timed on-screen prompt called the SHAKE button that requires fast clicking to successfully land a fish. The tool continuously scans the screen for a reference image of that button and clicks it automatically when found, removing the need for constant manual attention.

The project is entirely self-contained in a single Python script with a Tkinter GUI and global hotkey support so it can be operated while Roblox is the active window.

---

## Tech Stack & Rationale

| Library | Role | Why it was chosen |
|---|---|---|
| `tkinter` | GUI control panel | Ships with Python's standard library — no extra install needed for a lightweight window with buttons |
| `pynput` | Low-level keyboard/mouse listener and controller | Provides event-driven capture of individual key presses, releases, and mouse clicks, plus a `Controller` API for replaying them, all without polling |
| `keyboard` | Global hotkey registration | Allows F5–F10 shortcuts to fire even when the Tkinter window is not focused, which is essential while Roblox is the foreground window |
| `pyautogui` | Screen image detection and cursor control | `locateOnScreen` performs template-matching against a reference PNG at a configurable confidence level; `moveTo` + `click` handle the automated interaction |
| `threading` | Concurrency | Recording and detection loops are blocking by nature; running them in daemon threads keeps the Tkinter event loop responsive |
| `time` | Timing | `time.sleep` is used to pace the recording loops (100 ms polling) and the SHAKE detection interval (500 ms between scans) |

Python was the natural choice: `pynput`, `pyautogui`, and `keyboard` are all mature, well-documented libraries for Windows desktop automation, and `tkinter` makes a functional GUI achievable with zero additional dependencies.

---

## Architecture Overview

The entire project lives in one file: `Fisch Macro.py`. It is divided into four logical sections.

### 1. Global State

Module-level variables act as the shared state between threads:

- `recorded_keyboard_actions` / `recorded_mouse_actions` — lists of tuples holding each captured event.
- `recording_keyboard`, `recording_mouse`, `playing` — boolean flags that start and stop the active loops.
- `detecting_shake` — flag controlling the image-detection loop.
- `reference_image_path` — hardcoded path to the user's local screenshot of the SHAKE button PNG.

### 2. Keyboard & Mouse Macro Engine

- **`record_keyboard_macro()`** — starts a `pynput` `kb.Listener`, appends `("key_press"|"key_release", key, timestamp)` tuples, and spins in a `while recording_keyboard: time.sleep(0.1)` loop until `stop_recording()` flips the flag.
- **`play_keyboard_macro()`** — iterates `recorded_keyboard_actions` and dispatches press/release events via `kb.Controller`, inserting a fixed 100 ms delay between each action.
- **`record_mouse_macro()`** — same pattern using `mouse.Listener`, storing `("mouse_click", x, y, button, pressed, timestamp)` tuples.
- **`play_mouse_macro()`** — replays clicks by setting `mouse.Controller().position` then pressing or releasing the stored button.
- **`stop_recording()`** / **`pause_macro()`** — flip the relevant boolean flags to exit the active loops.

### 3. SHAKE Image Detection

- **`detect_and_click_image()`** — runs in a daemon thread; calls `pyautogui.locateOnScreen(reference_image_path, confidence=0.8)` every 500 ms. On a match it computes the center of the bounding box, moves the cursor there with `moveTo(..., duration=0.1)`, and fires a click.
- **`start_image_detection()`** / **`stop_image_detection()`** — set `detecting_shake` and spin up or down the daemon thread.

### 4. UI and Hotkeys

- **`create_ui()`** — builds a three-row `tkinter` grid: keyboard controls (column 0), mouse controls (column 1), SHAKE detection controls (spanning both columns), and a hotkey legend at the bottom. Each button spawns a `threading.Thread` to avoid blocking the event loop.
- **`setup_hotkeys()`** — registers six global hotkeys (F5–F10) via the `keyboard` library and runs in its own daemon thread so it does not block `root.mainloop()`.

---

## Setup & Install Steps

1. **Prerequisites:** Python 3.8+ on Windows (pyautogui's screen-capture backend works out of the box on Windows).

2. **Clone the repository:**
   ```bash
   git clone https://github.com/tomiwaaluko/Fisch-Macro.git
   cd Fisch-Macro
   ```

3. **Install dependencies:**
   ```bash
   pip install pyautogui pynput keyboard
   ```
   *(There is no `requirements.txt` in the repo; install these three packages manually.)*

4. **Configure the reference image:**
   Take a screenshot of the SHAKE button as it appears in Fisch at your monitor's resolution and save it locally. Then open `Fisch Macro.py` and update this line:
   ```python
   reference_image_path = r"C:\Users\gokugu\Downloads\ShakeButton.png"
   ```
   Point it at your saved image. This is the only configuration required.

5. **Run the application:**
   ```bash
   python "Fisch Macro.py"
   ```

6. **Operate via the GUI or hotkeys:**

   | Hotkey | Action |
   |---|---|
   | F5 | Start keyboard recording |
   | F6 | Start mouse recording |
   | F7 | Play back recorded macro |
   | F8 | Pause/stop playback |
   | F9 | Start SHAKE detection |
   | F10 | Stop SHAKE detection |

---

## Notable Implementation Decisions

### Two separate keyboard libraries used simultaneously
The code imports both `pynput.keyboard` (aliased as `kb`) and the `keyboard` package at the top level. `pynput` handles event-driven recording and replaying of arbitrary keystroke sequences via its `Listener`/`Controller` pair. The `keyboard` package is used exclusively for global hotkey registration because its `add_hotkey` API is simpler for binding function-key shortcuts that must work system-wide regardless of which window is focused.

### Polling loops rather than blocking callbacks for recording control
`record_keyboard_macro()` and `record_mouse_macro()` both use a `while <flag>: time.sleep(0.1)` loop to keep the recording thread alive, while the `pynput` listener callbacks do the actual capture. Stopping a recording is then as simple as flipping a boolean from another thread — no need to call into the listener's own thread or use events/conditions.

### Fixed 100 ms inter-action delay during playback
Instead of replaying the exact recorded timestamps, `play_keyboard_macro()` inserts a uniform 100 ms gap between every action. This trades timing fidelity for simplicity and prevents burst replays that could overwhelm Roblox's input handling or trigger anti-cheat heuristics based on inhuman input speed.

### `pyautogui.locateOnScreen` confidence threshold of 0.8
The SHAKE detector uses an 80% image-match confidence level. This balances false negatives (missing the button when it renders slightly differently due to game animations or anti-aliasing) against false positives (clicking unrelated screen elements that partially resemble the reference image).

### All background threads are daemon threads
Every thread started by the application — hotkey listener, recording loops, playback, SHAKE detection — is a daemon thread. This ensures all background activity is automatically killed when the Tkinter main window is closed, preventing orphaned processes that would continue listening to input or scanning the screen after the user exits.

### Hardcoded reference image path
The path to `ShakeButton.png` is embedded directly in the source as a raw string literal pointing to a specific local user directory (`C:\Users\gokugu\Downloads\`). This is the sole user-facing configuration point in the entire codebase and must be updated before the SHAKE detection feature is usable on any other machine.


## Resume Bullet Points

- Developed a Python desktop automation tool with a Tkinter GUI enabling keyboard and mouse macro recording and playback, using pynput for low-level input capture and pyautogui for screen image template matching at configurable confidence thresholds.
- Implemented a multi-threaded architecture with daemon threads and system-wide hotkeys (F5-F10) via the keyboard library, enabling real-time control of recording, playback, and screen detection while an external application remained the active foreground window.
- Engineered an image-based auto-detection loop using pyautogui.locateOnScreen at 80% confidence, polling every 500ms to autonomously identify and click timed on-screen prompts without user intervention.
