# bytebites_tinker_activity: Project Overview

## Project Purpose

`bytebites_tinker_activity` is a backend data-modeling exercise for a fictional fast-food ordering system called **ByteBites**. It was built as a structured "tinker activity" — a guided coding task where the goal is to implement a set of backend classes from a written design specification (`bytebites_design.md`) and verify them with a `pytest` test suite.

The system models the core entities of a food-ordering workflow:
- A **catalog** of food items that can be browsed and filtered by category.
- **Transactions** that group selected items and compute their total cost.
- **Customers** who accumulate a purchase history and can be verified as returning users.

There is no web server, database, or UI — the project is purely a Python domain-model implementation paired with a test suite, making it useful as a teaching tool for object-oriented design and test-driven development.

---

## Tech Stack & Rationale

| Technology | Role | Why it was chosen |
|---|---|---|
| Python 3 | Implementation language | Readable syntax well-suited to demonstrating OOP concepts cleanly |
| `decimal.Decimal` | Monetary arithmetic | Avoids floating-point rounding errors when computing order totals; prices are always converted via `Decimal(str(price))` to prevent float imprecision |
| `pytest` (>=7.0.0) | Test framework | Simple, expressive assertion syntax with no boilerplate; the only external dependency in the project |
| `from __future__ import annotations` | Type hint syntax | Enables the `X | Y` union syntax (e.g., `Decimal | float`) on Python versions before 3.10 |

The only entry in `requirements.txt` is `pytest>=7.0.0`, keeping the project minimal and easy to set up.

---

## Architecture Overview

The project is flat — no subdirectories, four files of substance:

```
models.py            # All four domain classes
test_bytebites.py    # pytest test suite
bytebites_design.md  # UML class diagram and design rationale
requirements.txt     # pytest>=7.0.0
```

### Domain Model (`models.py`)

Four classes implement the full domain:

#### `FoodItem`
Represents a single menu item. Stores `name`, `price` (as `Decimal`), `category` (a string such as `"Drinks"` or `"Desserts"`), and `popularity_rating` (a numeric score). Prices passed as floats or strings are normalized to `Decimal` in `__init__` via `Decimal(str(price))`.

#### `ItemCollection`
A catalog container holding a `list[FoodItem]`. Provides:
- `add_item(item)` — appends to the internal list.
- `filter_by_category(category)` — returns a filtered list using a list comprehension on `item.category`.
- `get_items_sorted_by_popularity()` — returns a new list sorted descending by `popularity_rating` using `sorted(..., key=lambda item: item.popularity_rating, reverse=True)`.

#### `Transaction`
Represents a single purchase. Holds `selected_items: list[FoodItem]`. Provides:
- `add_item(item)` — appends to the selection.
- `compute_total_cost()` — sums all item prices using `sum((item.price for item in self.selected_items), Decimal("0"))`, starting from a `Decimal("0")` identity to keep the return type consistent.

#### `Customer`
Represents a user. Stores `name` and `past_purchase_history: list[Transaction]`. The single method `verify_user()` returns `True` if `len(self.past_purchase_history) > 0`, establishing "has placed at least one order" as the definition of a verified user.

### Test Suite (`test_bytebites.py`)

Seven `pytest` tests, grouped by concern:

| Test | What it verifies |
|---|---|
| `test_calculate_total_with_multiple_items` | `compute_total_cost()` sums correctly across multiple items |
| `test_order_total_is_zero_when_empty` | Empty transaction returns `Decimal("0")` |
| `test_filter_by_category_returns_only_matching_items` | Only items with the matching category string are returned |
| `test_filter_by_category_returns_empty_list_when_no_match` | Returns `[]` when no items match |
| `test_get_items_sorted_by_popularity_returns_most_popular_first` | Sorted list is descending by `popularity_rating` |
| `test_verify_user_returns_false_when_no_purchase_history` | New customer with empty history is not verified |
| `test_verify_user_returns_true_after_purchase_recorded` | Customer with one transaction in history is verified |

### Design Document (`bytebites_design.md`)

Contains a UML class diagram in both ASCII art and Mermaid format, plus a table mapping each spec requirement to the class/method that fulfills it. The diagram was used as the blueprint before implementation.

---

## Setup & Install Steps

1. **Prerequisites:** Python 3.8+.

2. **Clone the repository:**
   ```bash
   git clone https://github.com/tomiwaaluko/bytebites_tinker_activity.git
   cd bytebites_tinker_activity
   ```

3. **Create and activate a virtual environment (recommended):**
   ```bash
   python -m venv venv
   source venv/bin/activate      # macOS/Linux
   venv\Scripts\activate         # Windows
   ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
   This installs `pytest>=7.0.0`, which is the only dependency.

5. **Run the tests:**
   ```bash
   pytest test_bytebites.py -v
   ```

6. **Run the inline demo (optional):**
   ```bash
   python models.py
   ```
   The `if __name__ == "__main__"` block in `models.py` runs a manual smoke test covering filtering, sorting, and cost computation, and prints `"All manual checks passed: filtering, sorting, and computing totals behave as intended."` on success.

---

## Notable Implementation Decisions

### `Decimal(str(price))` for safe price construction
`FoodItem.__init__` converts the incoming `price` (typed as `Decimal | float`) to a string first before passing it to `Decimal`. This is a deliberate correctness choice: constructing `Decimal` directly from a float (e.g., `Decimal(9.99)`) produces an imprecise value like `Decimal('9.9900000000000002131628...')`, whereas `Decimal(str(9.99))` produces the exact `Decimal('9.99')`. This matters for the `compute_total_cost()` assertion in the inline demo, which checks that `9.99 + 2.49 == Decimal("12.48")` exactly.

### `sum(..., Decimal("0"))` as the identity element
`compute_total_cost()` uses Python's built-in `sum` with a `Decimal("0")` start value rather than initializing a running total in a loop. This ensures the function always returns a `Decimal` even for an empty transaction (avoiding the default `int` `0` that `sum([])` would return), and expresses the intent concisely in one line.

### `verify_user()` defined purely by purchase history length
The definition of a "real" (verified) user is simply `len(self.past_purchase_history) > 0`. This maps directly to the design spec requirement — "used to verify real users" — and keeps the method a pure predicate with no side effects.

### Design-first workflow evidenced by `bytebites_design.md`
The repository includes a fully fleshed-out UML diagram (in both ASCII art and Mermaid syntax) alongside a requirements-traceability table before a single line of implementation code. This design-first approach means `models.py` reads as a direct translation of the diagram: class names, attribute names, and method signatures in the code match the UML exactly.

### `models.py` is both a library and a runnable script
The `if __name__ == "__main__"` block provides a self-contained smoke test that exercises filtering, sorting, and cost computation with inline `assert` statements. This serves as a quick sanity check without requiring `pytest`, useful during development before the formal test suite was added.


## Resume Bullet Points

- Implemented a four-class Python domain model (FoodItem, ItemCollection, Transaction, Customer) following a design-first workflow with UML class diagrams in Mermaid format, ensuring implementation matched the specification exactly.
- Applied Decimal(str(price)) for monetary arithmetic precision and sum(..., Decimal('0')) for type-safe empty-collection handling, validated by a 7-test pytest suite covering filtering, sorting, cost computation, and user verification edge cases.
- Demonstrated test-driven development with a self-contained smoke test in the module's __main__ block alongside the formal pytest suite, providing instant sanity checks without requiring a test runner.
