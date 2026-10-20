"""
test_rideanlz.py
================
Python simulator of the RIDEANLZ COBOL logic.
Tests all 5 major functions:
  1. Balance-Line Merge (match engine)
  2. Financial Ledger (75%/25% split)
  3. Fraud Detection (speed + low-fare rules)
  4. Zone Demand Table (265-entry tally)
  5. Summary Report + Top-3 zone output

Can test any pair of .ps files from the DataPreprocessing folder.

Usage:
  python test_rideanlz.py FILE1_TRIP_DATA.ps FILE2_DRIVER_DATA.ps
  python test_rideanlz.py FILE1_TRIP_DATA_B.ps FILE2_DRIVER_DATA_B.ps
  python test_rideanlz.py FILE1_TRIP_DATA_C.ps FILE2_DRIVER_DATA_C.ps

Author: Mainframe Ride Analytics System
"""

import sys
import os
from dataclasses import dataclass, field
from typing import Optional

# ─────────────────────────────────────────────────────────────────────────────
# COBOL Constants (exactly as defined in WORKING-STORAGE)
# ─────────────────────────────────────────────────────────────────────────────
PAYOUT_RATE   = 0.75
COMM_RATE     = 0.25
SPEED_LIMIT   = 85.0      # MPH
MIN_FARE_DIST = 10.0      # miles
MIN_FARE_AMT  = 5.00      # dollars
MAX_ZONE_ID   = 265
TOP_N         = 3


# ─────────────────────────────────────────────────────────────────────────────
# RECORD PARSERS (mirror the COBOL FD layouts exactly)
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class TripRecord:
    """FILE1 - 80 bytes. PK is TRIP-ID at cols 13-20."""
    raw: str
    timestamp:   str   = ""
    trip_id:     str   = ""
    pickup_zone: int   = 0
    dropoff_zone:int   = 0
    distance:    float = 0.0
    total_fare:  float = 0.0

    def parse(self):
        r = self.raw.ljust(80)
        self.timestamp    = r[0:12]
        self.trip_id      = r[12:20].strip()
        try:
            self.pickup_zone  = int(r[20:23])
            self.dropoff_zone = int(r[23:26])
            # COBOL PIC 9(4)V99: 6 chars, implied decimal, e.g. "001234" = 12.34
            raw_dist = r[26:32].strip()
            raw_fare = r[32:38].strip()
            self.distance   = int(raw_dist) / 100.0 if raw_dist.isdigit() else 0.0
            self.total_fare = int(raw_fare) / 100.0 if raw_fare.isdigit() else 0.0
        except (ValueError, IndexError):
            pass
        return self


@dataclass
class DriverRecord:
    """FILE2 - 80 bytes. PK is TRIP-ID at cols 21-28."""
    raw: str
    driver_id:   str   = ""
    trip_id:     str   = ""
    duration:    float = 0.0   # minutes (PIC 9(3)V99 -> 5 chars)

    def parse(self):
        r = self.raw.ljust(80)
        self.driver_id = r[0:8].strip()
        # filler at 8-20 (12 bytes)
        self.trip_id   = r[20:28].strip()
        try:
            raw_dur = r[28:33].strip()
            # Could be "009MN" (old format) or "00900" (new pure numeric format)
            numeric_part = ''.join(c for c in raw_dur if c.isdigit())
            if len(numeric_part) >= 3:
                self.duration = int(numeric_part[:5].ljust(5,'0')) / 100.0
            else:
                self.duration = 0.0
        except (ValueError, IndexError):
            self.duration = 0.0
        return self


# ─────────────────────────────────────────────────────────────────────────────
# LOAD & SORT FILE (simulates what JCL SORT / REXX does before COBOL runs)
# ─────────────────────────────────────────────────────────────────────────────

def load_file1(path: str) -> list:
    records = []
    with open(path, 'r', encoding='utf-8', errors='replace') as f:
        for line in f:
            line = line.rstrip('\n').rstrip('\r')
            if len(line.strip()) == 0:
                continue
            rec = TripRecord(raw=line).parse()
            if rec.trip_id:
                records.append(rec)
    # Sort ascending by TRIP-ID (simulate JCL SORT)
    records.sort(key=lambda r: r.trip_id)
    return records

