# junior-design — Project Overview

## Project Purpose

This is an **EEL3926 Junior Design** embedded systems course project targeting the **Texas Instruments MSP430G2553** microcontroller. The system integrates four hardware subsystems into a single real-time sensing and display application:

1. An **HC-SR04 ultrasonic distance sensor** that measures distance to a nearby object.
2. A **SunFounder I2C LCD 1602 display** that shows the measured distance in mm and inches, alongside the current LED duty cycle percentage.
3. A **potentiometer connected to the ADC** (P1.3, channel A3) that controls LED brightness via PWM.
4. A **PWM-controlled LED** (P1.0) whose brightness tracks the potentiometer position in real time.

The main loop reads the ultrasonic sensor every ~600 ms, formats the distance and duty cycle into a string using `sprintf`, and writes it to the LCD in the format `{mm}mm {inches_int}.{inches_tenths}in {duty}%`.

---

## Tech Stack & Rationale

| Component | Details |
|---|---|
| **Language** | C (C11 standard, `-std=c11`) |
| **Target MCU** | MSP430G2553 — 16-bit, 8 MHz MCLK, 16 KB flash, 512 B RAM |
| **Primary IDE** | Code Composer Studio (TI) |
| **Alternate toolchain** | `msp430-elf-gcc` (TI MSP430-GCC open source toolchain) |
| **Build automation** | PowerShell script (`tools/msp430-build-flash.ps1`) + VS Code tasks |
| **Flashing tool** | TI MSP430Flasher (`MSP430Flasher.exe`) via Spy-Bi-Wire (SBW) |

**Why C:** The MSP430G2553 has 512 bytes of RAM. C gives direct, predictable control over register manipulation, interrupt vectors, and memory — essential when configuring Timer A, the USCI I2C module, and the ADC10.

---

## Architecture Overview

```
junior-design/
├── main.c               # Entry point — main loop and hardware initialization
├── Junior_Design.h      # All declarations AND implementations (single-header design)
├── tools/
│   └── msp430-build-flash.ps1   # PowerShell build + flash automation
├── .vscode/
│   ├── c_cpp_properties.json    # IntelliSense config
│   ├── tasks.json               # VS Code build/flash tasks
│   └── launch.json
└── CLAUDE.md
```

### Subsystem Breakdown

**I2C / LCD (P1.6 SCL, P1.7 SDA)**
Uses the MSP430G2553's USCI_B0 module in I2C master mode. Communicates with the SunFounder I2C LCD 1602 at slave address `0x27`. Each byte requires two I2C transactions (upper then lower nibble) with an E-strobe pulse. `LCD_I2C_Send` deliberately uses the busy-wait `Delay()` function (not `Delay_Timer`) because Timer A interrupts would corrupt I2C timing.

**Ultrasonic sensor (Trigger: P2.1, Echo: P2.0)**
A 10 µs pulse on P2.1 initiates a measurement. A GPIO interrupt on the rising edge of P2.0 captures `Elapsed_Time_Start` and sets `State_1 = 1`. The Timer A ISR polls P2.0 on every 10 µs tick; when `State_1 == 1` and P2.0 falls low, it records `Elapsed_Time_Stop`. Distance in mm: `(elapsed_ticks * 3.4) / 2.0`.

**ADC / PWM LED (ADC input: P1.3 / A3, LED: P1.0)**
ADC10 is configured with VCC as reference, single-conversion mode on channel A3. `ADC_Read()` triggers a conversion and busy-waits, returning a 10-bit result (0–1023). Duty cycle: `(ADC_Result / 10.23)`. Timer B ISR runs at 100 µs per tick, counting to 100 (10 ms period), setting P1.0 high if `Counter_B < Duty` — software PWM.

**Timer A (10 µs resolution)**
SMCLK (8 MHz), divider 1, up mode, `TACCR0 = 9 * 8 = 72`. Fires every ~10 µs. Increments `Delay_Count` and `Counter` (ultrasonic echo timing).

**Timer B (100 µs resolution)**
SMCLK (8 MHz), `TA1CCR0 = 99 * 8 = 792`. Fires every ~100 µs. Drives software PWM for LED brightness.

### Global State Variables

