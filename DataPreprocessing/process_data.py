"""
Mainframe Ride Analytics - Batch Processing Engine & File Generator
Simulates the exact execution of:
  - Step 1: JCL SORT (SORTF1.jcl) - Deduplication & Sorting of FILE1_TRIP_DATA.ps
  - Step 2: REXX Deduplication (DEDUPF2.rexx) - Deduplication & Sorting of FILE2_DRIVER_DATA.ps
  - Step 3: COBOL Balance-Line Merge & Fraud Analytics (RIDEANLZ.cbl)
  - Step 4: REXX Dynamic Surge Pricing (SURGEPRC.rexx)

Outputs the standard 80-byte sequential datasets (.ps) and reports directly to disk.
"""

import os
from decimal import Decimal, ROUND_HALF_UP

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

FILE1_RAW = os.path.join(BASE_DIR, "FILE1_TRIP_DATA.ps")
FILE2_RAW = os.path.join(BASE_DIR, "FILE2_DRIVER_DATA.ps")

FILE1_SORTED = os.path.join(BASE_DIR, "FILE1_SORTED.ps")
FILE2_SORTED = os.path.join(BASE_DIR, "FILE2_SORTED.ps")
FILE3_LEDGER = os.path.join(BASE_DIR, "FILE3_MASTER_LEDGER.ps")
FILE4_FRAUD = os.path.join(BASE_DIR, "FILE4_FRAUD_REPORT.ps")
FILE5_SUMMARY = os.path.join(BASE_DIR, "FILE5_SUMMARY_RPT.txt")
FILE_SURGE = os.path.join(BASE_DIR, "RIDE_SURGE_REPORT.txt")
FILE_LOGS = os.path.join(BASE_DIR, "MAINFRAME_BATCH.log")


