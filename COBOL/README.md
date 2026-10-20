# COBOL Module: RIDEANLZ (Assignment 2)

Core Enterprise COBOL batch engine for the **Mainframe-Based Ride Analytics & Management System**.

`RIDEANLZ.cbl` implements a high-throughput, sequential Balance-Line merge between trip telemetry and driver tracking files, computes ledger financials, detects fraudulent transactions, dynamically ranks NYC pickup/dropoff zones using working-storage OCCURS arrays, and emits formatted analytics reports.

---

## 1. Overview & Architecture

In batch processing systems (z/OS, IBM Enterprise COBOL), high volumes of transactional data cannot be stored in-memory in databases. Instead, sequential files are pre-sorted by primary keys and processed using stream-based algorithms.

```
+------------------------------------------------------------------------+
|                              INPUT STAGE                               |
|                                                                        |
|  FILE1-TRIP-DATA (TRIPDATA DD)        FILE2-DRIVER-DATA (DRVDATA DD)   |
|  - 80-byte Fixed PS                   - 80-byte Fixed PS               |
|  - Sorted ascending by TRIP-ID        - Sorted ascending by TRIP-ID    |
+-----------------------------------+------------------------------------+
                                    |
                                    v
+------------------------------------------------------------------------+
|             BALANCE-LINE SEQUENTIAL MATCH ENGINE (COBOL 85)            |
|                                                                        |
|  - Compare WS-F1-CURRENT-KEY vs WS-F2-CURRENT-KEY                      |
|  - F1 < F2 : Unmatched Trip (orphan trip record, no driver logged)     |
|  - F2 < F1 : Unmatched Driver (orphan driver telemetry, no trip logged)|
|  - F1 = F2 : MATCH DETECTED -> Proceed to Financials & Fraud Engine    |
+-----------------------------------+------------------------------------+
                                    |
          +-------------------------+-------------------------+
          |                                                   |
          v [Fraud Rules Triggered]                           v [Clean Ride]
+------------------------------------+     +------------------------------------+
|        FILE4-FRAUD-REPORT          |     |        FILE3-MASTER-LEDGER         |
|        (FRAUDRPT DD)               |     |        (LEDGER DD)                 |
|  - Speed > 85.0 MPH                |     |  - Driver Payout (75%)             |
|  - Distance > 10 mi & Fare < $5.00 |     |  - Platform Revenue (25%)          |
|  - Written to fraud audit file     |     |  - Clean trip record archived      |
+------------------------------------+     +------------------+-----------------+
                                                              |
                                                              v
+------------------------------------------------------------------------+
|          PREDICTIVE ZONE ANALYTICS TABLE (OCCURS 265 TIMES)            |
|                                                                        |
|  - Dropoff Zone ID directly maps to OCCURS table index [1..265]        |
|  - Tally incremented: ADD 1 TO WS-ZONE-COUNT(WS-DROPOFF-ZONE)          |
+-----------------------------------+------------------------------------+
                                    |
                                    v [At EOF - 3-Pass Selection Scan]
+------------------------------------------------------------------------+
|                          FILE5-SUMMARY-RPT                             |
|                          (SUMRPT DD)                                   |
|  - Total Trips Processed & Total Fraud Trips Flagged                   |
|  - Total Platform Revenue ($$,$$9.99 format)                           |
|  - Top 3 Hottest NYC Dropoff Zones with Driver Allocation Advisory     |
+------------------------------------------------------------------------+
```

---

## 2. File Specifications & Record Layouts (LRECL = 80, RECFM = FB)

### Input 1: `FILE1-TRIP-DATA` (`TRIPDATA` DD)
*Produced by Python ETL and sorted by `SORTF1.jcl`.*

| Position | COBOL Field Name | Picture | Description |
|:---:|:---|:---|:---|
| **01–12** | `F1-TIMESTAMP` | `PIC X(12)` | Pickup timestamp (`YYYYMMDDHHMM`) |
| **13–20** | `F1-TRIP-ID` | `PIC X(8)` | **Primary Key** (e.g. `TR000001`) |
| **21–23** | `F1-PICKUP-ZONE` | `PIC 9(3)` | TLC Pickup Zone ID (`001` - `265`) |
| **24–26** | `F1-DROPOFF-ZONE` | `PIC 9(3)` | TLC Dropoff Zone ID (`001` - `265`) |
| **27–32** | `F1-DISTANCE` | `PIC 9(4)V99` | Distance in miles (`001234` = 12.34 mi) |
| **33–38** | `F1-TOTAL-FARE` | `PIC 9(4)V99` | Fare amount in USD (`004550` = $45.50) |
| **39–80** | `F1-FILLER` | `PIC X(42)` | Unused / Blank spaces |

