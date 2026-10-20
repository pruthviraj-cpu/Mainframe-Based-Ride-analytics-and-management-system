# Mainframe-Based Ride Analytics and Management System

An enterprise-grade, end-to-end batch processing pipeline built on **IBM z/OS Mainframe technologies (JCL, DFSORT, REXX, Enterprise COBOL 85)** and modern data engineering tools (**Python, uv, pandas**), utilizing real-world New York City (NYC) Taxi and Limousine Commission trip datasets.

---

## 1. System Architecture

```
                                  [ REAL NYC TAXI DATA ]
                                (NYC TLC Yellow Taxi CSV)
                                            |
                                            v
                              +----------------------------+
                              |   Python ETL Pipeline      |
                              |   (DataPreprocessing)      |
                              +--------------+-------------+
                                             |
                   Generates 80-byte Fixed Physical Sequential (PS) Files
                                             |
                     +-----------------------+-----------------------+
                     |                                               |
                     v                                               v
        FILE1_TRIP_DATA.ps (Raw)                        FILE2_DRIVER_DATA.ps (Raw)
        - Timestamp, Trip ID, Pickup/Dropoff,           - Driver ID, Trip ID, Duration
          Distance, Total Fare                          - Unsorted, contains duplicates
        - Unsorted, contains duplicates                              |
                     |                                               |
                     v                                               v
        +----------------------------+                  +----------------------------+
        |  ASSIGNMENT 1: JCL SORT    |                  |  ASSIGNMENT 3: REXX DEDUP  |
        |  (JCL/SORTF1.jcl)          |                  |  (REXX/DEDUPF2.rexx)       |
        |  - DFSORT by Trip ID       |                  |  - Stem lookup dedup       |
        |  - SUM FIELDS=NONE dedup   |                  |  - QuickSort by Trip ID    |
        +--------------+-------------+                  +--------------+-------------+
                       |                                               |
                       | Clean & Sorted                                | Clean & Sorted
                       v                                               v
              FILE1.SORTED (TRIPDATA)                         FILE2.SORTED (DRVDATA)
                       |                                               |
                       +-----------------------+-----------------------+
                                               |
                                               v
                              +---------------------------------+
                              |   ASSIGNMENT 2: COBOL ENGINE    |
                              |   (COBOL/RIDEANLZ.cbl)          |
                              |   - Balance-Line Sequential     |
                              |     File Merge                  |
                              |   - 75/25 Ledger Financials     |
                              |   - Speed & Low-Fare Fraud      |
                              |   - 265-Zone OCCURS Analytics   |
                              +----------------+----------------+
                                               |
        +--------------------------------------+--------------------------------------+
        |                                      |                                      |
        v                                      v                                      v
+-----------------------+              +-----------------------+              +-----------------------+
|  FILE3-MASTER-LEDGER  |              |  FILE4-FRAUD-REPORT   |              |   FILE5-SUMMARY-RPT   |
|  - Clean trip records |              |  - Speed > 85 MPH     |              |  - Totals & Revenue   |
|  - Driver Payout (75%)|              |  - Dist>10mi & Fare<$5|              |  - Top 3 Hot Zones    |
|  - Platform Fee (25%) |              |  - Quarantined audit  |              |  - Driver Allocation  |
+-----------------------+              +-----------------------+              +-----------+-----------+
                                                                                          |
                                 +--------------------------------------------------------+
                                 | If COBOL RC = 00
                                 v
                 +--------------------------------+
                 |  ASSIGNMENT 4: MASTER WORKFLOW |
                 |  (JCL/MASTERWF.jcl)            |
                 |  - Automatic conditional chain |
                 |  - IEBGENER Backup Archive     |
                 |  - Failure Alert Notification  |
                 +--------------------------------+
```

---

## 2. Repository Layout

