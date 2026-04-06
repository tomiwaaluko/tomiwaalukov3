# PawPal+ — Project Overview

## Project Purpose

PawPal+ is a CodePath AI-110 Module 2 project: a smart pet care scheduling system that tracks feedings, walks, medications, and appointments for multiple pets. Users can add pets and tasks, view a chronologically sorted daily schedule, detect scheduling conflicts, mark tasks complete, and have recurring tasks automatically re-scheduled for the next day or week. The project focuses on object-oriented design, algorithmic scheduling, JSON persistence, and a two-interface architecture (CLI and Streamlit web UI).

---

## Tech Stack & Rationale

| Dependency | Version pin | Role |
|---|---|---|
| Python | 3.x | Course language; dataclasses and `datetime` are central |
| Streamlit | >=1.30 | Web UI expressed as a Python script; session state manages all app state |
| tabulate | >=0.9 | Formatted ASCII tables for CLI output in `main.py` |
| pytest | >=7.0 | 14-test suite covering all algorithmic logic in `pawpal_system.py` |

Streamlit was chosen for the same reason as Module 1: rapid interactive UI without front-end knowledge. `tabulate` is added specifically to make the CLI demo output readable as grid-formatted tables. The `datetime` standard library module provides `date` and `timedelta` — no third-party date library is needed because the scheduling arithmetic is simple (add 1 day or 1 week).

---

## Architecture Overview

The project is a deliberate two-layer design: all algorithmic logic is kept entirely separate from any UI framework.

```
pawpal_system.py      # Pure Python backend — Owner, Pet, Task, Scheduler classes
                      # Zero Streamlit imports; fully testable in isolation
app.py                # Streamlit web UI — imports from pawpal_system, manages
                      # st.session_state, renders tabs and sidebar forms
main.py               # CLI demo — exercises all backend features with tabulate output
tests/
  test_pawpal.py      # 14-test pytest suite; imports only from pawpal_system
reflection.md         # Design decisions and AI collaboration notes
data.json             # Persisted schedule (written by save button or CLI run)
requirements.txt
uml_final.png         # UML class diagram
```

### Classes in `pawpal_system.py`

**`Task` (dataclass)**
Fields: `description: str`, `time: str` (HH:MM, 24-hour), `frequency: str` (`"once"` | `"daily"` | `"weekly"`), `completed: bool`, `due_date: date`, `priority: str` (`"high"` | `"medium"` | `"low"`).
Key method: `mark_complete()` — sets `completed = True` and returns a new `Task` with `due_date + timedelta(days=1)` for daily or `+ timedelta(weeks=1)` for weekly recurrence; returns `None` for `"once"` tasks.

**`Pet` (dataclass)**
Fields: `name`, `species`, `tasks: list`. Methods: `add_task(task)`, `task_count() -> int`.

**`Owner`**
Fields: `name`, `pets: list[Pet]`. Methods: `add_pet`, `get_pets`, `save_to_json(filepath)`, `load_from_json(filepath)` (classmethod). JSON serialization converts `date` objects to ISO strings via `.isoformat()` and restores them with `date.fromisoformat()`. The `priority` field is loaded with `.get("priority", "medium")` as a safe default for older saved files.

**`Scheduler`**
Wraps an `Owner` and implements all scheduling algorithms:
- `get_all_tasks()` — flat `list[tuple[str, Task]]` across all pets.
- `sort_by_time()` — `sorted(..., key=lambda x: x[1].time)`. Works correctly because all times are zero-padded HH:MM strings, so lexicographic order equals chronological order.
- `filter_tasks(pet_name=None, completed=None)` — optional filters applied in sequence with list comprehensions.
- `detect_conflicts()` — O(n²) pairwise loop; appends a warning string for every pair of tasks sharing the same `time` value; never raises.
- `mark_task_complete(pet_name, task_description)` — mutates the matching task, calls `task.mark_complete()`, and if a new `Task` is returned, appends it to the pet's task list.
- `find_next_available_slot(pet_name, duration_minutes=30)` — iterates 07:00–21:00 in 30-minute steps, checks each candidate against the set of all occupied time strings, and returns the first free slot.
- `sort_by_priority_then_time()` — two-key sort: `(priority_order[priority], time)` where `priority_order = {"high": 0, "medium": 1, "low": 2}`.

### Streamlit UI (`app.py`)

Session state is initialized once:
```python
if "owner" not in st.session_state:
    if os.path.exists("data.json"):
        st.session_state.owner = Owner.load_from_json()
    else:
        st.session_state.owner = Owner("PawPal Owner")
        # seeds Biscuit (Dog) and Mochi (Cat) with default tasks
```
The UI has four tabs: **Today's Schedule** (conflict warnings + `sort_by_time` with "Mark done" buttons), **Priority View** (`sort_by_priority_then_time` with color-coded `st.error`/`st.warning`/`st.info` by priority level), **Filter Tasks** (dropdowns for pet and completion status feeding `filter_tasks`, displayed as `st.dataframe`), and **Pet Roster** (expandable per-pet task lists). The sidebar has forms for adding pets and tasks, plus Save/Load buttons.

### CLI Demo (`main.py`)

`main.py` builds an owner named "Alex" with Biscuit (Dog) and Mochi (Cat) programmatically, then runs through every feature in sequence: prints the schedule as a `tabulate` grid table, reports conflict detection (Biscuit's "Vet appointment" at 14:00 and Mochi's "Playtime" at 14:00 collide), finds the next available slot for Biscuit, marks "Morning feeding" complete and shows the auto-generated recurrence, prints incomplete tasks only, shows priority-sorted order, saves to `data.json`, and reloads to verify persistence.