def run_batch_pipeline():
    logs = []
    def log(msg):
        print(msg)
        logs.append(msg)

    log("=" * 70)
    log("JOB04821 $HASP373 MASTERWF STARTED - CLASS A - IBM z/OS BATCH ENGINE")
    log("=" * 70)

    # -------------------------------------------------------------------------
    # STEP 00: IEFBR14 Scratch & Clean
    # -------------------------------------------------------------------------
    log("\n[STEP 00] //CLEANUP EXEC PGM=IEFBR14")
    log("  IEF285I   USERID.RIDE.FILE1.SORTED     PURGED / SCRATCHED")
    log("  IEF285I   USERID.RIDE.FILE2.SORTED     PURGED / SCRATCHED")
    log("  IEF285I   USERID.RIDE.FILE3.LEDGER     PURGED / SCRATCHED")
    log("  IEF285I   USERID.RIDE.FILE4.FRAUDRPT   PURGED / SCRATCHED")
    log("  IEF285I   USERID.RIDE.FILE5.SUMRPT     PURGED / SCRATCHED")
    log("  STEP 00 (CLEANUP) COMPLETED - RETURN CODE: RC=0000")

    # -------------------------------------------------------------------------
    # STEP 1: JCL SORT (SORTF1.jcl) -> Deduplicate & Sort FILE1
    # Key: Cols 13-20 (Trip ID), SUM FIELDS=NONE
    # -------------------------------------------------------------------------
    log("\n[STEP 01] //SORTF1 EXEC PGM=SORT (SORTF1.jcl)")
    log("  ICE000I 0 - CONTROL STATEMENTS:")
    log("              SORT FIELDS=(13,8,CH,A)")
    log("              SUM FIELDS=NONE")
    log("  ICE088I 0 - INGESTING DD:SORTIN (FILE1_TRIP_DATA.ps, LRECL=80, RECFM=FB)")

    f1_seen = {}
    f1_duplicates = 0
    f1_dedup_samples = []

    if not os.path.exists(FILE1_RAW):
        raise FileNotFoundError(f"Input file not found: {FILE1_RAW}")

    row_num = 0
    with open(FILE1_RAW, "r", encoding="utf-8") as f:
        for line in f:
            row_num += 1
            rec = line.rstrip("\r\n")
            if len(rec) < 20:
                continue
            trip_id = rec[12:20].strip()
            if trip_id not in f1_seen:
                f1_seen[trip_id] = rec.ljust(80, " ")
            else:
                f1_duplicates += 1
                if len(f1_dedup_samples) < 5:
                    f1_dedup_samples.append(f"Row {row_num}: Trip '{trip_id}' duplicate stripped")

    sorted_f1_keys = sorted(f1_seen.keys())
    with open(FILE1_SORTED, "w", encoding="utf-8") as f:
        for k in sorted_f1_keys:
            f.write(f1_seen[k] + "\n")

    for s in f1_dedup_samples:
        log(f"  [DEDUP STRIP] {s}")
    log(f"  ICE135I 0 - SUMMARY: {f1_duplicates} DUPLICATE ROWS PURGED BY SUM FIELDS=NONE")
    log(f"  ICE080I 0 - WRITE SUCCESS: {len(sorted_f1_keys)} RECORDS -> DD:SORTOUT (FILE1_SORTED.ps)")
    log("  STEP 01 (SORTF1) COMPLETED - RETURN CODE: RC=0000")

    # -------------------------------------------------------------------------
    # STEP 2: REXX Deduplication (DEDUPF2.rexx) -> Deduplicate & Sort FILE2
    # Key: Cols 21-28 (Trip ID)
    # -------------------------------------------------------------------------
    log("\n[STEP 02] //REXXF2 EXEC PGM=IKJEFT01 (DEDUPF2.rexx)")
    log("  IRX0001I - INFILE: Reading FILE2_DRIVER_DATA.ps (80-byte LRECL)")
    log("  [REXX] Initializing associative stem table 'seen.trip_id'...")

    f2_seen = {}
    f2_duplicates = 0
    f2_dedup_samples = []

    if not os.path.exists(FILE2_RAW):
        raise FileNotFoundError(f"Input file not found: {FILE2_RAW}")

    row_num2 = 0
    with open(FILE2_RAW, "r", encoding="utf-8") as f:
        for line in f:
            row_num2 += 1
            rec = line.rstrip("\r\n")
            if len(rec) < 28:
                continue
            trip_id = rec[20:28].strip()
            if trip_id not in f2_seen:
                f2_seen[trip_id] = rec.ljust(80, " ")
            else:
                f2_duplicates += 1
                if len(f2_dedup_samples) < 5:
                    f2_dedup_samples.append(f"Row {row_num2}: Driver telemetry for Trip '{trip_id}' duplicate purged")

    sorted_f2_keys = sorted(f2_seen.keys())
    with open(FILE2_SORTED, "w", encoding="utf-8") as f:
        for k in sorted_f2_keys:
            f.write(f2_seen[k] + "\n")

    for s in f2_dedup_samples:
        log(f"  [REXX DEDUP] {s}")
    log(f"  [REXX] Total duplicates dropped: {f2_duplicates}. Unique driver records retained: {len(sorted_f2_keys)}")
    log("  [REXX SORT] Executing in-place QuickSort ascending on Trip ID (Cols 21-28)...")
    log(f"  IRX0002I - OUTFILE: {len(sorted_f2_keys)} sorted records written to FILE2_SORTED.ps")
    log("  STEP 02 (REXXF2) COMPLETED - RETURN CODE: RC=0000")

    # -------------------------------------------------------------------------
    # STEP 3: COBOL Balance-Line Merge & Fraud Analytics (RIDEANLZ.cbl)
    # -------------------------------------------------------------------------
    log("\n[STEP 03] //RUNCOBOL EXEC PGM=RIDEANLZ (COBOL 85 Batch Engine)")
    log("  IGY001I - OPENING 5 DATASETS (LRECL=80, RECFM=FB)")
    log("  1000-INITIALIZE: Priming pump reads on FILE1 and FILE2...")
    log("  2000-BALANCE-LINE: Merging pre-sorted sequential streams...")
    ledger_records = []
    fraud_records = []

    total_platform_revenue = Decimal("0.00")
    total_driver_payout = Decimal("0.00")
    total_trips_processed = 0
    total_fraud_trips = 0
    zone_dropoff_counts = {}

    idx1, idx2 = 0, 0
    len1, len2 = len(sorted_f1_keys), len(sorted_f2_keys)

    while idx1 < len1 and idx2 < len2:
        k1 = sorted_f1_keys[idx1]
        k2 = sorted_f2_keys[idx2]

        if k1 < k2:
            idx1 += 1
        elif k2 < k1:
            idx2 += 1
        else:
            # MATCH FOUND: k1 == k2
            r1 = f1_seen[k1]
            r2 = f2_seen[k2]

            timestamp = r1[0:12].strip()
            trip_id = r1[12:20].strip()
            pickup_zone = r1[20:23].strip().zfill(3)
            dropoff_zone = r1[23:26].strip().zfill(3)

            try:
                distance_float = float(r1[26:32].strip())
            except ValueError:
                distance_float = 0.0

            try:
                fare_float = float(r1[32:38].strip())
            except ValueError:
                fare_float = 0.0

            driver_id = r2[0:8].strip()
            duration_str = r2[28:33].strip().replace("MN", "")
            try:
                duration_mins = float(duration_str)
            except ValueError:
                duration_mins = 1.0

            if duration_mins <= 0:
                duration_mins = 1.0

            # Implied Speed calculation
            speed_mph = (distance_float * 60.0) / duration_mins

            # Fraud Detection Rules:
            # Rule 1: Speed > 85.0 MPH
            # Rule 2: Distance > 10.0 mi AND Fare < $5.00
            is_fraud = False
            fraud_reason = "            "

            if speed_mph > 85.0:
                is_fraud = True
                fraud_reason = "SPEED>85MPH "
            elif distance_float > 10.0 and fare_float < 5.0:
                is_fraud = True
                fraud_reason = "LOW-FARE    "

            fare_dec = Decimal(str(round(fare_float, 2)))
            payout_dec = (fare_dec * Decimal("0.75")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            platform_dec = (fare_dec * Decimal("0.25")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

            # Format COBOL numeric PIC fields
            dist_int = int(round(distance_float * 100))
            fare_int = int(round(fare_float * 100))
            payout_int = int(round(float(payout_dec) * 100))
            comm_int = int(round(float(platform_dec) * 100))
            dur_int = int(round(duration_mins * 100))
            speed_int = int(round(min(speed_mph, 999.99) * 100))

            if is_fraud:
                total_fraud_trips += 1
                # FILE4-FRAUD-RECORD (80 bytes)
                # Col 01-08: Trip ID
                # Col 09-16: Driver ID
                # Col 17-28: Fraud Flag
                # Col 29-34: Distance (PIC 9(4)V99)
                # Col 35-40: Total Fare (PIC 9(4)V99)
                # Col 41-45: Duration (PIC 9(3)V99)
                # Col 46-50: Speed (PIC 9(3)V99)
                # Col 51-80: Filler (30 bytes)
                fraud_line = (
                    f"{trip_id:<8}"
                    f"{driver_id:<8}"
                    f"{fraud_reason:<12}"
                    f"{dist_int:06d}"
                    f"{fare_int:06d}"
                    f"{dur_int:05d}"
                    f"{speed_int:05d}"
                ).ljust(80, " ")
                fraud_records.append(fraud_line)
            else:
                total_trips_processed += 1
                total_platform_revenue += platform_dec
                total_driver_payout += payout_dec

                dz_int = int(dropoff_zone) if dropoff_zone.isdigit() else 0
                zone_dropoff_counts[dz_int] = zone_dropoff_counts.get(dz_int, 0) + 1

                # FILE3-LEDGER-RECORD (80 bytes)
                # Col 01-08: Trip ID
                # Col 09-16: Driver ID
                # Col 17-28: Timestamp
                # Col 29-31: Pickup Zone
                # Col 32-34: Dropoff Zone
                # Col 35-40: Distance (PIC 9(4)V99)
                # Col 41-46: Total Fare (PIC 9(4)V99)
                # Col 47-52: Driver Payout (PIC 9(4)V99)
                # Col 53-58: Platform Commission (PIC 9(4)V99)
                # Col 59-63: Duration (PIC 9(3)V99)
                # Col 64-68: Implied Speed (PIC 9(3)V99)
                # Col 69-80: Filler (12 bytes)
                ledger_line = (
                    f"{trip_id:<8}"
                    f"{driver_id:<8}"
                    f"{timestamp:<12}"
                    f"{pickup_zone:<3}"
                    f"{dropoff_zone:<3}"
                    f"{dist_int:06d}"
                    f"{fare_int:06d}"
                    f"{payout_int:06d}"
                    f"{comm_int:06d}"
                    f"{dur_int:05d}"
                    f"{speed_int:05d}"
                ).ljust(80, " ")
                ledger_records.append(ledger_line)

            idx1 += 1
            idx2 += 1

    # Write FILE3_MASTER_LEDGER.ps
    with open(FILE3_LEDGER, "w", encoding="utf-8") as f:
        for r in ledger_records:
            f.write(r + "\n")

    # Write FILE4_FRAUD_REPORT.ps
    with open(FILE4_FRAUD, "w", encoding="utf-8") as f:
        for r in fraud_records:
            f.write(r + "\n")

    log(f"  Clean Merged Rides: {total_trips_processed} -> FILE3_MASTER_LEDGER.ps")
    log(f"  Fraud Anomalies:    {total_fraud_trips} -> FILE4_FRAUD_REPORT.ps")
    log(f"  Platform Revenue:   ${total_platform_revenue}")
    log(f"  Driver Payouts:     ${total_driver_payout}")

    # Write FILE5_SUMMARY_RPT.txt
    top_zones = sorted(zone_dropoff_counts.items(), key=lambda x: x[1], reverse=True)[:3]
    with open(FILE5_SUMMARY, "w", encoding="utf-8") as f:
        f.write("=" * 80 + "\n")
        f.write("      MAINFRAME-BASED RIDE ANALYTICS & MANAGEMENT SYSTEM - COBOL RIDEANLZ       \n")
        f.write("=" * 80 + "\n\n")
        f.write(f"  TOTAL CLEAN TRIPS PROCESSED:      {total_trips_processed:>10}\n")
        f.write(f"  TOTAL FRAUDULENT TRIPS FLAGGED:    {total_fraud_trips:>10}\n")
        f.write(f"  TOTAL PLATFORM COMMISSION (25%):  ${total_platform_revenue:>10.2f}\n")
        f.write(f"  TOTAL DRIVER DISBURSEMENTS (75%): ${total_driver_payout:>10.2f}\n\n")
        f.write("-" * 80 + "\n")
        f.write("  PREDICTIVE ANALYTICS: TOP 3 HOTTEST DROPOFF ZONES (DRIVER ALLOCATION ADVISORY)\n")
        f.write("-" * 80 + "\n")
        for rank, (z_id, count) in enumerate(top_zones, 1):
            f.write(f"  RANK {rank}: ZONE ID {z_id:03d} - {count} DROPOFFS (SURGE ALLOCATION RECOMMENDED)\n")
        f.write("=" * 80 + "\n")

    log("  [OCCURS ARRAY] 3-Pass Selection Scan completed across 265 dropoff zones:")
    for rank, (z_id, count) in enumerate(top_zones, 1):
        log(f"    #{rank} Hot Zone: {z_id:03d} with {count} dropoffs -> Driver Advisory Issued")
    log("  Summary Report:     FILE5_SUMMARY_RPT.txt generated.")
    log("  STEP 03 (COBOL RIDEANLZ) COMPLETED - RETURN CODE: RC=0000")

    # -------------------------------------------------------------------------
    # STEP 4: REXX Dynamic Surge Pricing (SURGEPRC.rexx)
    # -------------------------------------------------------------------------
    log("\n[STEP 04] //SURGSTEP EXEC PGM=IKJEFT01 (SURGEPRC.rexx)")
    log("  Aggregating pickup demand density by TLC Zone ID...")
    zone_demand = {}
    zone_fares = {}

    for k in sorted_f1_keys:
        r = f1_seen[k]
        p_zone = r[20:23].strip().zfill(3)
        try:
            f_val = float(r[32:38].strip())
        except ValueError:
            f_val = 0.0

        zone_demand[p_zone] = zone_demand.get(p_zone, 0) + 1
        zone_fares[p_zone] = zone_fares.get(p_zone, 0.0) + f_val

    with open(FILE_SURGE, "w", encoding="utf-8") as f:
        f.write("--- NYC TAXI RIDE ANALYTICS: SURGE PRICING REPORT ---\n".center(80))
        f.write("DYNAMIC DEMAND MONITORING SYSTEM (SURGEPRC.rexx)\n".center(80))
        f.write("-" * 80 + "\n")
        f.write("ZONE ID  | RIDE DEMAND | SURGE STATUS | MULTIPLIER | AVG BASE FARE\n")
        f.write("-" * 80 + "\n")

        for z_id in sorted(zone_demand.keys()):
            dem = zone_demand[z_id]
            avg_fare = zone_fares[z_id] / dem if dem > 0 else 0.0

            if dem >= 5:
                status = "HIGH SURGE  "
                mult = "2.00x"
            elif dem >= 3:
                status = "MOD SURGE   "
                mult = "1.35x"
            else:
                status = "NORMAL      "
                mult = "1.00x"

            line = f"{z_id:<8} | {dem:<11} | {status} | {mult:<10} | ${avg_fare:>6.2f}"
            f.write(line.ljust(80, " ") + "\n")

        f.write("=" * 80 + "\n")

    log("  Surge Report:       RIDE_SURGE_REPORT.txt generated.")
    log("  STEP 04 (SURGEPRC) COMPLETED - RETURN CODE: RC=0000")

    # -------------------------------------------------------------------------
    # STEP 05: IEBGENER Safeguard Backup
    # -------------------------------------------------------------------------
    log("\n[STEP 05] //BACKUP EXEC PGM=IEBGENER")
    log("  SYSUT1 (FILE5.SUMRPT) -> SYSUT2 (BACKUP.REPORT) ARCHIVED")
    log("  STEP 05 (IEBGENER) COMPLETED - RETURN CODE: RC=0000")

    log("\n" + "=" * 70)
    log("JOB04821 $HASP395 MASTERWF ENDED - MAX RETURN CODE RC=0000 (SUCCESS)")
    log("=" * 70)

    # Persist log file to disk
    with open(FILE_LOGS, "w", encoding="utf-8") as f:
        f.write("\n".join(logs) + "\n")

    return logs


if __name__ == "__main__":
    run_batch_pipeline()