```
.
├── COBOL/
│   ├── README.md               # Detailed technical documentation for COBOL batch engine
│   └── RIDEANLZ.cbl            # Core COBOL 85 Batch Program (Assignment 2)
│
├── DataPreprocessing/
│   ├── FILE1_TRIP_DATA.ps      # Real NYC trip dataset (80-byte PS layout, raw)
│   ├── FILE2_DRIVER_DATA.ps    # Real NYC driver telemetry dataset (80-byte PS layout, raw)
│   ├── FILE1_TRIP_DATA_B.ps    # Batch A test dataset (50 clean trips, zero fraud)
│   ├── FILE2_DRIVER_DATA_B.ps  # Batch A driver test dataset
│   ├── FILE1_TRIP_DATA_C.ps    # Batch C test dataset (40 clean, 20 fraud, 10 orphans)
│   ├── FILE2_DRIVER_DATA_C.ps  # Batch C driver test dataset
│   ├── generate_extra_files.py # Offline synthetic data generator for test batches
│   ├── script.py               # Original ETL script streaming live NYC TLC data
│   ├── test_rideanlz.py        # Automated test suite simulating the COBOL pipeline
│   ├── pyproject.toml          # uv package configuration
│   └── uv.lock                 # Deterministic dependency lockfile
│
├── JCL/
│   ├── MASTERWF.jcl            # Assignment 4: Master conditional orchestration workflow
│   ├── RUNCOBOL.jcl            # Assignment 2: Standalone COBOL Compile, Link & Run
│   ├── RUNREXX.jcl             # Assignment 3: Standalone Batch REXX Deduplication
│   ├── RUNSURGE.jcl            # Dynamic surge pricing batch job
│   └── SORTF1.jcl              # Assignment 1: DFSORT trip data sanitization job
│
├── REXX/
│   ├── DEDUPF2.rexx            # Assignment 3: REXX QuickSort & deduplication script
│   └── SURGEPRC.rexx           # Dynamic surge pricing & demand density monitor
│
├── PRD.md                      # Project Requirements Document
├── README.md                   # Overall project documentation (this file)
└── LICENSE                     # Project License
```

---

## 3. Step-by-Step Concrete Example: How Data Flows

Let us trace two actual 80-byte records through the entire pipeline:

### Step 3.1: Raw Input Records
Suppose the ETL pipeline produces these two 80-character records:

**FILE1 (Trip Data):**
```
202101010021TR0000022301810096104589                                            
```
*Decoded by column range:*
- `Cols 01-12` (`202101010021`): Timestamp = Jan 01, 2021, 00:21
- `Cols 13-20` (`TR000002`): **TRIP-ID (Primary Key)**
- `Cols 21-23` (`230`): Pickup Zone ID
- `Cols 24-26` (`181`): Dropoff Zone ID
- `Cols 27-32` (`00961`): Distance = **9.61 miles** (`PIC 9(4)V99`)
- `Cols 33-38` (`04589`): Total Fare = **$45.89** (`PIC 9(4)V99`)
- `Cols 39-80`: 42 blank spaces

**FILE2 (Driver Data):**
```
DRV71653            TR00000201850                                               
```
*Decoded by column range:*
- `Cols 01-08` (`DRV71653`): Driver ID
- `Cols 09-20`: 12 blank spaces
- `Cols 21-28` (`TR000002`): **TRIP-ID (Primary Key)**
- `Cols 29-33` (`01850`): Duration = **18.50 minutes** (`PIC 9(3)V99`)
- `Cols 34-80`: 47 blank spaces

---

### Step 3.2: Sanitization (SORTF1 & DEDUPF2)
1. `SORTF1.jcl` processes FILE1 using DFSORT:
   - Sorts ascending by key `(13,8,CH,A)` (`TR000002`).
   - `SUM FIELDS=NONE` discards any duplicate lines with the same `TR000002` key.
2. `DEDUPF2.rexx` processes FILE2:
   - Checks `seen.TR000002`. If seen before, skips it.
   - Runs in-place QuickSort on `trip_ids` array.
   - Both files are now strictly sorted ascending by `TRIP-ID`.

---