| Variable | Purpose |
|---|---|
| `Delay_Count` | Incremented by Timer A ISR; consumed by `Delay_Timer()` |
| `Counter` | Running tick count since last trigger; used for echo timing |
| `Elapsed_Time_Start` | Timer A counter value at echo rising edge |
| `Elapsed_Time_Stop` | Timer A counter value at echo falling edge |
| `Duty` | Current PWM duty cycle (0–100); updated from ADC each loop iteration |
| `Trigger1` | Flag: 1 = trigger sent, awaiting rising edge |
| `State_1` | State machine: 0 = idle, 1 = measuring echo pulse width |

---

## Setup & Install Steps

### Prerequisites
1. **TI MSP430-GCC** — install to `C:\ti\msp430-gcc\`
2. **TI MSP430Flasher** — install to `C:\ti\MSPFlasher\`
3. **VS Code** with the C/C++ extension
4. **MSP430G2553 LaunchPad** connected via USB

### Build and Flash (VS Code)

Open the repo in VS Code. Via **Terminal → Run Task**:
- **MSP430: Build (ELF + HEX)** — compiles to `build/junior-design.elf` + `.hex`
- **MSP430: Flash** — flashes; prompts for COM port (e.g., `COM3`)
- **MSP430: Build + Flash** — runs both steps

The default build task (Ctrl+Shift+B) runs **MSP430: Build (ELF + HEX)**.

### Build and Flash (command line)

```powershell
# Build
powershell -ExecutionPolicy Bypass -File tools\msp430-build-flash.ps1 build

# Flash
powershell -ExecutionPolicy Bypass -File tools\msp430-build-flash.ps1 flash -ComPort COM3

# Build + flash
powershell -ExecutionPolicy Bypass -File tools\msp430-build-flash.ps1 all -ComPort COM3
```

Compiler flags: `-mmcu=msp430g2553 -Os -g -Wall -Wextra -std=c11`

---

## Notable Implementation Decisions

### Single-header implementation (`Junior_Design.h`)
All function declarations and their full implementations are placed in `Junior_Design.h`. The entire project is a single translation unit — `main.c` includes the header — eliminating the need for a makefile, linker scripts, or multi-file compilation management. Pedagogically convenient for a course project.

### Two-timer architecture for independent timing domains
Timer A (10 µs) measures ultrasonic echo pulses with ~3.4 mm distance resolution. Timer B (100 µs, 10 ms period) implements the LED PWM. These needs are incompatible in a single timer — two separate peripherals prevent rate-interaction bugs.

### Interrupt-driven echo measurement with a two-variable state machine
Rather than polling P2.0 in the main loop, a GPIO interrupt captures the echo rising edge and sets `Elapsed_Time_Start`. The Timer A ISR detects the falling edge by polling P2.0 every tick. The `Trigger1` and `State_1` flags prevent spurious edge captures.

### Deliberate busy-wait delay inside I2C send
`LCD_I2C_Send` uses `Delay()` (a for-loop busy wait) instead of `Delay_Timer()` (interrupt-driven). A comment explains: interrupts corrupt I2C communication timing. The USCI_B0 state machine is sensitive to timing interruptions mid-transaction.

### Software PWM in Timer B ISR
No hardware PWM on P1.0. The Timer B ISR manually toggles the pin each 100 µs tick based on `Counter_B < Duty`. This gives a 10 ms PWM period with 100 steps of resolution without consuming a hardware compare register.

### Distance formula using integer arithmetic
Rather than `printf`'s `%f` (unavailable on MSP430), the code splits the inch value into integer and tenths parts:
```c
d_1  = (int)((float)d1 * 0.066929);
d_10 = (int)((float)d1 * 0.66929) - d_1 * 10;
```
Displayed as `%d.%d` — avoids floating-point formatting overhead while still showing one decimal place.


## Resume Bullet Points

- Developed a real-time embedded sensing system on the MSP430G2553 MCU in C, integrating an I2C LCD display, HC-SR04 ultrasonic sensor, ADC potentiometer input, and PWM-controlled LED using interrupt-driven architecture across two independent timer domains (10us and 100us).
- Implemented software PWM in a Timer B ISR with 100-step duty cycle resolution and ultrasonic echo timing via a GPIO interrupt plus Timer A polling state machine, achieving distance measurement with approximately 3.4mm resolution.
- Built a VS Code and PowerShell build automation pipeline (msp430-build-flash.ps1) for compile, flash, and preview workflows, replacing the course-standard Code Composer Studio with a scriptable cross-platform toolchain.