It includes a Windows UTF-8 fix:
```python
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
```

### Tests (`tests/test_pawpal.py`)

14 tests covering:

| Test | What it asserts |
|---|---|
| `test_task_completion_changes_status` | `mark_complete()` sets `completed=True` |
| `test_daily_task_creates_next_occurrence` | daily recurrence adds `due_date + 1 day` |
| `test_weekly_task_creates_next_occurrence` | weekly recurrence adds `due_date + 7 days` |
| `test_once_task_returns_none_on_completed` | `"once"` tasks return `None` on complete |
| `test_adding_task_increases_pet_task_count` | `task_count()` increments correctly |
| `test_sorting_returns_chronological_order` | `sort_by_time()` is chronological |
| `test_conflict_detection_flags_same_time` | duplicate times produce warning strings |
| `test_no_conflict_when_times_differ` | unique times produce no warnings |
| `test_filter_by_completion_status` | filters to incomplete only |
| `test_mark_complete_adds_recurrence_to_pet` | recurrence task appended to correct pet |
| `test_filter_by_pet_name` | filters tasks to a single named pet |
| `test_get_all_tasks_count` | `get_all_tasks()` spans all pets |
| `test_find_next_available_slot_avoids_occupied` | slot finder skips occupied times |
| `test_priority_sort_high_before_low` | high priority surfaces before low |

---

## Setup & Install Steps

```bash
# 1. Clone the repository
git clone https://github.com/tomiwaaluko/ai110-module2show-pawpal-starter.git
cd ai110-module2show-pawpal-starter

# 2. (Optional) create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4a. Run the Streamlit web UI
streamlit run app.py

# 4b. Or run the CLI demo
python main.py

# 5. Run the full test suite
python -m pytest tests/ -v

# 6. Run a single named test
pytest tests/test_pawpal.py::test_daily_task_creates_next_occurrence -v
```

The Streamlit app opens at `http://localhost:8501`. On first run it seeds two default pets (Biscuit the Dog, Mochi the Cat) with sample tasks. If `data.json` already exists in the working directory, it loads that saved state instead.

---

## Notable Implementation Decisions

### Strict layer separation enforced by convention
`pawpal_system.py` has zero Streamlit imports — this is an explicit constraint documented in CLAUDE.md. All four classes (`Task`, `Pet`, `Owner`, `Scheduler`) are importable by the test suite, `main.py`, or any future interface without pulling in Streamlit as a dependency. The tests validate only `pawpal_system`; the UI is untested by design, which is a conscious tradeoff for a course project of this scope.

### Lexicographic time sort is intentional and correct
`sort_by_time()` uses `sorted(..., key=lambda x: x[1].time)` with no datetime parsing. This works precisely because all times are stored as zero-padded `"HH:MM"` strings — string comparison gives the same ordering as numeric comparison for this format.

### `mark_complete()` returns a new Task rather than mutating
`Task.mark_complete()` sets `self.completed = True` on the current instance and constructs and returns a brand-new `Task` dataclass for the next recurrence. The caller (`Scheduler.mark_task_complete`) is responsible for appending the returned task to the pet's list. This makes the recurrence logic testable in isolation.

### `detect_conflicts()` is O(n²) and never raises
The conflict detector iterates all pairs with a nested loop (`for i … for j in range(i+1, …)`). For a pet care schedule with tens of tasks this is adequate. The method always returns a list — empty when no conflicts exist — so callers can unconditionally iterate the result without error handling.

### JSON persistence handles schema evolution with `.get()` defaults
`Owner.load_from_json()` reads the `priority` field with `t.get("priority", "medium")` rather than `t["priority"]`. This means a `data.json` written before the `priority` field was added will still load correctly, defaulting every old task to `"medium"` priority.

### `find_next_available_slot` uses a set for O(1) lookup
The occupied times are collected into a Python `set` via `{task.time for _, task in self.get_all_tasks()}` before the slot-search loop begins. Each candidate slot is checked with `if slot not in occupied` — a set membership test — rather than scanning the task list repeatedly.

### Windows UTF-8 workaround in `main.py`
`main.py` explicitly re-wraps `sys.stdout` with UTF-8 encoding when the terminal reports a non-UTF-8 encoding. This prevents Unicode errors when printing the emoji conflict warning strings (e.g., `"⚠ CONFLICT: …"`) on Windows terminals that default to `cp1252`.

### Four extensions built in as named features
- **Extension 1**: `find_next_available_slot` — first free 30-min window 07:00–21:00.
- **Extension 2**: `save_to_json` / `load_from_json` on `Owner` — full round-trip persistence.
- **Extension 3**: `priority` field on `Task` + `sort_by_priority_then_time()` on `Scheduler`.
- **Extension 4**: `tabulate`-formatted output in `main.py` CLI demo.


## Resume Bullet Points

- Designed and implemented a four-class OOP domain model (Task, Pet, Owner, Scheduler) for a pet care scheduling system with strict backend/UI layer separation, validated by a 14-test pytest suite covering recurrence, conflict detection, and priority ordering.
- Built scheduling algorithms including O(n2) conflict detection, two-key priority sort, lexicographic time-based ordering, and a set-based O(1) available-slot finder scanning 07:00-21:00 in 30-minute increments.
- Implemented JSON schema-evolution safety using .get() defaults for backward compatibility, and delivered dual interfaces (Streamlit web UI + CLI demo) from a single backend module with zero cross-layer imports.