def load_file2(path: str) -> list:
    records = []
    with open(path, 'r', encoding='utf-8', errors='replace') as f:
        for line in f:
            line = line.rstrip('\n').rstrip('\r')
            if len(line.strip()) == 0:
                continue
            rec = DriverRecord(raw=line).parse()
            if rec.trip_id:
                records.append(rec)
    # Sort ascending by TRIP-ID + deduplicate (simulate REXX DEDUPF2)
    seen = set()
    unique = []
    for rec in sorted(records, key=lambda r: r.trip_id):
        if rec.trip_id not in seen:
            seen.add(rec.trip_id)
            unique.append(rec)
    return unique


# ─────────────────────────────────────────────────────────────────────────────
# FINANCIAL LEDGER
# ─────────────────────────────────────────────────────────────────────────────

def compute_financials(fare: float):
    payout = round(fare * PAYOUT_RATE, 2)
    comm   = round(fare * COMM_RATE, 2)
    return payout, comm


# ─────────────────────────────────────────────────────────────────────────────
# FRAUD DETECTION (mirrors COBOL EVALUATE TRUE block)
# ─────────────────────────────────────────────────────────────────────────────

def detect_fraud(distance: float, fare: float, duration: float):
    """
    Returns (is_fraud: bool, reason: str, speed: float)
    Mirrors COBOL 2100-PROCESS-MATCHED-RECORD logic exactly.
    """
    # Implied speed = distance / (duration in hours)
    if duration > 0:
        speed = distance / (duration / 60.0)
    else:
        speed = 999.99   # zero duration -> always fraud

    # Rule 1: Speed > 85 MPH
    if speed > SPEED_LIMIT:
        return True, "SPEED>85MPH", speed

    # Rule 2: Distance > 10 miles but fare < $5
    if distance > MIN_FARE_DIST and fare < MIN_FARE_AMT:
        return True, "LOW-FARE   ", speed

    return False, "", speed


# ─────────────────────────────────────────────────────────────────────────────
# BALANCE-LINE MERGE (core algorithm)
# ─────────────────────────────────────────────────────────────────────────────

def balance_line_merge(f1_records: list, f2_records: list):
    """
    Simulates the COBOL 2000-BALANCE-LINE-MERGE paragraph.
    Returns a results dict with all output categories.
    """
    HIGH_VALUES = "\xFF" * 8   # sentinel: always > any real trip ID

    # Pointers into each sorted file
    i1, i2 = 0, 0
    n1, n2 = len(f1_records), len(f2_records)

    # Output buckets
    ledger_records  = []
    fraud_records   = []
    unmatched_f1    = []
    unmatched_f2    = []

    # Accumulators
    total_platform  = 0.0
    total_payout    = 0.0
    zone_table      = [0] * (MAX_ZONE_ID + 1)   # index 1-265

    def get_key1():
        return f1_records[i1].trip_id if i1 < n1 else HIGH_VALUES

    def get_key2():
        return f2_records[i2].trip_id if i2 < n2 else HIGH_VALUES

    while i1 < n1 or i2 < n2:
        k1 = get_key1()
        k2 = get_key2()

        if k1 < k2:
            # FILE1 key smaller -> orphan trip (no driver)
            unmatched_f1.append(f1_records[i1])
            i1 += 1

        elif k2 < k1:
            # FILE2 key smaller -> orphan driver (no trip)
            unmatched_f2.append(f2_records[i2])
            i2 += 1

        else:
            # MATCH: k1 == k2
            trip   = f1_records[i1]
            driver = f2_records[i2]

            payout, comm = compute_financials(trip.total_fare)
            is_fraud, reason, speed = detect_fraud(
                trip.distance, trip.total_fare, driver.duration
            )

            record = {
                "trip_id":     trip.trip_id,
                "driver_id":   driver.driver_id,
                "timestamp":   trip.timestamp,
                "pickup":      trip.pickup_zone,
                "dropoff":     trip.dropoff_zone,
                "distance":    trip.distance,
                "fare":        trip.total_fare,
                "payout":      payout,
                "commission":  comm,
                "duration":    driver.duration,
                "speed":       speed,
                "fraud":       is_fraud,
                "fraud_reason":reason,
            }

            if is_fraud:
                fraud_records.append(record)
            else:
                ledger_records.append(record)
                total_platform += comm
                total_payout   += payout
                # Zone tally
                dz = trip.dropoff_zone
                if 1 <= dz <= MAX_ZONE_ID:
                    zone_table[dz] += 1

            i1 += 1
            i2 += 1

    return {
        "ledger":          ledger_records,
        "fraud":           fraud_records,
        "unmatched_f1":    unmatched_f1,
        "unmatched_f2":    unmatched_f2,
        "total_platform":  round(total_platform, 2),
        "total_payout":    round(total_payout, 2),
        "zone_table":      zone_table,
    }


