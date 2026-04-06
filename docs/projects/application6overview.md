# application6 — Project Overview

## Project Purpose

`application6` is a real-time embedded systems prototype for autonomous vehicle obstacle detection, built under the fictional company name "LidarSafe Technologies." The system demonstrates a LIDAR/ultrasonic perception pipeline on an ESP32 microcontroller using FreeRTOS, with continuous sensor reading, obstacle classification, warning output, and telemetry logging — all running as concurrent periodic tasks with strictly defined deadlines. The project serves as a proof-of-concept for Rate Monotonic Scheduling (RMS) principles applied to safety-critical automotive software.

---

## Tech Stack & Rationale

| Technology | Role | Rationale |
|---|---|---|
| C++ | Implementation language | Standard for embedded systems; direct hardware register access and deterministic memory layout |
| FreeRTOS | Real-time operating system | Priority-based preemptive scheduling, mutexes, semaphores, and queues — the exact primitives needed for multi-task determinism on ESP32 |
| ESP32 (Arduino framework) | Target MCU | Dual-core Xtensa LX6; `arduino` framework simplifies GPIO and UART without sacrificing RTOS control |
| PlatformIO | Build system | Manages ESP32 SDK, library dependencies, and both local and Wokwi simulation targets in a single `platformio.ini` |
| Wokwi | Circuit simulation | Full circuit-level simulation (HC-SR04, LEDs, button) in-browser; `wokwi.toml` + `diagram.json` define the virtual breadboard |
| HC-SR04 | Distance measurement | 2–400 cm range covers the three threshold zones defined in the spec |

---

## Architecture Overview

```
src/
└── main.cpp         — all task definitions, ISR, shared data, and Arduino setup/loop
platformio.ini       — build environments (local ESP32 + Wokwi simulation)
wokwi.toml           — Wokwi project descriptor
diagram.json         — virtual circuit: ESP32 + HC-SR04 + 3 LEDs + button
index.html           — Wokwi web simulation entry point
```

### GPIO Pin Map

| Pin | Role |
|---|---|
| 2 | Red LED — collision imminent |
| 15 | Yellow LED — proximity alert |
| 13 | Green LED — heartbeat |
| 5 | HC-SR04 TRIG |
| 18 | HC-SR04 ECHO |
| 4 | Emergency button (active LOW) |
| 19 | Debug timing pin |

### Key Data Structures

```cpp
typedef enum { OBSTACLE_NONE, OBSTACLE_FAR, OBSTACLE_PROXIMITY, OBSTACLE_COLLISION } ObstacleLevel_t;

typedef struct {
    float distance_cm;
    uint32_t timestamp_ms;
    bool valid;
} SensorData_t;

typedef struct {
    float distance_cm;
    ObstacleLevel_t level;
    uint32_t timestamp_ms;
    bool emergency_active;
} ProcessedData_t;
```

### Five FreeRTOS Tasks

| Task | Priority | Period | Deadline Type |
|---|---|---|---|
| SensorTask | 5 (highest) | 50ms | HARD |
| ProcessingTask | 4 | 100ms | HARD |
| WarningTask | 3 | 200ms | SOFT |
| TelemetryTask | 2 | 500ms | SOFT |
| HeartbeatTask | 1 (lowest) | 1000ms | SOFT |

Priority assignment directly implements Rate Monotonic Scheduling: shorter period = higher priority.

### Synchronization Primitives

- **Mutex** — protects shared `g_sensorData` between SensorTask (writer) and ProcessingTask (reader)
- **Binary semaphore** — signals ProcessingTask from the `Emergency_ISR` on button press, toggling emergency state
- **Queue (depth 5)** — passes `ProcessedData_t` from ProcessingTask to both WarningTask and TelemetryTask

---

## Setup & Install Steps

**Prerequisites:** PlatformIO (VS Code extension or CLI).

### Option A — Wokwi Simulation (no hardware required)
Open the project in Wokwi using `wokwi.toml` / `diagram.json` and click "Run".

### Option B — Physical ESP32

```sh
git clone https://github.com/tomiwaaluko/application6
cd application6
# Connect ESP32 via USB
pio run --target upload
pio device monitor --baud 115200
```

---

## Notable Implementation Decisions

### Rate Monotonic Scheduling enforced by priority numbers
Task priorities are assigned strictly inversely proportional to periods (SensorTask at 50ms → priority 5, HeartbeatTask at 1000ms → priority 1). This is a direct implementation of the RMS optimality theorem.

### Hard vs. soft deadline distinction
SensorTask and ProcessingTask have HARD deadlines — a missed deadline represents a safety failure with no graceful degradation. The three SOFT deadline tasks log a warning on a miss but continue running.

### `measureDistance()` with 30ms timeout
The HC-SR04 ECHO pulse can hang indefinitely if no object is detected. The 30ms timeout prevents SensorTask from blocking past its 50ms period deadline.

### WCET margin analysis in README
The project documents worst-case execution time margins: SensorTask has a 42ms margin within its 50ms period, ProcessingTask has an 88ms margin within its 100ms period. Not enforced in code but serves as the determinism proof required by the spec.

### ISR toggles emergency state
`Emergency_ISR` fires on the falling edge of the button pin and gives a binary semaphore. ProcessingTask flips a boolean flag, allowing the button to both activate and deactivate emergency mode.

### TelemetryTask uses `xQueuePeek` not `xQueueReceive`
Telemetry reads queue items without consuming them, so WarningTask still receives the same `ProcessedData_t`. This prevents a race where one consumer drains the queue before the other reads it.

### AI disclosure
The README explicitly notes that GitHub Copilot assisted with code structure and FreeRTOS API usage — good academic-integrity practice for AI-assisted development.


## Resume Bullet Points

- Implemented a FreeRTOS multi-task embedded system on ESP32 in C++ for autonomous vehicle obstacle detection, applying Rate Monotonic Scheduling theory with 5 concurrent tasks spanning 50ms-1000ms periods and HARD/SOFT deadline classification.
- Designed inter-task synchronization using a mutex for shared sensor structs, a binary semaphore for emergency button ISR signaling, and a depth-5 message queue passing ProcessedData_t from the processing task to downstream output tasks.
- Validated the real-time system design by documenting WCET margins (SensorTask: 42ms headroom within a 50ms period) and simulated the full circuit with HC-SR04, LEDs, and a push button in Wokwi without requiring physical hardware.