### Step 3.3: Balance-Line Matching in COBOL (`RIDEANLZ.cbl`)
The program reads one record from FILE1 and one record from FILE2:
- `WS-F1-CURRENT-KEY` = `TR000002`
- `WS-F2-CURRENT-KEY` = `TR000002`
- Evaluation: `WS-F1-CURRENT-KEY = WS-F2-CURRENT-KEY` $\rightarrow$ **MATCH DETECTED!**

---

### Step 3.4: Financial Ledger Calculation
```
Total Fare          = $45.89
Driver Payout (75%) = $45.89 * 0.75 = $34.42 (COMPUTE ROUNDED)
Platform Comm (25%) = $45.89 * 0.25 = $11.47 (COMPUTE ROUNDED)
```

---

### Step 3.5: Fraud Detection Check
1. **Implied Speed:**
   $$\text{Speed} = \frac{\text{Distance}}{\text{Duration in Hours}} = \frac{9.61 \text{ miles}}{18.50 \text{ mins} / 60} = \frac{9.61 \times 60}{18.50} = \mathbf{31.17\text{ MPH}}$$
   - Threshold check: Is $31.17 > 85.0\text{ MPH}$? **No.**
2. **Fare Anomaly:**
   - Threshold check: Is $\text{Distance} > 10.0$ and $\text{Fare} < \$5.00$?
   - $9.61 \ngtr 10.0$ and $\$45.89 \nless \$5.00$. **No.**

Result: **Clean ride approved.**

---

### Step 3.6: Record Routing & Tally
- Record is written to `FILE3-MASTER-LEDGER` (`LEDGER` DD):
  ```
  TR000002DRV716532021010100212301810009610045890034420011470185003117            
  ```
- Platform Revenue accumulator: `WS-ACCUM-PLATFORM += $11.47`
- Driver Payout accumulator: `WS-ACCUM-PAYOUT += $34.42`
- Dropoff Zone ID = `181`:
  `WS-ZONE-COUNT(181) += 1`

---

### Step 3.7: What Happens If Fraud Occurs? (Contrasting Example)
Suppose a trip record has:
- Distance = `21.27 miles`
- Duration = `1.68 minutes` (recorded as `00168`)
- Fare = `$53.17`

$$\text{Implied Speed} = \frac{21.27 \times 60}{1.68} = \mathbf{759.64\text{ MPH}}$$
Because $759.64 > 85.0$:
- Flag set: `WS-FRAUD-REASON = 'SPEED>85MPH'`
- Written to **`FILE4-FRAUD-REPORT`** instead of the master ledger:
  ```
  TC000041DRV40301SPEED>85MPH 00212700531700168075964                              
  ```
- Excluded from platform revenue and dropoff zone tallies.

---

### Step 3.8: Summary Report Output (`FILE5-SUMMARY-RPT`)
When both files reach `HIGH-VALUES` (EOF), the 3-pass selection scan ranks all 265 zones:
```
======================================================================
   NYC TAXI RIDE ANALYTICS SYSTEM -- SUMMARY REPORT
======================================================================
   Total Clean Trips to Ledger  :       40
   Total Fraud Trips Caught     :       20
   Unmatched FILE1 (no driver)  :        5
   Unmatched FILE2 (no trip)    :        5
   Total Platform Revenue ($25%): $    171.84
   Total Driver Payouts  ($75%) : $    515.57

======================================================================
   TOP 3 MOST POPULAR DROPOFF ZONES (Driver Routing)
======================================================================
   Rank   Zone ID    Trip Count   Notes
   -----------------------------------------------------------------
   #1     Zone 65      2          RECOMMENDATION: ALLOCATE IDLE DRIVERS TO THIS HIGH-DEMAND ZONE
   #2     Zone 231     2          
   #3     Zone 255     2          
======================================================================
```

---

## 4. How to Run the System

### Option A: Running on an IBM z/OS Mainframe