# ─────────────────────────────────────────────────────────────────────────────
# TOP-3 ZONE FINDER (mirrors COBOL 3000-FINALIZE selection scan)
# ─────────────────────────────────────────────────────────────────────────────

def find_top3_zones(zone_table: list):
    """
    3-pass selection scan - exactly as implemented in COBOL.
    Returns list of (zone_id, count) tuples.
    """
    table_copy = zone_table[:]
    top3 = []
    for _ in range(TOP_N):
        max_count = 0
        max_zone  = 0
        for z in range(1, MAX_ZONE_ID + 1):
            if table_copy[z] > max_count:
                max_count = table_copy[z]
                max_zone  = z
        if max_zone > 0:
            top3.append((max_zone, max_count))
            table_copy[max_zone] = 0   # zero out so next pass skips it
    return top3


# ─────────────────────────────────────────────────────────────────────────────
# PRINT SUMMARY REPORT (mirrors COBOL 3100-WRITE-SUMMARY-REPORT)
# ─────────────────────────────────────────────────────────────────────────────

def print_summary_report(results: dict, file1_name: str, file2_name: str):
    top3 = find_top3_zones(results["zone_table"])

    SEP = "=" * 70
    print(f"\n{SEP}")
    print(f"   NYC TAXI RIDE ANALYTICS SYSTEM -- SUMMARY REPORT")
    print(f"   Input: {os.path.basename(file1_name)}  +  {os.path.basename(file2_name)}")
    print(SEP)
    print(f"   Total Clean Trips to Ledger  : {len(results['ledger']):>8,}")
    print(f"   Total Fraud Trips Caught     : {len(results['fraud']):>8,}")
    print(f"   Unmatched FILE1 (no driver)  : {len(results['unmatched_f1']):>8,}")
    print(f"   Unmatched FILE2 (no trip)    : {len(results['unmatched_f2']):>8,}")
    print(f"   Total Platform Revenue ($25%): ${results['total_platform']:>10,.2f}")
    print(f"   Total Driver Payouts  ($75%) : ${results['total_payout']:>10,.2f}")
    print(f"\n{SEP}")
    print(f"   TOP 3 MOST POPULAR DROPOFF ZONES (Driver Routing)")
    print(SEP)
    print(f"   {'Rank':<6} {'Zone ID':<10} {'Trip Count':<12} Notes")
    print(f"   {'-'*65}")
    for rank, (zone, count) in enumerate(top3, 1):
        note = ""
        if rank == 1:
            note = "RECOMMENDATION: ALLOCATE IDLE DRIVERS TO THIS HIGH-DEMAND ZONE"
        print(f"   #{rank:<5} Zone {zone:<7} {count:<12} {note}")
    print(SEP)


# ─────────────────────────────────────────────────────────────────────────────
# ASSERTIONS / UNIT TESTS
# ─────────────────────────────────────────────────────────────────────────────

