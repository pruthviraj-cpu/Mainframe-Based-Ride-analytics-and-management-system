# Project Requirements Document (PRD)
## Mainframe-Based Ride Analytics & Management System

### 1. Overview & Work Division
The project implements a mainframe ETL and batch processing pipeline using real-world NYC taxi trip data formatted into standard 80-byte Fixed Block (`FB`, `LRECL=80`) datasets.

#### Work Allocation:
- **JCL & REXX Responsibilities (Your Focus):**
  - **Assignment 1 (JCL SORT):** Read `FILE1_TRIP_DATA.ps`, deduplicate records, sort ascending by Trip ID (Cols 13–20), output clean sorted dataset.
  - **Assignment 3 (REXX Deduplication & Sorting):** Read `FILE2_DRIVER_DATA.ps`, deduplicate records, sort ascending by Trip ID (Cols 21–28), output clean sorted dataset.
  - **Assignment 4 (Conditional JCL & Pipeline Automation):** Master job controlling the end-to-end pipeline: run deduplication/sort steps, run COBOL matching/analytics, validate return codes (`IF RC = 00`), run file copy/compare utilities (IEBGENER, SUPERC/ISRSUPC), and conditionally catalog/archive clean datasets.
- **COBOL Responsibilities (Teammates' Scope):**
  - **Assignment 2 (COBOL Match & Analytics):** Match records from cleaned File 1 and File 2 by Trip ID, compute revenue split (75% Driver / 25% Platform), count pickup zones for surge pricing, and flag fraud anomalies (duration vs. distance).

---

### 2. Dataset Formats (LRECL = 80, RECFM = FB)

#### File 1: `FILE1_TRIP_DATA.ps` (Trip Financial & Location Data)
- **Cols 01–12:** Timestamp (`YYYYMMDDHHMM`)
- **Cols 13–20:** Trip ID `[PRIMARY KEY]` (e.g. `TR000001`)
- **Cols 21–23:** Pickup Zone ID (e.g. `001`)
- **Cols 24–26:** Dropoff Zone ID (e.g. `002`)
- **Cols 27–32:** Trip Distance in Miles (format `999.99` / `012.50`)
- **Cols 33–38:** Total Fare in USD (format `999.99` / `045.50`)
- **Cols 39–80:** Blank spaces (Filler)

#### File 2: `FILE2_DRIVER_DATA.ps` (Driver Telemetry & Duration)
- **Cols 01–08:** Driver ID (e.g. `DRV12345`)
- **Cols 09–20:** Filler (Spaces)
- **Cols 21–28:** Trip ID `[PRIMARY KEY]` (e.g. `TR000001`)
- **Cols 29–33:** Trip Duration (e.g. `015MN`)
- **Cols 34–80:** Filler (Spaces)

---

### 3. Deliverables for JCL & REXX

#### 1. Assignment 1: JCL SORT Job (`SORTF1.jcl`)
- Program: `DFSORT` / `SYNCSORT` (standard mainframe sort utility).
- Fields to sort: Cols 13–20, Character, Ascending (`FIELDS=(13,8,CH,A)`).
- Deduplication: `SUM FIELDS=NONE` to retain unique records by Trip ID.
- Input: `&&FILE1_IN` (or specified DSN).
- Output: `&&FILE1_SORTED` (or cataloged clean dataset).

#### 2. Assignment 3: REXX Script (`DEDUPF2.rexx`) & JCL Runner (`RUNREXX.jcl`)
- Input: Allocated or sequential dataset for `FILE2_DRIVER_DATA.ps`.
- Deduplication logic: Stem variables / associative array checking Trip ID (Cols 21–28).
- Sorting logic: Ascending sort on Trip ID (Cols 21–28) using in-place QuickSort in REXX.
- Output: Write deduplicated & sorted lines back to output DD / dataset.
- Execution: Executable either in TSO/ISPF or in batch via `IKJEFT01` / `IRXJCL`.

#### 3. Optional/Bonus REXX Utility: Dynamic Surge Pricing (`SURGEPRC.rexx` & `RUNSURGE.jcl`)
- Input: Cleaned/sorted `FILE1.SORTED` (or raw trip data) via `DD:TRIPIN`.
- Logic:
  - Extracts Pickup Zone ID (Cols 21–23) and fare amount (Cols 33–38).
  - Uses stem variables `zone_count.zone_id` to aggregate real-time demand.
  - Applies dynamic surge multipliers (`1.35x` moderate, `2.00x` high surge) when ride density surpasses configured thresholds.
- Output: Structured 80-byte demand & surge report written to `DD:SURGEOUT` (`RIDE.SURGE.REPORT`).

#### 4. Assignment 4: Master Conditional Workflow JCL (`MASTERWF.jcl`)
- Step 1: Pre-allocation / scratch of target datasets (`IEFBR14`).
- Step 2: Run Assignment 1 (JCL DFSORT on File 1).
- Step 3: Run Assignment 3 (REXX deduplication on File 2 via `IKJEFT01` or `IRXJCL`).
- Step 4: Verify `RC = 00` across previous steps.
- Step 5: Execute COBOL Analytics module (Assignment 2).
- Step 6: Conditional verification & IEBGENER copy / backup. If any step fails, bypass archive/reporting and execute error notification step.