### Input 2: `FILE2-DRIVER-DATA` (`DRVDATA` DD)
*Produced by Python ETL and sorted/deduped by `DEDUPF2.rexx`.*

| Position | COBOL Field Name | Picture | Description |
|:---:|:---|:---|:---|
| **01–08** | `F2-DRIVER-ID` | `PIC X(8)` | Driver identifier (e.g. `DRV12345`) |
| **09–20** | `F2-FILLER-A` | `PIC X(12)` | Blank spacing |
| **21–28** | `F2-TRIP-ID` | `PIC X(8)` | **Primary Key** (e.g. `TR000001`) |
| **29–33** | `F2-TRIP-DURATION` | `PIC 9(3)V99` | Duration in minutes (`01500` = 15.00 min) |
| **34–80** | `F2-FILLER-B` | `PIC X(47)` | Unused / Blank spaces |

### Output 1: `FILE3-MASTER-LEDGER` (`LEDGER` DD)
*Permanent record for clean, matched, non-fraudulent rides.*

| Position | Field | Picture | Description |
|:---:|:---|:---|:---|
| **01–08** | `F3-TRIP-ID` | `PIC X(8)` | Trip Identifier |
| **09–16** | `F3-DRIVER-ID` | `PIC X(8)` | Assigned Driver |
| **17–28** | `F3-TIMESTAMP` | `PIC X(12)` | Pickup Timestamp |
| **29–31** | `F3-PICKUP-ZONE` | `PIC 9(3)` | Pickup Zone |
| **32–34** | `F3-DROPOFF-ZONE` | `PIC 9(3)` | Destination Zone |
| **35–40** | `F3-DISTANCE` | `PIC 9(4)V99` | Miles logged |
| **41–46** | `F3-TOTAL-FARE` | `PIC 9(4)V99` | Total collected fare |
| **47–52** | `F3-DRIVER-PAYOUT` | `PIC 9(4)V99` | Calculated 75% driver share |
| **53–58** | `F3-PLATFORM-COMM` | `PIC 9(4)V99` | Calculated 25% platform fee |
| **59–63** | `F3-TRIP-DURATION` | `PIC 9(3)V99` | Trip duration in minutes |
| **64–68** | `F3-IMPLIED-SPEED` | `PIC 9(3)V99` | Computed speed in MPH |
| **69–80** | `F3-FILLER` | `PIC X(12)` | Reserved for expansion |

### Output 2: `FILE4-FRAUD-REPORT` (`FRAUDRPT` DD)
*Flagged transactions separated from financial books.*

| Position | Field | Picture | Description |
|:---:|:---|:---|:---|
| **01–08** | `F4-TRIP-ID` | `PIC X(8)` | Flagged Trip ID |
| **09–16** | `F4-DRIVER-ID` | `PIC X(8)` | Flagged Driver ID |
| **17–28** | `F4-FRAUD-FLAG` | `PIC X(12)` | Reason: `SPEED>85MPH` or `LOW-FARE` |
| **29–34** | `F4-DISTANCE` | `PIC 9(4)V99` | Miles |
| **35–40** | `F4-TOTAL-FARE` | `PIC 9(4)V99` | Fare |
| **41–45** | `F4-TRIP-DURATION` | `PIC 9(3)V99` | Duration |
| **46–50** | `F4-IMPLIED-SPEED` | `PIC 9(3)V99` | Calculated speed |
| **51–80** | `F4-FILLER` | `PIC X(30)` | Spacing |

### Output 3: `FILE5-SUMMARY-RPT` (`SUMRPT` DD)
*Human-readable print report with alignment, headers, totals, and recommendations.*

---

## 3. Core Program Logic & Algorithms

### 3.1 Balance-Line Merge Algorithm
To achieve deterministic $O(N + M)$ performance without loading records into memory:
1. **Prime the Pump:** Read the first record of both files in `1000-INITIALIZE`.
2. **Sentinel Key Mechanism:** When a file reaches `AT END`, its key is moved to `HIGH-VALUES` (`X'FF'`). Any remaining records in the opposite file will compare strictly less than `HIGH-VALUES`, allowing the remaining records to be handled as un-matched records without index out-of-bound errors.
3. **Loop:** `UNTIL FILE1-AT-EOF AND FILE2-AT-EOF`.

