# Fee Invoice Project — Project Overview

## Project Purpose

A console-based Java application built for **Valence College** (Orlando, FL) that automates the generation of student fee invoices and manages course records. The system was written as a group academic project (COP3300) with an explicit focus on demonstrating object-oriented programming principles in a realistic institutional context.

The application lets a college administrator:
- Register, look up, and remove students of three distinct types (Undergraduate, MS, PhD)
- Load a course catalog from a flat CSV file (`lec.txt`)
- Print formatted fee invoices tailored to each student type's billing rules
- Manage courses and their associated lab sessions through an interactive command-line menu

---

## Tech Stack & Rationale

| Technology | Role | Why |
|---|---|---|
| **Java** | Sole implementation language | Required by COP3300; Java's class hierarchy and interface system are a natural fit for an OOP-focused assignment |
| **Java Standard Library** (`java.util`, `java.io`) | Collections (`ArrayList`), console I/O (`Scanner`), file reading (`File`, `FileNotFoundException`) | No external dependencies needed |
| **Plain-text CSV (`lec.txt`)** | Course catalog persistence | Lightweight, human-editable; suitable for a demo with no database requirement |

No build tool (Maven, Gradle, or Ant) is present. The project compiles and runs directly with `javac` / `java`.

---

## Architecture Overview

The entire project lives in a single file, `ProjectDriver.java`. The student class hierarchy is:

```
Student (abstract)
├── UndergraduateStudent
└── GraduateStudent (abstract)
    ├── MsStudent
    └── PhdStudent
```

### Key Classes

| Class | Responsibility |
|---|---|
| `Student` | Abstract base; declares `addCourse(String)` and `printInvoice(ArrayList<Course>)` contracts |
| `UndergraduateStudent` | Residency flag and GPA; in-state ($120.25/hr) vs. out-of-state ($240.50/hr); 25% discount when GPA >= 3.5 and total > $500 |
| `MsStudent` | Flat $300.00/credit-hour rate; course list supplied at construction as `ArrayList<String>` |
| `PhdStudent` | Research-fee model ($700.00 base); number of supervised labs drives a tiered discount |
| `Course` | Holds CRN, course code, name, level, modality, location, credit hours, lab flag, and nested lab sessions; parses 6-column and 8-column CSV rows |
| `College` | In-memory course repository; `addCourse`, `addLab`, `getCourses`, `setCourses` |
| `IdException` | Custom checked exception for ID-format violations and duplicate-ID attempts |
| `ProjectDriver` | Entry point; owns the `main` loop, both sub-menus, and all private static handler methods |

### Runtime Flow

1. On startup, `ProjectDriver.main` opens `lec.txt` with a `Scanner` and reads it line by line. Rows with more than 2 fields → course records; rows with exactly 2 fields → lab entries appended to the most-recently-seen course via `College.addLab`.
2. A `while(running)` loop presents the main menu. All user input goes through a single shared `Scanner`.
3. Student and course operations are handled by dedicated private static methods, keeping `main` clean.

---

## Setup & Install Steps

### Prerequisites
- Java 8 or higher

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/tomiwaaluko/Fee-Invoice-Project.git
   cd Fee-Invoice-Project
   ```

2. **Update the hard-coded file path** — open `ProjectDriver.java` and update:
   ```java
   File newFile = new File("C:\\Users\\gokug\\OneDrive\\Desktop\\COP3300\\projecthelp\\lec.txt");
   ```
   Replace with the actual path to `lec.txt` on your machine.

3. **Compile**
   ```bash
   javac ProjectDriver.java
   ```

4. **Run**
   ```bash
   java ProjectDriver
   ```

### Student Input Formats (during "Add a student")

| Type | Prompt format |
|---|---|
| Undergraduate | `Name\|Residency(YES/NO)\|GPA\|Course1,Course2,...` |
| MS | `Name\|Course1,Course2,...` |
| PhD | `Name\|Advisor\|ResearchSubject\|Lab1,Lab2,...` |

Student IDs must follow `LLdddd` — exactly two letters followed by four digits (e.g., `ab1234`).

---

## Notable Implementation Decisions

### Single-file design
All classes are defined in one `.java` file. Keeps the project portable for submission (one file to compile) and eliminates any build tooling or package structure.

### Polymorphic `printInvoice`
Each concrete student class overrides `printInvoice(ArrayList<Course>)`. The caller in `printStudentInvoice` calls `student.printInvoice(courses)` without knowing the runtime type — a textbook use of polymorphism through a common abstract interface.

### GPA-based discount for undergraduates
Undergraduate students with GPA >= 3.5 **and** computed total > $500 receive a 25% reduction applied to the pre-loop total inside `UndergraduateStudent.printInvoice`.

### PhD lab-supervision fee tiers
`PhdStudent.printInvoice` uses a ternary chain:
- 3+ labs supervised → only the $35.00 health/ID fee (research fee waived)
- Exactly 2 labs → 50% of the $700.00 research fee ($350.00)
- 1 or 0 labs → full $700.00 research fee

### Custom `IdException`
Student IDs are validated against `[a-zA-Z]{2}\\d{4}` before any student object is created. Both format violations and duplicate IDs throw `IdException extends Exception`, separating validation logic with a try/catch in `addStudent`.

### CSV parsing handles two row shapes
The `Course` constructor branches on `values.length`: 8-column rows include a lab flag and location field; 6-column rows are online sections that omit the room number.

### Hard-coded absolute file path (known limitation)
The path to `lec.txt` is embedded as a Windows absolute path inside `main`. A future improvement would be to accept the path as `args[0]` or use a relative path.

### Known bug — health fee double-counted for undergraduates
`UndergraduateStudent.printInvoice` adds `healthFee` ($35.00) to `totalFee` twice: once before the loop and once after. This inflates the printed total by $35.00 for every undergraduate student.

### `MsStudent` name field never assigned
In `MsStudent`, the constructor never sets `this.name` — the parameter is absent from the constructor signature entirely. As a result, `MsStudent.getName()` always returns `null`, causing the invoice header to display `null` for MS student names.


## Resume Bullet Points

- Engineered a Java console application implementing a four-level polymorphic class hierarchy (Student, UndergraduateStudent, GraduateStudent, MsStudent, PhdStudent) to automate tiered fee invoice generation for a college billing system, applying core OOP principles from COP3300.
- Designed a CSV-driven course catalog parser supporting two row schemas and a custom IdException class with regex-based ID validation, separating input validation from business logic via checked exceptions.
- Implemented tiered billing rules including GPA-based tuition discounts, PhD lab-supervision fee waivers, and in-state/out-of-state residency rates across all student types through method overriding on a shared abstract interface.
