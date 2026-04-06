# gptscheduler — Project Overview

## Project Purpose

`gptscheduler` is a command-line CPU process scheduling simulator written in Rust. It reads a workload description from an input file and simulates how an operating system would schedule a set of processes under four distinct algorithms: First-Come First-Served (FCFS), Preemptive Shortest Job First (SJF), Round-Robin (RR), and a simplified Completely Fair Scheduler (CFS). The primary goal is to produce per-process and aggregate statistics — wait time, turnaround time, and response time — allowing direct comparison between scheduling strategies on the same workload. It was built as a programming assignment (PA1) with nine test cases spanning 2-, 5-, and 10-process workloads.

---

## Tech Stack & Rationale

| Technology | Role | Rationale |
|---|---|---|
| Rust (edition 2021) | Implementation language | Memory safety without a GC; strong type system makes process-state modeling explicit; `cargo` provides zero-configuration build and test |
| Cargo | Build system & package manager | Standard Rust toolchain; no external crates required — the project has zero runtime dependencies beyond `std` |
| ANSI escape codes (manual) | Terminal color output | No third-party crate needed; color constants declared inline, gated behind a `--enhanced` CLI flag |

The `Cargo.toml` declares no `[dependencies]` section — pure Rust standard library.

---

## Architecture Overview

```
src/
└── main.rs          — all structs, parsing, simulation, output, and entry point
pa1-testfiles/       — .in input files and .out expected-output files (9 test cases)
Cargo.toml           — package manifest (name: "scheduler", bin target: "scheduler")
CLAUDE.md            — developer notes for AI-assisted tooling
```

### Key Components

**`Process` struct** — the central data model:
- `name`, `arrival`, `burst` — parsed from the input file
- `remaining` — mutable burst left; decremented each tick for preemptive algorithms
- `first_run: Option<usize>` — tick at which the process was first dispatched (response time)
- `finish_time: Option<usize>` — set when the process completes
- `input_order: usize` — position in the input file; deterministic tie-breaker
- `vruntime: f64` — virtual runtime accumulator used exclusively by CFS

**Input parser** — reads directives line by line: `processcount N`, `runfor N`, `use <algorithm>`, `quantum N` (RR only), and `process name <n> arrival <a> burst <b>` entries.

**Four simulation functions:**
- `simulate_fcfs` — non-preemptive FIFO; ties broken by `input_order`
- `simulate_sjf` — preemptive; each tick selects the ready process with smallest `remaining`, ties broken by `input_order`
- `simulate_rr` — explicit ready queue; FIFO dispatch with configurable `quantum`; arriving processes enqueued before preempted process is re-queued
- `simulate_cfs` — each tick selects the runnable process with lowest `vruntime`; new arrivals inherit the current minimum `vruntime` to prevent starvation

**Output layer** — timestamped event log followed by per-process and aggregate statistics. Color output activated with `--enhanced`.

---

## Setup & Install Steps

**Prerequisites:** Rust stable toolchain via `rustup`.

```sh
git clone https://github.com/tomiwaaluko/gptscheduler
cd gptscheduler
cargo build

# Run a test case
./target/debug/scheduler pa1-testfiles/c2-fcfs.in

# Enhanced color output
./target/debug/scheduler --enhanced pa1-testfiles/c2-fcfs.in

# Verify against expected output
./target/debug/scheduler pa1-testfiles/c2-fcfs.in | diff - pa1-testfiles/c2-fcfs.out
```

On Windows: `target\debug\scheduler.exe`

---

## Notable Implementation Decisions

### Single-file design
All logic is in `src/main.rs` — unconventional for production Rust but appropriate for an academic assignment where reviewers read one file.

### `vruntime` inheritance in CFS
New arrivals receive the current minimum `vruntime` of all runnable processes, mirroring a key Linux CFS design: a fresh process starting at zero would immediately dominate the CPU and starve existing processes.

### `input_order` tie-breaking
Both FCFS and SJF use input-file position as a secondary key, making the simulator fully deterministic on equal-priority ties.

### `Option<usize>` for timing fields
Using `Option` rather than sentinel values (`usize::MAX`) makes it a compile-time error to use an uninitialized timing value — every call site must handle `None` explicitly.

### `--enhanced` flag for color
ANSI codes are opt-in so plain output can be piped into `diff` without escape-code pollution.

### No external crates
The project builds on any machine with a stock Rust install, immune to crate yanks, license changes, or `Cargo.lock` drift.


## Resume Bullet Points

- Implemented four CPU process scheduling algorithms (FCFS, Preemptive SJF, Round-Robin, CFS) in Rust with zero external crate dependencies, producing per-process wait time, turnaround time, and response time statistics.
- Engineered Linux CFS-inspired vruntime inheritance for new arrivals to prevent CPU starvation, and deterministic input_order tie-breaking to produce reproducible output across all four algorithms on identical workloads.
- Verified correctness across 9 test cases (2-, 5-, and 10-process workloads) via diff-based comparison against expected output files, validating operating systems scheduling theory in a compiled, memory-safe systems language.