```cobol
EVALUATE TRUE
    WHEN WS-F1-CURRENT-KEY < WS-F2-CURRENT-KEY
        ADD 1 TO WS-TOTAL-UNMATCH-F1
        PERFORM 9100-READ-FILE1

    WHEN WS-F2-CURRENT-KEY < WS-F1-CURRENT-KEY
        ADD 1 TO WS-TOTAL-UNMATCH-F2
        PERFORM 9200-READ-FILE2

    WHEN WS-F1-CURRENT-KEY = WS-F2-CURRENT-KEY
        PERFORM 2100-PROCESS-MATCHED-RECORD
        PERFORM 9100-READ-FILE1
        PERFORM 9200-READ-FILE2
END-EVALUATE
```

### 3.2 Financial Calculations
```cobol
COMPUTE WS-DRIVER-PAYOUT ROUNDED = WS-TOTAL-FARE * .75
COMPUTE WS-PLATFORM-COMM ROUNDED = WS-TOTAL-FARE * .25
```
Rounding is applied to avoid truncation bias. Platform revenue and driver payouts are aggregated into `WS-ACCUM-PLATFORM` and `WS-ACCUM-PAYOUT` **only for clean trips**.

### 3.3 Fraud Detection Rules
1. **Implied Speed:**
   $$\text{Speed (MPH)} = \frac{\text{Distance}}{\text{Duration in Mins} / 60} = \frac{\text{Distance} \times 60}{\text{Duration in Mins}}$$
   - If $\text{Duration} = 0$, implied speed is forced to `999.99 MPH` (prevents divide-by-zero abend and flags anomaly).
   - If $\text{Speed} > 85.0\text{ MPH}$, flagged as `SPEED>85MPH`.
2. **Fare Anomaly:**
   - If $\text{Distance} > 10.00\text{ miles}$ AND $\text{Total Fare} < \$5.00$, flagged as `LOW-FARE`.

### 3.4 Predictive Driver Routing (OCCURS Array & Selection Scan)
- In Working-Storage, an internal table tracks all 265 NYC taxi zones:
  ```cobol
  01  WS-ZONE-DEMAND-TABLE.
      05  WS-ZONE-ENTRY OCCURS 265 TIMES INDEXED BY WS-ZONE-IDX.
          10  WS-ZONE-ID-NUM  PIC 9(3).
          10  WS-ZONE-COUNT   PIC 9(9) VALUE ZEROS.
  ```
- Dropoff zone ID is used as direct O(1) index:
  `ADD 1 TO WS-ZONE-COUNT(WS-DROPOFF-ZONE)`.
- At `3000-FINALIZE`, a 3-pass selection scan identifies the Top 3 dropoff locations. The #1 zone receives the static recommendation:
  `"RECOMMENDATION: ALLOCATE IDLE DRIVERS TO THIS HIGH-DEMAND ZONE"`.

---

## 4. How to Compile & Run on Mainframe (z/OS)

### Standalone COBOL JCL: `JCL/RUNCOBOL.jcl`
Submit the job to JES2/JES3 via TSO:
```tso
SUBMIT 'USERID.MAINFRAME.JCL(RUNCOBOL)'
```
The job performs:
1. **`COMPILE` (PGM=IGYCRCTL):** Enterprise COBOL compiler with `OPT(2)`, `RENT`, and `SSRANGE`.
2. **`LKED` (PGM=IEWL):** IBM linkage editor linking `&&LOADSET` with Language Environment `CEE.SCEELKED` into `USERID.COBOL.LOAD(RIDEANLZ)`.
3. **`EXECUTE` (PGM=RIDEANLZ):** Runs the compiled module allocating `TRIPDATA`, `DRVDATA`, `LEDGER`, `FRAUDRPT`, and `SUMRPT`.

### Automated Pipeline JCL: `JCL/MASTERWF.jcl`
To execute the complete production workflow including data sanitization:
```tso
SUBMIT 'USERID.MAINFRAME.JCL(MASTERWF)'
```
- Step 01: DFSORT sorts and deduplicates `FILE1`
- Step 02: REXX QuickSort deduplicates `FILE2`
- Step 03: Evaluates `IF (SORTF1.RC = 0 AND REXXF2.RC = 0)` and triggers `RIDEANLZ`
- Step 04: Evaluates `IF (RUNCOBOL.RC = 0)` and triggers backup archive via `IEBGENER`

---

## 5. Local Testing & Verification (Offline)

You can run the full test suite locally without mainframe access using the included Python simulator:

```powershell
python DataPreprocessing/test_rideanlz.py
```

This simulator parses the exact 80-byte positional text layouts, verifies the Balance-Line merge, runs all financial calculations, tests fraud catches, and validates 20 automated unit assertions across clean and anomalous datasets.