#### 1. Allocate Datasets & Upload Files
Upload the 80-byte files using Zowe CLI, FTP, or IBM Host On-Demand into physical sequential datasets:
```
Dataset Name: &SYSUID..RIDE.FILE1.RAW  (RECFM=FB, LRECL=80, BLKSIZE=32720)
Dataset Name: &SYSUID..RIDE.FILE2.RAW  (RECFM=FB, LRECL=80, BLKSIZE=32720)
```

#### 2. Submit the Master Workflow
Submit `JCL/MASTERWF.jcl` via TSO or Zowe CLI:
```bash
zowe zos-jobs submit local-file "JCL/MASTERWF.jcl"
```
Or within TSO/ISPF option `6`:
```tso
SUBMIT 'USERID.MAINFRAME.JCL(MASTERWF)'
```
The job will:
1. Delete old outputs (`CLEANUP` via `IEFBR14`)
2. Sort & dedup FILE1 (`SORTF1` via `SORT`)
3. Dedup & sort FILE2 (`REXXF2` via `IKJEFT01`)
4. Check `IF (SORTF1.RC = 0 AND REXXF2.RC = 0)`
5. Run `RIDEANLZ` COBOL program
6. Check `IF (RUNCOBOL.RC = 0)`
7. Backup report via `IEBGENER`

#### 3. Inspect Spool Outputs
Check SDSF under your job name for:
- `SYSOUT` of `RUNCOBOL`
- Cataloged datasets:
  - `&SYSUID..RIDE.FILE3.LEDGER`
  - `&SYSUID..RIDE.FILE4.FRAUDRPT`
  - `&SYSUID..RIDE.FILE5.SUMRPT`
  - `&SYSUID..RIDE.BACKUP.REPORT`

---

### Option B: Running Locally on PC (Testing & Verification)

You do not need access to an active z/OS mainframe to test the entire business logic, algorithms, and data files.

#### 1. Set Up Environment
```powershell
cd DataPreprocessing
uv sync
```

#### 2. Generate Extra Test Files (Offline)
Run the synthetic test data generator to create clean and fraud test files:
```powershell
python generate_extra_files.py
```
This produces:
- `FILE1_TRIP_DATA_B.ps` & `FILE2_DRIVER_DATA_B.ps` (50 clean rides)
- `FILE1_TRIP_DATA_C.ps` & `FILE2_DRIVER_DATA_C.ps` (40 clean, 20 fraud, 10 orphans)

#### 3. Run the Automated Test Suite
```powershell
python test_rideanlz.py
```
Output:
```
======================================================================
  RIDEANLZ COBOL LOGIC - PYTHON TEST SIMULATOR
  Tests Balance-Line, Financials, Fraud, Zones, Report
======================================================================
...
  [PASS] Clean trips in ledger: 40 == 40
  [PASS] Fraud trips caught: 20 == 20
  [PASS] Unmatched FILE1: 5 == 5
  [PASS] Unmatched FILE2: 5 == 5
  [PASS] Financial calc accuracy (75/25 split): All correct
  [PASS] Speed fraud records all have speed > 85 MPH
  [PASS] Low-fare fraud records all match dist>10mi & fare<$5
  [PASS] Zone tally total == clean trip count (40)

  Results: 8 passed, 0 failed

======================================================================
  OVERALL: ALL TESTS PASSED [OK]
======================================================================
```

---

## 5. Technical Specifications Reference

| Property | Value |
|---|---|
| **Operating System** | IBM z/OS V2R4 / V2R5 |
| **COBOL Standard** | Enterprise COBOL for z/OS V6.3 (COBOL 85 standard) |
| **Record Format** | Fixed Blocked (`RECFM=FB`) |
| **Record Length** | 80 characters (`LRECL=80`) |
| **Primary Matching Key** | `TRIP-ID` (8 characters, e.g. `TR000001`) |
| **FILE1 Key Location** | Columns 13–20 |
| **FILE2 Key Location** | Columns 21–28 |
| **Algorithm Complexity** | $O(N + M)$ single-pass Balance-Line stream merge |
| **Array Allocations** | Direct indexing 265-element OCCURS table |

---

## 6. License
This project is open-source and available under the terms of the [LICENSE](LICENSE) file.