def run_assertions(results: dict, dataset_name: str,
                   expected_clean: Optional[int] = None,
                   expected_fraud: Optional[int] = None,
                   expected_uf1:   Optional[int] = None,
                   expected_uf2:   Optional[int] = None):
    """
    Runs assertion checks and prints PASS/FAIL for each test.
    """
    SEP2 = "-" * 70
    print(f"\n{SEP2}")
    print(f"  UNIT TEST ASSERTIONS -- {dataset_name}")
    print(f"{SEP2}")
    passed = 0
    failed = 0

    def check(label, actual, expected):
        nonlocal passed, failed
        if expected is None:
            print(f"  [SKIP] {label}: {actual} (no expectation set)")
            return
        if actual == expected:
            print(f"  [PASS] {label}: {actual} == {expected}")
            passed += 1
        else:
            print(f"  [FAIL] {label}: got {actual}, expected {expected}")
            failed += 1

    check("Clean trips in ledger", len(results["ledger"]),       expected_clean)
    check("Fraud trips caught",    len(results["fraud"]),        expected_fraud)
    check("Unmatched FILE1",       len(results["unmatched_f1"]), expected_uf1)
    check("Unmatched FILE2",       len(results["unmatched_f2"]), expected_uf2)

    # Financial sanity checks on ledger records
    fin_errors = 0
    for rec in results["ledger"]:
        expected_payout = round(rec["fare"] * 0.75, 2)
        expected_comm   = round(rec["fare"] * 0.25, 2)
        if abs(rec["payout"] - expected_payout) > 0.01:
            fin_errors += 1
        if abs(rec["commission"] - expected_comm) > 0.01:
            fin_errors += 1

    label = "Financial calc accuracy (75/25 split)"
    if fin_errors == 0:
        print(f"  [PASS] {label}: All correct")
        passed += 1
    else:
        print(f"  [FAIL] {label}: {fin_errors} errors found")
        failed += 1

    # Fraud speed check: all fraud records with SPEED>85MPH must have speed > 85
    speed_fraud_ok = all(
        rec["speed"] > SPEED_LIMIT
        for rec in results["fraud"] if "SPEED" in rec["fraud_reason"]
    )
    label = "Speed fraud records all have speed > 85 MPH"
    if speed_fraud_ok:
        print(f"  [PASS] {label}")
        passed += 1
    else:
        print(f"  [FAIL] {label}")
        failed += 1

    # Low-fare fraud check: all LOW-FARE records must have dist>10 and fare<5
    fare_fraud_ok = all(
        rec["distance"] > MIN_FARE_DIST and rec["fare"] < MIN_FARE_AMT
        for rec in results["fraud"] if "LOW" in rec["fraud_reason"]
    )
    label = "Low-fare fraud records all match dist>10mi & fare<$5"
    if fare_fraud_ok:
        print(f"  [PASS] {label}")
        passed += 1
    else:
        print(f"  [FAIL] {label}")
        failed += 1

    # Zone table sanity: count must equal ledger size
    zone_total = sum(results["zone_table"])
    label = f"Zone tally total == clean trip count ({len(results['ledger'])})"
    if zone_total == len(results["ledger"]):
        print(f"  [PASS] {label}")
        passed += 1
    else:
        print(f"  [FAIL] {label}: zone_total={zone_total}")
        failed += 1

    print(f"\n  Results: {passed} passed, {failed} failed")
    return failed == 0


# ─────────────────────────────────────────────────────────────────────────────
# DETAIL VIEW: show sample records from each output
# ─────────────────────────────────────────────────────────────────────────────

