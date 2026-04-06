# Game Glitch Investigator — Project Overview

## Project Purpose

Game Glitch Investigator is a CodePath AI-110 Module 1 assignment. The premise is that an AI wrote a number-guessing game in Streamlit, left six deliberate bugs throughout the code, and students must find, diagnose, and fix them. Along the way students refactor the broken inline logic from `app.py` into a clean, separately testable module (`logic_utils.py`) and drive the fixes with a pytest suite. The finished game lets a player pick a difficulty, receive a secret number within a range, and guess it within a limited number of attempts while receiving higher/lower hints and a running score.

The project is educational on two levels: it teaches practical Streamlit debugging (session state resets, UI correctness) and it introduces the habit of writing logic as pure functions that can be unit-tested independently of any UI.

---

## Tech Stack & Rationale

| Dependency | Version pin | Role |
|---|---|---|
| Python | 3.x | Course language |
| Streamlit | >=1.21.0 | Interactive web UI expressed as a plain Python script — no HTML/JS needed |
| Altair | <5 | Streamlit peer dependency; pinned below v5 to prevent chart-backend incompatibilities |
| pytest | (latest) | Unit test runner for `logic_utils.py` |

Streamlit was chosen so students can focus entirely on Python logic rather than web infrastructure. The entire UI, sidebar, session state, and game loop live in a single `app.py` that reads top-to-bottom like a script. The Altair upper-bound pin (`<5`) is a known Streamlit compatibility constraint that prevents import errors on newer Altair releases.

---

## Architecture Overview

```
app.py              # Streamlit UI, game loop, session state, hint display
logic_utils.py      # Four pure Python functions — the only code the tests touch
tests/
  test_game_logic.py  # pytest suite; imports exclusively from logic_utils
conftest.py         # pytest configuration
requirements.txt
reflection.md       # Student write-up of the debugging process
winninggame.png     # Screenshot of the fixed, winning game (assignment deliverable)
week2.pdf           # Course reference material
```

**`app.py`** is the entry point. It:
- Reads difficulty from a sidebar `st.selectbox` (`"Easy"`, `"Normal"`, `"Hard"`).
- Guards session state with `if "secret" not in st.session_state` so the secret number is only generated once per session (the missing guard is one of the bugs).
- Tracks `st.session_state` keys: `secret`, `attempts`, `score`, `status`, `history`.
- Imports and calls all four `logic_utils` functions after the refactor.
- Includes a `st.expander("Developer Debug Info")` that exposes the secret number, attempt count, score, difficulty, and guess history so students can verify fixes without blind-guessing.
- Handles win (`st.balloons()`), loss (out-of-attempts), and hint display conditionally on a `show_hint` checkbox.

**`logic_utils.py`** contains four pure functions students must implement correctly:

- `get_range_for_difficulty(difficulty)` — maps `"Easy"` → `(1, 20)`, `"Normal"` → `(1, 100)`, `"Hard"` → `(1, 50)`.
- `parse_guess(raw)` — validates and converts text input to int; handles empty strings, floats (`int(float(raw))` when `.` is detected), and non-numeric input; returns `(ok: bool, value: int | None, error: str | None)`.
- `check_guess(guess, secret)` — returns the plain string `"Win"`, `"Too High"`, or `"Too Low"`.
- `update_score(current_score, outcome, attempt_number)` — awards `max(10, 100 - 10 * attempt_number)` points on a win, deducts 5 on a wrong guess.

The test suite imports only from `logic_utils`, so `app.py`'s broken inline implementations are never tested directly.

---

## Setup & Install Steps

```bash
# 1. Clone the repository
git clone https://github.com/tomiwaaluko/ai110-module1show-gameglitchinvestigator-starter.git
cd ai110-module1show-gameglitchinvestigator-starter

# 2. (Optional) create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the Streamlit app in its broken state to observe the bugs
python -m streamlit run app.py

# 5. After fixing, run the test suite
pytest

# 6. Run a single named test
pytest tests/test_game_logic.py::test_winning_guess -v
```

The app opens in the browser at `http://localhost:8501`. The "Developer Debug Info" expander in the app reveals the secret number, which is essential for verifying fixes without blind-guessing.

---

## Notable Implementation Decisions

### Six intentional bugs documented in CLAUDE.md

The bugs are spread across multiple functions and affect both logic and UI:

1. **Inverted hints** — `app.py` shows "Go HIGHER!" when `outcome == "Too High"` and "Go LOWER!" when `outcome == "Too Low"`. The conditional branches are transposed.
2. **Type coercion on even attempts** — the secret is silently cast to `str` on even-numbered attempts, so `guess_int == st.session_state.secret` can never be `True` via numeric equality, making the game unwinnable on those turns.
3. **Wrong difficulty ranges** — Hard mode maps to `(1, 50)`, a narrower range than Normal's `(1, 100)`, making it paradoxically easier rather than harder.
4. **Score off-by-one** — win points are computed with `attempt_number + 1` instead of `attempt_number`, consistently awarding 10 fewer points than intended.
5. **Inconsistent penalty** — "Too High" on even attempts gives `+5` instead of `-5`, rewarding wrong guesses.
6. **Display bug** — the `st.info(...)` banner always reads "Guess a number between 1 and 100" regardless of the selected difficulty, because it hardcodes `1` and `100` instead of using the `low`/`high` variables from `get_range_for_difficulty`.

### Streamlit session state guard pattern

The critical fix for the "secret number keeps changing" bug is the guard:
```python
if "secret" not in st.session_state:
    st.session_state.secret = random.randint(low, high)
```
Without it, `random.randint()` runs on every Streamlit rerun (which happens on every button click or text input), assigning a new secret each time. The guard means the secret is generated exactly once and survives reruns for the duration of the session.

### `parse_guess` handles float string input

`parse_guess` detects a `.` in the raw input string and converts via `int(float(raw))` rather than raising. This means a user who types `"7.0"` gets the integer `7` rather than a validation error — a usability-first choice.

### Test contract differs from the buggy `app.py` inline version

The tests expect `check_guess` to return a plain string (`"Win"`, `"Too High"`, `"Too Low"`). The original inline version in `app.py` returned a `(outcome, message)` tuple. Students must recognize this contract mismatch when refactoring — the `logic_utils` implementation must match what the tests assert, not what the broken original did.

### Difficulty attempt limits are asymmetric and intentionally confusing

Easy gives 6 attempts against a range of 1–20, Normal gives 8 attempts against 1–100, and Hard gives 5 attempts against 1–50. The Hard range being narrower than Normal (another bug) means Hard is actually the easiest mode if the range bug is not fixed — students are expected to notice this inconsistency as a stretch observation.

### `guess_input` key is scoped to difficulty

The text input widget uses `key=f"guess_input_{difficulty}"`, which causes the input field to reset when the player switches difficulty via the sidebar. This is intentional UX — a difficulty change implies starting fresh — but also a subtle Streamlit key-scoping lesson.


## Resume Bullet Points

- Diagnosed and fixed 6 intentional bugs in a Streamlit number-guessing game as part of CodePath's AI-110 curriculum, identifying issues including inverted conditionals, type coercion on even attempts, off-by-one scoring, and missing session state guards.
- Refactored monolithic inline game logic into a separately testable module (logic_utils.py) with four pure functions, writing a pytest suite covering all edge cases including float-string input handling and difficulty-range correctness.
- Applied Streamlit session state guard patterns to prevent secret-number regeneration on every UI rerun, demonstrating production debugging and test-driven refactoring skills on a live interactive web application.
