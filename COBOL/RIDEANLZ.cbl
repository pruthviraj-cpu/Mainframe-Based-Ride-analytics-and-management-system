      *================================================================*
      *  PROGRAM:    RIDEANLZ                                          *
      *  AUTHOR:     Mainframe Ride Analytics System                   *
      *  DATE:       2026-10-20                                        *
      *  PURPOSE:    Assignment 2 - Core Batch Processing Engine       *
      *              Balance-Line Merge | Financial Ledger             *
      *              Fraud Detection   | Predictive Zone Analytics     *
      *                                                                *
      *  INPUTS:                                                       *
      *    FILE1-TRIP-DATA    - Sorted PS file (80-byte, by TRIP-ID)  *
      *    FILE2-DRIVER-DATA  - Sorted PS file (80-byte, by TRIP-ID)  *
      *                                                                *
      *  OUTPUTS:                                                      *
      *    FILE3-MASTER-LEDGER  - Matched, clean trip records         *
      *    FILE4-FRAUD-REPORT   - Flagged suspicious records          *
      *    FILE5-SUMMARY-RPT   - Analytics summary report             *
      *                                                                *
      *  NOTES:                                                        *
      *    - Surge Pricing is handled externally by SURGEPRC REXX     *
      *    - Both input files are pre-sorted ascending by TRIP-ID     *
      *    - Duplicates removed by DEDUPF2 REXX prior to this job     *
      *================================================================*
       IDENTIFICATION DIVISION.
       PROGRAM-ID.    RIDEANLZ.
       AUTHOR.        MAINFRAME-RIDE-ANALYTICS.
       DATE-WRITTEN.  2026-10-20.
       DATE-COMPILED.
       SECURITY.      PROPRIETARY - NYC TAXI ANALYTICS PROJECT.

      *================================================================*
       ENVIRONMENT DIVISION.
      *================================================================*
       CONFIGURATION SECTION.
       SOURCE-COMPUTER.  IBM-ZOS.
       OBJECT-COMPUTER.  IBM-ZOS.

       INPUT-OUTPUT SECTION.
       FILE-CONTROL.

           *------------------------------------------------------------*
           *  INPUT FILE 1: Trip Data (sorted ascending by TRIP-ID)    *
           *------------------------------------------------------------*
           SELECT FILE1-TRIP-DATA
               ASSIGN TO TRIPDATA
               ORGANIZATION IS SEQUENTIAL
               ACCESS MODE  IS SEQUENTIAL
               FILE STATUS  IS WS-FILE1-STATUS.

           *------------------------------------------------------------*
           *  INPUT FILE 2: Driver Data (sorted ascending by TRIP-ID)  *
           *------------------------------------------------------------*
           SELECT FILE2-DRIVER-DATA
               ASSIGN TO DRVDATA
               ORGANIZATION IS SEQUENTIAL
               ACCESS MODE  IS SEQUENTIAL
               FILE STATUS  IS WS-FILE2-STATUS.

           *------------------------------------------------------------*
           *  OUTPUT FILE 3: Master Ledger (clean matched trips)       *
           *------------------------------------------------------------*
           SELECT FILE3-MASTER-LEDGER
               ASSIGN TO LEDGER
               ORGANIZATION IS SEQUENTIAL
               ACCESS MODE  IS SEQUENTIAL
               FILE STATUS  IS WS-FILE3-STATUS.

           *------------------------------------------------------------*
           *  OUTPUT FILE 4: Fraud Report (flagged suspicious records)  *
           *------------------------------------------------------------*
           SELECT FILE4-FRAUD-REPORT
               ASSIGN TO FRAUDRPT
               ORGANIZATION IS SEQUENTIAL
               ACCESS MODE  IS SEQUENTIAL
               FILE STATUS  IS WS-FILE4-STATUS.

           *------------------------------------------------------------*
           *  OUTPUT FILE 5: Summary Analytics Report                  *
           *------------------------------------------------------------*
           SELECT FILE5-SUMMARY-RPT
               ASSIGN TO SUMRPT
               ORGANIZATION IS SEQUENTIAL
               ACCESS MODE  IS SEQUENTIAL
               FILE STATUS  IS WS-FILE5-STATUS.

      *================================================================*
       DATA DIVISION.
      *================================================================*
       FILE SECTION.

      *------------------------------------------------------------*
      *  FD: FILE 1 - Trip Data (80-byte fixed-length PS)         *
      *  Col 01-12:  Timestamp      PIC X(12)                     *
      *  Col 13-20:  TRIP-ID        PIC X(8)  <- PRIMARY KEY      *
      *  Col 21-23:  Pickup Zone    PIC 9(3)                      *
      *  Col 24-26:  Dropoff Zone   PIC 9(3)                      *
      *  Col 27-32:  Distance Miles PIC 9(4)V99                   *
      *  Col 33-38:  Total Fare     PIC 9(4)V99                   *
      *  Col 39-80:  Filler (42 bytes)                            *
      *------------------------------------------------------------*
       FD  FILE1-TRIP-DATA
           LABEL RECORDS ARE STANDARD
           RECORD CONTAINS 80 CHARACTERS
           BLOCK CONTAINS 0 RECORDS.

       01  F1-TRIP-RECORD.
           05  F1-TIMESTAMP        PIC X(12).         *> Col 01-12
           05  F1-TRIP-ID          PIC X(8).          *> Col 13-20
           05  F1-PICKUP-ZONE      PIC 9(3).          *> Col 21-23
           05  F1-DROPOFF-ZONE     PIC 9(3).          *> Col 24-26
           05  F1-DISTANCE         PIC 9(4)V99.       *> Col 27-32
           05  F1-TOTAL-FARE       PIC 9(4)V99.       *> Col 33-38
           05  F1-FILLER           PIC X(42).         *> Col 39-80

      *------------------------------------------------------------*
      *  FD: FILE 2 - Driver Data (80-byte fixed-length PS)       *
      *  Col 01-08:  Driver ID      PIC X(8)                      *
      *  Col 09-20:  Filler (12 bytes)                            *
      *  Col 21-28:  TRIP-ID        PIC X(8)  <- PRIMARY KEY      *
      *  Col 29-33:  Trip Duration  PIC 9(3)V99                   *
      *  Col 34-80:  Filler (47 bytes)                            *
      *------------------------------------------------------------*
       FD  FILE2-DRIVER-DATA
           LABEL RECORDS ARE STANDARD
           RECORD CONTAINS 80 CHARACTERS
           BLOCK CONTAINS 0 RECORDS.

       01  F2-DRIVER-RECORD.
           05  F2-DRIVER-ID        PIC X(8).          *> Col 01-08
           05  F2-FILLER-A         PIC X(12).         *> Col 09-20
           05  F2-TRIP-ID          PIC X(8).          *> Col 21-28
           05  F2-TRIP-DURATION    PIC 9(3)V99.       *> Col 29-33
           05  F2-FILLER-B         PIC X(47).         *> Col 34-80

      *------------------------------------------------------------*
      *  FD: FILE 3 - Master Ledger Output (clean trips)          *
      *------------------------------------------------------------*
       FD  FILE3-MASTER-LEDGER
           LABEL RECORDS ARE STANDARD
           RECORD CONTAINS 80 CHARACTERS
           BLOCK CONTAINS 0 RECORDS.

       01  F3-LEDGER-RECORD.
           05  F3-TRIP-ID          PIC X(8).          *> Col 01-08
           05  F3-DRIVER-ID        PIC X(8).          *> Col 09-16
           05  F3-TIMESTAMP        PIC X(12).         *> Col 17-28
           05  F3-PICKUP-ZONE      PIC 9(3).          *> Col 29-31
           05  F3-DROPOFF-ZONE     PIC 9(3).          *> Col 32-34
           05  F3-DISTANCE         PIC 9(4)V99.       *> Col 35-40
           05  F3-TOTAL-FARE       PIC 9(4)V99.       *> Col 41-46
           05  F3-DRIVER-PAYOUT    PIC 9(4)V99.       *> Col 47-52
           05  F3-PLATFORM-COMM    PIC 9(4)V99.       *> Col 53-58
           05  F3-TRIP-DURATION    PIC 9(3)V99.       *> Col 59-63
           05  F3-IMPLIED-SPEED    PIC 9(3)V99.       *> Col 64-68
           05  F3-FILLER           PIC X(12).         *> Col 69-80

      *------------------------------------------------------------*
      *  FD: FILE 4 - Fraud Report Output                         *
      *------------------------------------------------------------*
       FD  FILE4-FRAUD-REPORT
           LABEL RECORDS ARE STANDARD
           RECORD CONTAINS 80 CHARACTERS
           BLOCK CONTAINS 0 RECORDS.

       01  F4-FRAUD-RECORD.
           05  F4-TRIP-ID          PIC X(8).          *> Col 01-08
           05  F4-DRIVER-ID        PIC X(8).          *> Col 09-16
           05  F4-FRAUD-FLAG       PIC X(12).         *> Col 17-28 (SPEED/FARE)
           05  F4-DISTANCE         PIC 9(4)V99.       *> Col 29-34
           05  F4-TOTAL-FARE       PIC 9(4)V99.       *> Col 35-40
           05  F4-TRIP-DURATION    PIC 9(3)V99.       *> Col 41-45
           05  F4-IMPLIED-SPEED    PIC 9(3)V99.       *> Col 46-50
           05  F4-FILLER           PIC X(30).         *> Col 51-80

      *------------------------------------------------------------*
      *  FD: FILE 5 - Summary Report Output (print-format lines)  *
      *------------------------------------------------------------*
       FD  FILE5-SUMMARY-RPT
           LABEL RECORDS ARE STANDARD
           RECORD CONTAINS 80 CHARACTERS
           BLOCK CONTAINS 0 RECORDS.

       01  F5-SUMMARY-LINE         PIC X(80).

      *================================================================*
       WORKING-STORAGE SECTION.
      *================================================================*

      *------------------------------------------------------------*
      *  FILE STATUS CODES                                          *
      *------------------------------------------------------------*
       01  WS-FILE-STATUS-CODES.
           05  WS-FILE1-STATUS     PIC XX  VALUE SPACES.
           05  WS-FILE2-STATUS     PIC XX  VALUE SPACES.
           05  WS-FILE3-STATUS     PIC XX  VALUE SPACES.
           05  WS-FILE4-STATUS     PIC XX  VALUE SPACES.
           05  WS-FILE5-STATUS     PIC XX  VALUE SPACES.

      *------------------------------------------------------------*
      *  END-OF-FILE FLAGS (Balance-Line control flags)            *
      *------------------------------------------------------------*
       01  WS-EOF-FLAGS.
           05  WS-FILE1-EOF        PIC X   VALUE 'N'.
               88  FILE1-AT-EOF               VALUE 'Y'.
               88  FILE1-NOT-EOF              VALUE 'N'.
           05  WS-FILE2-EOF        PIC X   VALUE 'N'.
               88  FILE2-AT-EOF               VALUE 'Y'.
               88  FILE2-NOT-EOF              VALUE 'N'.

      *------------------------------------------------------------*
      *  HIGH-VALUE SENTINEL FOR BALANCE-LINE ALGORITHM           *
      *  When a file reaches EOF, its key is set to HIGH-VALUES   *
      *  so the other file's key will always be LESS-THAN         *
      *------------------------------------------------------------*
       01  WS-SENTINEL-KEYS.
           05  WS-F1-CURRENT-KEY   PIC X(8)  VALUE SPACES.
           05  WS-F2-CURRENT-KEY   PIC X(8)  VALUE SPACES.

      *------------------------------------------------------------*
      *  WORKING COPIES OF MATCHED RECORD FIELDS                   *
      *------------------------------------------------------------*
       01  WS-MATCH-FIELDS.
           05  WS-TRIP-ID          PIC X(8)  VALUE SPACES.
           05  WS-DRIVER-ID        PIC X(8)  VALUE SPACES.
           05  WS-TIMESTAMP        PIC X(12) VALUE SPACES.
           05  WS-PICKUP-ZONE      PIC 9(3)  VALUE ZEROS.
           05  WS-DROPOFF-ZONE     PIC 9(3)  VALUE ZEROS.
           05  WS-DISTANCE         PIC 9(4)V99 VALUE ZEROS.
           05  WS-TOTAL-FARE       PIC 9(4)V99 VALUE ZEROS.
           05  WS-TRIP-DURATION    PIC 9(3)V99 VALUE ZEROS.

      *------------------------------------------------------------*
      *  FINANCIAL CALCULATION FIELDS                              *
      *------------------------------------------------------------*
       01  WS-FINANCIAL-FIELDS.
           05  WS-DRIVER-PAYOUT    PIC 9(6)V99 VALUE ZEROS.
           05  WS-PLATFORM-COMM    PIC 9(6)V99 VALUE ZEROS.
           05  WS-IMPLIED-SPEED    PIC 9(5)V99 VALUE ZEROS.
           05  WS-SPEED-MINUTES    PIC 9(5)V99 VALUE ZEROS.

      *------------------------------------------------------------*
      *  DAILY ACCUMULATORS (Financial Ledger Totals)             *
      *------------------------------------------------------------*
       01  WS-DAILY-TOTALS.
           05  WS-TOTAL-TRIPS-PROC PIC 9(9)   VALUE ZEROS.
           05  WS-TOTAL-FRAUD-TRIP PIC 9(9)   VALUE ZEROS.
           05  WS-TOTAL-UNMATCH-F1 PIC 9(9)   VALUE ZEROS.
           05  WS-TOTAL-UNMATCH-F2 PIC 9(9)   VALUE ZEROS.
           05  WS-ACCUM-PLATFORM   PIC 9(10)V99 VALUE ZEROS.
           05  WS-ACCUM-PAYOUT     PIC 9(10)V99 VALUE ZEROS.

      *------------------------------------------------------------*
      *  FRAUD DETECTION FLAGS                                     *
      *------------------------------------------------------------*
       01  WS-FRAUD-FIELDS.
           05  WS-FRAUD-DETECTED   PIC X   VALUE 'N'.
               88  FRAUD-FOUND                VALUE 'Y'.
               88  FRAUD-CLEAR                VALUE 'N'.
           05  WS-FRAUD-REASON     PIC X(12) VALUE SPACES.

      *------------------------------------------------------------*
      *  CONSTANTS                                                  *
      *------------------------------------------------------------*
       01  WS-CONSTANTS.
           05  WS-PAYOUT-RATE      PIC V99  VALUE .75.
           05  WS-COMM-RATE        PIC V99  VALUE .25.
           05  WS-SPEED-LIMIT      PIC 9(3) VALUE 085.
           05  WS-MIN-FARE-MILES   PIC 9(2) VALUE 10.
           05  WS-MIN-FARE-AMOUNT  PIC 9(3)V99 VALUE 5.00.
           05  WS-MAX-ZONE-ID      PIC 9(3) VALUE 265.
           05  WS-TOP-N            PIC 9(2) VALUE 03.
           05  WS-MINS-PER-HOUR    PIC 9(2) VALUE 60.

      *------------------------------------------------------------*
      *  ZONE DEMAND TABLE (Predictive Analytics Array)            *
      *  Tracks trip count for each of the 265 Dropoff Zones      *
      *  Index maps directly: WS-ZONE-TABLE(zone-id) = count      *
      *------------------------------------------------------------*
       01  WS-ZONE-DEMAND-TABLE.
           05  WS-ZONE-ENTRY       OCCURS 265 TIMES
                                   INDEXED BY WS-ZONE-IDX.
               10  WS-ZONE-ID-NUM  PIC 9(3).
               10  WS-ZONE-COUNT   PIC 9(9) VALUE ZEROS.

      *------------------------------------------------------------*
      *  TOP-3 ZONE RANKING WORK AREA (Bubble Sort scratch)       *
      *------------------------------------------------------------*
       01  WS-TOP3-TABLE.
           05  WS-TOP3-ENTRY       OCCURS 3 TIMES
                                   INDEXED BY WS-TOP3-IDX.
               10  WS-TOP3-ZONE    PIC 9(3)   VALUE ZEROS.
               10  WS-TOP3-COUNT   PIC 9(9)   VALUE ZEROS.

       01  WS-SORT-WORK-FIELDS.
           05  WS-SORT-IDX         PIC 9(3)   VALUE ZEROS.
           05  WS-INNER-IDX        PIC 9(3)   VALUE ZEROS.
           05  WS-TEMP-ZONE        PIC 9(3)   VALUE ZEROS.
           05  WS-TEMP-COUNT       PIC 9(9)   VALUE ZEROS.
           05  WS-CANDIDATE-COUNT  PIC 9(9)   VALUE ZEROS.
           05  WS-CANDIDATE-ZONE   PIC 9(3)   VALUE ZEROS.

      *------------------------------------------------------------*
      *  REPORT FORMATTING FIELDS                                  *
      *------------------------------------------------------------*
       01  WS-REPORT-FIELDS.
           05  WS-RPT-TOTAL-TRIPS  PIC Z,ZZZ,ZZ9.
           05  WS-RPT-FRAUD-TRIPS  PIC Z,ZZZ,ZZ9.
           05  WS-RPT-PLATFORM-REV PIC $$,$$9.99.
           05  WS-RPT-ZONE-NUM     PIC ZZ9.
           05  WS-RPT-ZONE-COUNT   PIC Z,ZZZ,ZZ9.
           05  WS-RPT-LINE-RANK    PIC 9.

       01  WS-DIVIDER-LINE         PIC X(80)
               VALUE '================================================================'.

      *------------------------------------------------------------*
      *  REPORT LINE LAYOUT WORK AREAS                             *
      *------------------------------------------------------------*
       01  WS-RPT-HEADER-LINE.
           05  FILLER              PIC X(80)
               VALUE '    NYC TAXI RIDE ANALYTICS SYSTEM - BATCH SUMMARY REPORT     '.

       01  WS-RPT-LINE1.
           05  FILLER              PIC X(30)
               VALUE 'Total Trips Processed:          '.
           05  WS-OUT-TOTAL-TRIPS  PIC Z,ZZZ,ZZ9.
           05  FILLER              PIC X(41) VALUE SPACES.

       01  WS-RPT-LINE2.
           05  FILLER              PIC X(30)
               VALUE 'Total Fraud Trips Caught:       '.
           05  WS-OUT-FRAUD-TRIPS  PIC Z,ZZZ,ZZ9.
           05  FILLER              PIC X(41) VALUE SPACES.

       01  WS-RPT-LINE3.
           05  FILLER              PIC X(30)
               VALUE 'Total Platform Revenue:         '.
           05  WS-OUT-PLATFORM-REV PIC $$,$$9.99.
           05  FILLER              PIC X(40) VALUE SPACES.

       01  WS-RPT-ZONE-HDR.
           05  FILLER              PIC X(80)
               VALUE '  RANK  DROPOFF ZONE ID    TRIP COUNT   NOTES'.

       01  WS-RPT-ZONE-LINE.
           05  FILLER              PIC X(2)  VALUE SPACES.
           05  WS-OUT-RANK         PIC 9.
           05  FILLER              PIC X(4)  VALUE SPACES.
           05  WS-OUT-ZONE-ID      PIC ZZ9.
           05  FILLER              PIC X(11) VALUE SPACES.
           05  WS-OUT-ZONE-COUNT   PIC Z,ZZZ,ZZ9.
           05  FILLER              PIC X(3)  VALUE SPACES.
           05  WS-OUT-ZONE-NOTE    PIC X(45) VALUE SPACES.

       01  WS-RPT-UNMATCHED-LINE.
           05  FILLER              PIC X(30)
               VALUE 'Unmatched FILE1 (no driver):    '.
           05  WS-OUT-UNMATCH-F1   PIC Z,ZZZ,ZZ9.
           05  FILLER              PIC X(41) VALUE SPACES.

       01  WS-RPT-UNMATCHED-LINE2.
           05  FILLER              PIC X(30)
               VALUE 'Unmatched FILE2 (no trip):      '.
           05  WS-OUT-UNMATCH-F2   PIC Z,ZZZ,ZZ9.
           05  FILLER              PIC X(41) VALUE SPACES.

      *================================================================*
       PROCEDURE DIVISION.
      *================================================================*

      *----------------------------------------------------------------*
      *  MAIN CONTROL - TOP LEVEL ROUTINE                             *
      *----------------------------------------------------------------*
       0000-MAIN-CONTROL.
           PERFORM 1000-INITIALIZE
           PERFORM 2000-BALANCE-LINE-MERGE
               UNTIL FILE1-AT-EOF AND FILE2-AT-EOF
           PERFORM 3000-FINALIZE
           STOP RUN.

      *================================================================*
      *  1000-INITIALIZE                                              *
      *  Open all files, prime the reads for Balance-Line,           *
      *  and initialize the Zone Demand Table zone IDs               *
      *================================================================*
       1000-INITIALIZE.
           *------------------------------------------------------------*
           *  Open input files                                          *
           *------------------------------------------------------------*
           OPEN INPUT  FILE1-TRIP-DATA
           IF WS-FILE1-STATUS NOT = '00'
               DISPLAY 'RIDEANLZ: FATAL - Could not OPEN FILE1-TRIP-DATA'
                       ' Status=' WS-FILE1-STATUS
               MOVE 16 TO RETURN-CODE
               STOP RUN
           END-IF

           OPEN INPUT  FILE2-DRIVER-DATA
           IF WS-FILE2-STATUS NOT = '00'
               DISPLAY 'RIDEANLZ: FATAL - Could not OPEN FILE2-DRIVER-DATA'
                       ' Status=' WS-FILE2-STATUS
               MOVE 16 TO RETURN-CODE
               STOP RUN
           END-IF

           *------------------------------------------------------------*
           *  Open output files                                         *
           *------------------------------------------------------------*
           OPEN OUTPUT FILE3-MASTER-LEDGER
           IF WS-FILE3-STATUS NOT = '00'
               DISPLAY 'RIDEANLZ: FATAL - Could not OPEN FILE3-MASTER-LEDGER'
                       ' Status=' WS-FILE3-STATUS
               MOVE 16 TO RETURN-CODE
               STOP RUN
           END-IF

           OPEN OUTPUT FILE4-FRAUD-REPORT
           IF WS-FILE4-STATUS NOT = '00'
               DISPLAY 'RIDEANLZ: FATAL - Could not OPEN FILE4-FRAUD-REPORT'
                       ' Status=' WS-FILE4-STATUS
               MOVE 16 TO RETURN-CODE
               STOP RUN
           END-IF

           OPEN OUTPUT FILE5-SUMMARY-RPT
           IF WS-FILE5-STATUS NOT = '00'
               DISPLAY 'RIDEANLZ: FATAL - Could not OPEN FILE5-SUMMARY-RPT'
                       ' Status=' WS-FILE5-STATUS
               MOVE 16 TO RETURN-CODE
               STOP RUN
           END-IF

           *------------------------------------------------------------*
           *  Initialize Zone Demand Table - stamp each entry's Zone ID *
           *  so zone 1 -> index 1, zone 2 -> index 2 ... zone 265     *
           *------------------------------------------------------------*
           PERFORM VARYING WS-ZONE-IDX FROM 1 BY 1
                   UNTIL WS-ZONE-IDX > WS-MAX-ZONE-ID
               MOVE WS-ZONE-IDX TO WS-ZONE-ID-NUM(WS-ZONE-IDX)
               MOVE ZEROS       TO WS-ZONE-COUNT(WS-ZONE-IDX)
           END-PERFORM

           *------------------------------------------------------------*
           *  Prime the pumps: read first record from each input file   *
           *  This is the critical first step of the Balance-Line algo  *
           *------------------------------------------------------------*
           PERFORM 9100-READ-FILE1
           PERFORM 9200-READ-FILE2

           DISPLAY 'RIDEANLZ: Initialization complete. Processing begins.'.

      *================================================================*
      *  2000-BALANCE-LINE-MERGE                                       *
      *  The core matching engine. Compare current keys from both      *
      *  files and route accordingly:                                  *
      *    F1 < F2  -> Unmatched FILE1 record (orphan trip, no driver) *
      *    F2 < F1  -> Unmatched FILE2 record (orphan driver, no trip) *
      *    F1 = F2  -> MATCH! Process the merged record                *
      *================================================================*
       2000-BALANCE-LINE-MERGE.
           EVALUATE TRUE
           *------------------------------------------------------------*
           *  CASE 1: FILE1 key < FILE2 key                            *
           *  Trip record exists but has no matching driver record     *
           *------------------------------------------------------------*
               WHEN WS-F1-CURRENT-KEY < WS-F2-CURRENT-KEY
                   ADD 1 TO WS-TOTAL-UNMATCH-F1
                   DISPLAY 'RIDEANLZ: UNMATCHED F1 Trip-ID='
                           WS-F1-CURRENT-KEY ' (no driver record)'
                   PERFORM 9100-READ-FILE1

           *------------------------------------------------------------*
           *  CASE 2: FILE2 key < FILE1 key                            *
           *  Driver record exists but has no matching trip record     *
           *------------------------------------------------------------*
               WHEN WS-F2-CURRENT-KEY < WS-F1-CURRENT-KEY
                   ADD 1 TO WS-TOTAL-UNMATCH-F2
                   DISPLAY 'RIDEANLZ: UNMATCHED F2 Trip-ID='
                           WS-F2-CURRENT-KEY ' (no trip record)'
                   PERFORM 9200-READ-FILE2

           *------------------------------------------------------------*
           *  CASE 3: FILE1 key = FILE2 key -> MATCH                  *
           *  Both records have the same TRIP-ID: process the merge   *
           *------------------------------------------------------------*
               WHEN WS-F1-CURRENT-KEY = WS-F2-CURRENT-KEY
                   PERFORM 2100-PROCESS-MATCHED-RECORD
                   PERFORM 9100-READ-FILE1
                   PERFORM 9200-READ-FILE2

           END-EVALUATE.

      *================================================================*
      *  2100-PROCESS-MATCHED-RECORD                                   *
      *  For a matched pair: compute financials, check fraud, route   *
      *  the record to the correct output file                        *
      *================================================================*
       2100-PROCESS-MATCHED-RECORD.
           *------------------------------------------------------------*
           *  Capture fields from both files into working storage      *
           *------------------------------------------------------------*
           MOVE F1-TRIP-ID      TO WS-TRIP-ID
           MOVE F2-DRIVER-ID    TO WS-DRIVER-ID
           MOVE F1-TIMESTAMP    TO WS-TIMESTAMP
           MOVE F1-PICKUP-ZONE  TO WS-PICKUP-ZONE
           MOVE F1-DROPOFF-ZONE TO WS-DROPOFF-ZONE
           MOVE F1-DISTANCE     TO WS-DISTANCE
           MOVE F1-TOTAL-FARE   TO WS-TOTAL-FARE
           MOVE F2-TRIP-DURATION TO WS-TRIP-DURATION

           *------------------------------------------------------------*
           *  FINANCIAL LEDGER: Calculate Driver Payout & Platform Fee  *
           *  Driver Payout   = Total Fare * 75%                       *
           *  Platform Comm   = Total Fare * 25%                       *
           *------------------------------------------------------------*
           COMPUTE WS-DRIVER-PAYOUT ROUNDED =
                   WS-TOTAL-FARE * WS-PAYOUT-RATE
           COMPUTE WS-PLATFORM-COMM ROUNDED =
                   WS-TOTAL-FARE * WS-COMM-RATE

           *------------------------------------------------------------*
           *  COMPUTE IMPLIED SPEED for fraud check                    *
           *  Speed (MPH) = Distance / (Duration in Hours)             *
           *              = Distance / (Duration_mins / 60)            *
           *  Guard against zero duration to prevent divide-by-zero   *
           *------------------------------------------------------------*
           IF WS-TRIP-DURATION > ZEROS
               COMPUTE WS-SPEED-MINUTES ROUNDED =
                       WS-DISTANCE * WS-MINS-PER-HOUR
               COMPUTE WS-IMPLIED-SPEED ROUNDED =
                       WS-SPEED-MINUTES / WS-TRIP-DURATION
           ELSE
               MOVE 999.99 TO WS-IMPLIED-SPEED
           END-IF

           *------------------------------------------------------------*
           *  FRAUD DETECTION: Evaluate fraud rules                    *
           *  Rule 1: Speed > 85 MPH is physically implausible        *
           *  Rule 2: Long distance (>10mi) but suspiciously cheap fare*
           *------------------------------------------------------------*
           MOVE 'N'      TO WS-FRAUD-DETECTED
           MOVE SPACES   TO WS-FRAUD-REASON

           EVALUATE TRUE
               WHEN WS-IMPLIED-SPEED > WS-SPEED-LIMIT
                   MOVE 'Y'          TO WS-FRAUD-DETECTED
                   MOVE 'SPEED>85MPH' TO WS-FRAUD-REASON

               WHEN WS-DISTANCE > WS-MIN-FARE-MILES
                        AND WS-TOTAL-FARE < WS-MIN-FARE-AMOUNT
                   MOVE 'Y'          TO WS-FRAUD-DETECTED
                   MOVE 'LOW-FARE   ' TO WS-FRAUD-REASON
           END-EVALUATE

           *------------------------------------------------------------*
           *  ROUTE TO APPROPRIATE OUTPUT FILE                         *
           *------------------------------------------------------------*
           IF FRAUD-FOUND
               PERFORM 2200-WRITE-FRAUD-RECORD
               ADD 1 TO WS-TOTAL-FRAUD-TRIP
           ELSE
               PERFORM 2300-WRITE-LEDGER-RECORD
               ADD 1 TO WS-TOTAL-TRIPS-PROC
               *----------------------------------------------------------*
               *  Accumulate financials only for clean (non-fraud) trips  *
               *----------------------------------------------------------*
               ADD WS-PLATFORM-COMM TO WS-ACCUM-PLATFORM
               ADD WS-DRIVER-PAYOUT TO WS-ACCUM-PAYOUT
               *----------------------------------------------------------*
               *  PREDICTIVE ANALYTICS: Increment the zone demand tally   *
               *  Use Dropoff Zone ID as direct table index (1-265)       *
               *----------------------------------------------------------*
               IF WS-DROPOFF-ZONE >= 1
                       AND WS-DROPOFF-ZONE <= WS-MAX-ZONE-ID
                   ADD 1 TO WS-ZONE-COUNT(WS-DROPOFF-ZONE)
               END-IF
           END-IF.

      *================================================================*
      *  2200-WRITE-FRAUD-RECORD                                       *
      *  Populate the FILE4 fraud record layout and write it          *
      *================================================================*
       2200-WRITE-FRAUD-RECORD.
           MOVE WS-TRIP-ID       TO F4-TRIP-ID
           MOVE WS-DRIVER-ID     TO F4-DRIVER-ID
           MOVE WS-FRAUD-REASON  TO F4-FRAUD-FLAG
           MOVE WS-DISTANCE      TO F4-DISTANCE
           MOVE WS-TOTAL-FARE    TO F4-TOTAL-FARE
           MOVE WS-TRIP-DURATION TO F4-TRIP-DURATION
           MOVE WS-IMPLIED-SPEED TO F4-IMPLIED-SPEED
           MOVE SPACES           TO F4-FILLER

           WRITE F4-FRAUD-RECORD
           IF WS-FILE4-STATUS NOT = '00'
               DISPLAY 'RIDEANLZ: ERROR writing FILE4 fraud record.'
                       ' Status=' WS-FILE4-STATUS
                       ' Trip-ID=' WS-TRIP-ID
           END-IF.

      *================================================================*
      *  2300-WRITE-LEDGER-RECORD                                      *
      *  Populate the FILE3 master ledger layout and write it         *
      *================================================================*
       2300-WRITE-LEDGER-RECORD.
           MOVE WS-TRIP-ID       TO F3-TRIP-ID
           MOVE WS-DRIVER-ID     TO F3-DRIVER-ID
           MOVE WS-TIMESTAMP     TO F3-TIMESTAMP
           MOVE WS-PICKUP-ZONE   TO F3-PICKUP-ZONE
           MOVE WS-DROPOFF-ZONE  TO F3-DROPOFF-ZONE
           MOVE WS-DISTANCE      TO F3-DISTANCE
           MOVE WS-TOTAL-FARE    TO F3-TOTAL-FARE
           MOVE WS-DRIVER-PAYOUT TO F3-DRIVER-PAYOUT
           MOVE WS-PLATFORM-COMM TO F3-PLATFORM-COMM
           MOVE WS-TRIP-DURATION TO F3-TRIP-DURATION
           MOVE WS-IMPLIED-SPEED TO F3-IMPLIED-SPEED
           MOVE SPACES           TO F3-FILLER

           WRITE F3-LEDGER-RECORD
           IF WS-FILE3-STATUS NOT = '00'
               DISPLAY 'RIDEANLZ: ERROR writing FILE3 ledger record.'
                       ' Status=' WS-FILE3-STATUS
                       ' Trip-ID=' WS-TRIP-ID
           END-IF.

      *================================================================*
      *  3000-FINALIZE                                                  *
      *  After EOF: sort zones, produce summary report, close files   *
      *================================================================*
       3000-FINALIZE.
           DISPLAY 'RIDEANLZ: EOF reached. Building analytics summary.'

           *------------------------------------------------------------*
           *  Sort the Zone Demand Table to find Top 3 Dropoff Zones   *
           *  Algorithm: 3 passes of linear scan (Selection Sort style) *
           *  On each pass, find the MAX from un-selected zones,       *
           *  save it to WS-TOP3-TABLE, then zero it out to avoid      *
           *  selecting it again in the next pass                       *
           *------------------------------------------------------------*
           PERFORM VARYING WS-TOP3-IDX FROM 1 BY 1
                   UNTIL WS-TOP3-IDX > WS-TOP-N

               MOVE ZEROS TO WS-CANDIDATE-COUNT
               MOVE ZEROS TO WS-CANDIDATE-ZONE

               *----------------------------------------------------------*
               *  Linear scan through all 265 zones to find current max  *
               *----------------------------------------------------------*
               PERFORM VARYING WS-ZONE-IDX FROM 1 BY 1
                       UNTIL WS-ZONE-IDX > WS-MAX-ZONE-ID

                   IF WS-ZONE-COUNT(WS-ZONE-IDX) > WS-CANDIDATE-COUNT
                       MOVE WS-ZONE-COUNT(WS-ZONE-IDX)
                                            TO WS-CANDIDATE-COUNT
                       MOVE WS-ZONE-ID-NUM(WS-ZONE-IDX)
                                            TO WS-CANDIDATE-ZONE
                   END-IF

               END-PERFORM

               *----------------------------------------------------------*
               *  Store this pass's winner into the Top-3 table          *
               *----------------------------------------------------------*
               MOVE WS-CANDIDATE-ZONE  TO WS-TOP3-ZONE(WS-TOP3-IDX)
               MOVE WS-CANDIDATE-COUNT TO WS-TOP3-COUNT(WS-TOP3-IDX)

               *----------------------------------------------------------*
               *  Zero out winner so next pass finds the next-highest    *
               *  Use the zone ID (= index) to locate it directly        *
               *----------------------------------------------------------*
               IF WS-CANDIDATE-ZONE >= 1
                       AND WS-CANDIDATE-ZONE <= WS-MAX-ZONE-ID
                   MOVE ZEROS TO WS-ZONE-COUNT(WS-CANDIDATE-ZONE)
               END-IF

           END-PERFORM

           *------------------------------------------------------------*
           *  Write the formatted Summary Report to FILE5              *
           *------------------------------------------------------------*
           PERFORM 3100-WRITE-SUMMARY-REPORT

           *------------------------------------------------------------*
           *  Close all files cleanly                                   *
           *------------------------------------------------------------*
           CLOSE FILE1-TRIP-DATA
           CLOSE FILE2-DRIVER-DATA
           CLOSE FILE3-MASTER-LEDGER
           CLOSE FILE4-FRAUD-REPORT
           CLOSE FILE5-SUMMARY-RPT

           DISPLAY 'RIDEANLZ: Processing complete.'
           DISPLAY 'RIDEANLZ:   Clean Trips Written  = '
                   WS-TOTAL-TRIPS-PROC
           DISPLAY 'RIDEANLZ:   Fraud Trips Flagged  = '
                   WS-TOTAL-FRAUD-TRIP
           DISPLAY 'RIDEANLZ:   Unmatched FILE1 Recs = '
                   WS-TOTAL-UNMATCH-F1
           DISPLAY 'RIDEANLZ:   Unmatched FILE2 Recs = '
                   WS-TOTAL-UNMATCH-F2

           MOVE 0 TO RETURN-CODE.

      *================================================================*
      *  3100-WRITE-SUMMARY-REPORT                                     *
      *  Format and emit all summary report lines to FILE5            *
      *================================================================*
       3100-WRITE-SUMMARY-REPORT.

           *------------------------------------------------------------*
           *  --- REPORT HEADER ---                                     *
           *------------------------------------------------------------*
           WRITE F5-SUMMARY-LINE FROM WS-DIVIDER-LINE
           WRITE F5-SUMMARY-LINE FROM WS-RPT-HEADER-LINE
           WRITE F5-SUMMARY-LINE FROM WS-DIVIDER-LINE

           *------------------------------------------------------------*
           *  --- TOTALS SECTION ---                                    *
           *------------------------------------------------------------*
           MOVE WS-TOTAL-TRIPS-PROC TO WS-OUT-TOTAL-TRIPS
           WRITE F5-SUMMARY-LINE FROM WS-RPT-LINE1

           MOVE WS-TOTAL-FRAUD-TRIP TO WS-OUT-FRAUD-TRIPS
           WRITE F5-SUMMARY-LINE FROM WS-RPT-LINE2

           MOVE WS-ACCUM-PLATFORM   TO WS-OUT-PLATFORM-REV
           WRITE F5-SUMMARY-LINE FROM WS-RPT-LINE3

           MOVE SPACES TO F5-SUMMARY-LINE
           WRITE F5-SUMMARY-LINE

           MOVE WS-TOTAL-UNMATCH-F1 TO WS-OUT-UNMATCH-F1
           WRITE F5-SUMMARY-LINE FROM WS-RPT-UNMATCHED-LINE

           MOVE WS-TOTAL-UNMATCH-F2 TO WS-OUT-UNMATCH-F2
           WRITE F5-SUMMARY-LINE FROM WS-RPT-UNMATCHED-LINE2

           *------------------------------------------------------------*
           *  --- TOP-3 POPULAR DROPOFF ZONES SECTION ---              *
           *------------------------------------------------------------*
           MOVE SPACES TO F5-SUMMARY-LINE
           WRITE F5-SUMMARY-LINE
           WRITE F5-SUMMARY-LINE FROM WS-DIVIDER-LINE

           MOVE SPACES TO F5-SUMMARY-LINE
           MOVE '  TOP 3 MOST POPULAR DROPOFF ZONES (DRIVER ROUTING)'
               TO F5-SUMMARY-LINE
           WRITE F5-SUMMARY-LINE

           WRITE F5-SUMMARY-LINE FROM WS-DIVIDER-LINE
           WRITE F5-SUMMARY-LINE FROM WS-RPT-ZONE-HDR

           MOVE SPACES TO F5-SUMMARY-LINE
           WRITE F5-SUMMARY-LINE

           *------------------------------------------------------------*
           *  Write each Top-3 zone line with rank and trip count      *
           *  Rank 1 gets the special driver allocation recommendation  *
           *------------------------------------------------------------*
           PERFORM VARYING WS-TOP3-IDX FROM 1 BY 1
                   UNTIL WS-TOP3-IDX > WS-TOP-N

               MOVE WS-TOP3-IDX             TO WS-OUT-RANK
               MOVE WS-TOP3-ZONE(WS-TOP3-IDX) TO WS-OUT-ZONE-ID
               MOVE WS-TOP3-COUNT(WS-TOP3-IDX) TO WS-OUT-ZONE-COUNT
               MOVE SPACES                  TO WS-OUT-ZONE-NOTE

               IF WS-TOP3-IDX = 1
                   MOVE 'RECOMMENDATION: ALLOCATE IDLE DRIVERS TO'
                       & ' THIS HIGH-DEMAND ZONE'
                       TO WS-OUT-ZONE-NOTE
               END-IF

               WRITE F5-SUMMARY-LINE FROM WS-RPT-ZONE-LINE

           END-PERFORM

           *------------------------------------------------------------*
           *  --- FOOTER ---                                            *
           *------------------------------------------------------------*
           MOVE SPACES TO F5-SUMMARY-LINE
           WRITE F5-SUMMARY-LINE
           WRITE F5-SUMMARY-LINE FROM WS-DIVIDER-LINE

           MOVE '  *** END OF REPORT - RIDEANLZ BATCH COMPLETE ***'
               TO F5-SUMMARY-LINE
           WRITE F5-SUMMARY-LINE

           WRITE F5-SUMMARY-LINE FROM WS-DIVIDER-LINE.

      *================================================================*
      *  I/O SUBROUTINES                                               *
      *================================================================*

      *----------------------------------------------------------------*
      *  9100-READ-FILE1                                               *
      *  Read next record from FILE1. On EOF, set sentinel to         *
      *  HIGH-VALUES so all FILE2 keys will compare LESS THAN it      *
      *----------------------------------------------------------------*
       9100-READ-FILE1.
           READ FILE1-TRIP-DATA INTO F1-TRIP-RECORD
               AT END
                   SET FILE1-AT-EOF         TO TRUE
                   MOVE HIGH-VALUES         TO WS-F1-CURRENT-KEY
               NOT AT END
                   MOVE F1-TRIP-ID          TO WS-F1-CURRENT-KEY
           END-READ

           IF WS-FILE1-STATUS NOT = '00'
                   AND WS-FILE1-STATUS NOT = '10'
               DISPLAY 'RIDEANLZ: ERROR reading FILE1.'
                       ' Status=' WS-FILE1-STATUS
           END-IF.

      *----------------------------------------------------------------*
      *  9200-READ-FILE2                                               *
      *  Read next record from FILE2. On EOF, set sentinel to         *
      *  HIGH-VALUES so all FILE1 keys will compare LESS THAN it      *
      *----------------------------------------------------------------*
       9200-READ-FILE2.
           READ FILE2-DRIVER-DATA INTO F2-DRIVER-RECORD
               AT END
                   SET FILE2-AT-EOF         TO TRUE
                   MOVE HIGH-VALUES         TO WS-F2-CURRENT-KEY
               NOT AT END
                   MOVE F2-TRIP-ID          TO WS-F2-CURRENT-KEY
           END-READ

           IF WS-FILE2-STATUS NOT = '00'
                   AND WS-FILE2-STATUS NOT = '10'
               DISPLAY 'RIDEANLZ: ERROR reading FILE2.'
                       ' Status=' WS-FILE2-STATUS
           END-IF.

      *================================================================*
      *  END OF PROGRAM - RIDEANLZ                                     *
      *================================================================*