def print_sample_records(results: dict, max_rows: int = 5):
    """Print sample rows from each output category."""
    SEP2 = "-" * 70
    print(f"\n{SEP2}")
    print(f"  SAMPLE LEDGER RECORDS (FILE3) - first {max_rows}")
    print(f"{SEP2}")
    print(f"  {'TripID':<10} {'DriverID':<10} {'Dist':>6} {'Fare':>8} {'Payout':>8} {'Comm':>8} {'Speed':>8}")
    for rec in results["ledger"][:max_rows]:
        print(f"  {rec['trip_id']:<10} {rec['driver_id']:<10} "
              f"{rec['distance']:>6.2f} ${rec['fare']:>7.2f} "
              f"${rec['payout']:>7.2f} ${rec['commission']:>7.2f} "
              f"{rec['speed']:>7.1f}mph")

    if results["fraud"]:
        print(f"\n{SEP2}")
        print(f"  SAMPLE FRAUD RECORDS (FILE4) - first {max_rows}")
        print(f"{SEP2}")
        print(f"  {'TripID':<10} {'Flag':<12} {'Dist':>6} {'Fare':>8} {'Speed':>10}")
        for rec in results["fraud"][:max_rows]:
            print(f"  {rec['trip_id']:<10} {rec['fraud_reason']:<12} "
                  f"{rec['distance']:>6.2f} ${rec['fare']:>7.2f} "
                  f"{rec['speed']:>9.1f}mph")

    if results["unmatched_f1"]:
        print(f"\n{SEP2}")
        print(f"  ORPHAN FILE1 RECORDS (no driver) - first {max_rows}")
        print(f"{SEP2}")
        for rec in results["unmatched_f1"][:max_rows]:
            print(f"  TripID={rec.trip_id}  Distance={rec.distance}mi  Fare=${rec.total_fare}")

    if results["unmatched_f2"]:
        print(f"\n{SEP2}")
        print(f"  ORPHAN FILE2 RECORDS (no trip) - first {max_rows}")
        print(f"{SEP2}")
        for rec in results["unmatched_f2"][:max_rows]:
            print(f"  TripID={rec.trip_id}  DriverID={rec.driver_id}  Duration={rec.duration}min")


# ─────────────────────────────────────────────────────────────────────────────
# MAIN TEST RUNNER
# ─────────────────────────────────────────────────────────────────────────────

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def run_test(f1_name: str, f2_name: str,
             dataset_label: str,
             expected_clean=None, expected_fraud=None,
             expected_uf1=None, expected_uf2=None):

    f1_path = os.path.join(BASE_DIR, f1_name)
    f2_path = os.path.join(BASE_DIR, f2_name)

    if not os.path.exists(f1_path):
        print(f"\n[SKIP] {f1_name} not found, skipping.")
        return

    print(f"\n{'#'*70}")
    print(f"  TEST: {dataset_label}")
    print(f"  FILE1 = {f1_name}  |  FILE2 = {f2_name}")
    print(f"{'#'*70}")

    f1 = load_file1(f1_path)
    f2 = load_file2(f2_path)
    print(f"  Loaded: {len(f1)} trip records, {len(f2)} driver records (after dedup+sort)")

    results = balance_line_merge(f1, f2)

    print_sample_records(results)
    print_summary_report(results, f1_path, f2_path)
    all_pass = run_assertions(results, dataset_label,
                              expected_clean, expected_fraud,
                              expected_uf1, expected_uf2)
    return all_pass


if __name__ == "__main__":
    print("=" * 70)
    print("  RIDEANLZ COBOL LOGIC — PYTHON TEST SIMULATOR")
    print("  Tests Balance-Line, Financials, Fraud, Zones, Report")
    print("=" * 70)

    all_passed = True

    # ── TEST 1: Original dataset (script.py output) ──────────────────────────
    all_passed &= run_test(
        "FILE1_TRIP_DATA.ps", "FILE2_DRIVER_DATA.ps",
        dataset_label="ORIGINAL DATASET (from script.py / NYC CSV)",
    )

    # ── TEST 2: Batch A — Clean 50 trips ─────────────────────────────────────
    all_passed &= run_test(
        "FILE1_TRIP_DATA_B.ps", "FILE2_DRIVER_DATA_B.ps",
        dataset_label="BATCH A — Clean 50 trips (no fraud expected)",
        expected_clean=50,
        expected_fraud=0,
        expected_uf1=0,
        expected_uf2=0,
    )

    # ── TEST 3: Batch C — Fraud + Orphan dataset ──────────────────────────────
    all_passed &= run_test(
        "FILE1_TRIP_DATA_C.ps", "FILE2_DRIVER_DATA_C.ps",
        dataset_label="BATCH C — Fraud+Orphan dataset",
        expected_clean=40,
        expected_fraud=20,
        expected_uf1=5,
        expected_uf2=5,
    )

    print(f"\n{'='*70}")
    print(f"  OVERALL: {'ALL TESTS PASSED [OK]' if all_passed else 'SOME TESTS FAILED [!!]'}")
    print(f"{'='*70}\n")
