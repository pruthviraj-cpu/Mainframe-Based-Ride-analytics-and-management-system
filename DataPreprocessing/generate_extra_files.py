"""
generate_extra_files.py
=======================
Generates 2 EXTRA pairs of 80-byte mainframe PS test files
using PURE random data (no internet needed) so we can
test the COBOL RIDEANLZ logic offline.

Batch A - FILE1_TRIP_DATA_B.ps / FILE2_DRIVER_DATA_B.ps
  -> Small dataset (50 trips), clean data, no fraud edge cases.

Batch B - FILE1_TRIP_DATA_C.ps / FILE2_DRIVER_DATA_C.ps
  -> Fraud-heavy dataset (80 trips) with intentional fraud records:
       * Speed > 85 MPH (short duration, long distance)
       * Low-fare fraud (>10 miles but fare < $5)
     Also has unmatched records (orphan trips and orphan drivers).

Author: Mainframe Ride Analytics System
"""

import random
import os

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))

# ─────────────────────────────────────────────────────────────────────────────
# HELPERS: build 80-byte records exactly matching COBOL layout
# ─────────────────────────────────────────────────────────────────────────────

def make_f1_record(trip_id: str, timestamp: str, pickup: int,
                   dropoff: int, distance: float, fare: float) -> str:
    """
    FILE1 layout (80 bytes):
      Col 01-12  Timestamp  PIC X(12)
      Col 13-20  Trip ID    PIC X(8)
      Col 21-23  Pickup     PIC 9(3)
      Col 24-26  Dropoff    PIC 9(3)
      Col 27-32  Distance   PIC 9(4)V99  -> 6 chars e.g. 001234 = 12.34 miles
      Col 33-38  Fare       PIC 9(4)V99  -> 6 chars e.g. 001234 = 12.34 dollars
      Col 39-80  Filler     42 spaces
    """
    ts   = timestamp[:12].ljust(12)         # 12 bytes
    tid  = trip_id[:8].ljust(8)             # 8 bytes
    pu   = f"{pickup:03d}"[:3]              # 3 bytes
    do   = f"{dropoff:03d}"[:3]             # 3 bytes
    dist = f"{min(distance, 9999.99):06.2f}".replace('.', '')  # 6 bytes no dot
    # COBOL PIC 9(4)V99 means 4 digits + 2 decimal, stored WITHOUT decimal point
    # e.g. 12.34 miles -> stored as "001234"
    dist_str = f"{int(min(distance, 9999.99) * 100):06d}"
    fare_str = f"{int(min(fare, 9999.99) * 100):06d}"

    record = f"{ts}{tid}{pu}{do}{dist_str}{fare_str}"
    return record.ljust(80)[:80]


def make_f2_record(driver_id: str, trip_id: str, duration_mins: float) -> str:
    """
    FILE2 layout (80 bytes):
      Col 01-08  Driver ID  PIC X(8)
      Col 09-20  Filler     12 spaces
      Col 21-28  Trip ID    PIC X(8)
      Col 29-33  Duration   PIC 9(3)V99  -> 5 chars e.g. 01234 = 12.34 mins
      Col 34-80  Filler     47 spaces
    """
    drv  = driver_id[:8].ljust(8)
    fill = ' ' * 12
    tid  = trip_id[:8].ljust(8)
    dur_str = f"{int(min(duration_mins, 999.99) * 100):05d}"  # 5 bytes

    record = f"{drv}{fill}{tid}{dur_str}"
    return record.ljust(80)[:80]


def timestamp_str(year=2021, month=1, day=1, hour=0, minute=0) -> str:
    """Returns YYYYMMDDHHMM format (12 chars)."""
    return f"{year:04d}{month:02d}{day:02d}{hour:02d}{minute:02d}"


def random_timestamp():
    month = random.randint(1, 12)
    day   = random.randint(1, 28)
    hour  = random.randint(0, 23)
    minute = random.randint(0, 59)
    return timestamp_str(2021, month, day, hour, minute)


def random_driver_id():
    return f"DRV{random.randint(10000, 99999)}"


# ─────────────────────────────────────────────────────────────────────────────
# BATCH A: Clean dataset (50 matched trips, no fraud)
# ─────────────────────────────────────────────────────────────────────────────
def generate_batch_a():
    print("\n" + "="*60)
    print("  GENERATING BATCH A — Clean Dataset (50 trips)")
    print("="*60)

    f1_records = []
    f2_records = []

    for i in range(1, 51):
        trip_id  = f"TA{i:06d}"         # e.g. TA000001
        ts       = random_timestamp()
        pickup   = random.randint(1, 265)
        dropoff  = random.randint(1, 265)
        distance = round(random.uniform(0.5, 15.0), 2)   # 0.5 - 15 miles
        duration = round(random.uniform(3.0, 45.0), 2)   # 3 - 45 mins

        # Fare: realistic NYC pricing ~$2.5 base + $1.75/mile + time component
        fare = round(2.50 + distance * 1.75 + duration * 0.35 + random.uniform(0, 5), 2)

        # Verify this won't trigger fraud:
        #   speed = distance / (duration/60)
        speed = distance / (duration / 60.0)
        if speed > 85:
            duration = round(distance / 80 * 60 + 2, 2)  # fix duration so speed ~ 80 MPH
        if distance > 10 and fare < 5.0:
            fare = round(distance * 2.0, 2)  # fix fare

        f1_records.append(make_f1_record(trip_id, ts, pickup, dropoff, distance, fare))
        f2_records.append(make_f2_record(random_driver_id(), trip_id, duration))

    # Shuffle both (simulate real unsorted PS file)
    random.shuffle(f1_records)
    random.shuffle(f2_records)

    path_f1 = os.path.join(OUTPUT_DIR, "FILE1_TRIP_DATA_B.ps")
    path_f2 = os.path.join(OUTPUT_DIR, "FILE2_DRIVER_DATA_B.ps")

    with open(path_f1, "w") as f:
        for rec in f1_records:
            f.write(rec + "\n")

    with open(path_f2, "w") as f:
        for rec in f2_records:
            f.write(rec + "\n")

    print(f"  Created: {path_f1}  ({len(f1_records)} records)")
    print(f"  Created: {path_f2}  ({len(f2_records)} records)")
    print(f"  All 50 trips are clean (no fraud). Perfect for ledger testing.")


# ─────────────────────────────────────────────────────────────────────────────
# BATCH C: Fraud-heavy + unmatched records dataset
# ─────────────────────────────────────────────────────────────────────────────
def generate_batch_c():
    print("\n" + "="*60)
    print("  GENERATING BATCH C — Fraud + Unmatched Dataset")
    print("="*60)

    f1_records = []
    f2_records = []

    # === GROUP 1: 40 normal clean trips (matched) ===
    print("  [Group 1] 40 normal clean matched trips...")
    for i in range(1, 41):
        trip_id  = f"TC{i:06d}"
        ts       = random_timestamp()
        pickup   = random.randint(1, 265)
        dropoff  = random.randint(1, 265)
        distance = round(random.uniform(0.5, 9.0), 2)    # under 10 miles to avoid fare fraud
        duration = round(random.uniform(5.0, 40.0), 2)
        fare     = round(2.50 + distance * 1.75 + random.uniform(1, 10), 2)

        # double-check no accidental fraud
        speed = distance / (duration / 60.0)
        if speed > 85:
            duration = round(distance / 70 * 60 + 2, 2)

        f1_records.append(make_f1_record(trip_id, ts, pickup, dropoff, distance, fare))
        f2_records.append(make_f2_record(random_driver_id(), trip_id, duration))

    # === GROUP 2: 10 SPEED FRAUD trips (speed > 85 MPH) ===
    print("  [Group 2] 10 SPEED FRAUD trips (speed > 85 MPH)...")
    for i in range(41, 51):
        trip_id  = f"TC{i:06d}"
        ts       = random_timestamp()
        pickup   = random.randint(1, 265)
        dropoff  = random.randint(1, 265)
        distance = round(random.uniform(20.0, 50.0), 2)   # long distance
        duration = round(random.uniform(1.0, 5.0), 2)     # impossibly short duration

        # speed will be >> 85 MPH
        speed = distance / (duration / 60.0)
        fare  = round(distance * 2.5, 2)

        f1_records.append(make_f1_record(trip_id, ts, pickup, dropoff, distance, fare))
        f2_records.append(make_f2_record(random_driver_id(), trip_id, duration))
        print(f"    Trip {trip_id}: {distance}mi in {duration}min = {speed:.1f} MPH  [FRAUD: SPEED]")

    # === GROUP 3: 10 LOW-FARE FRAUD trips (dist > 10mi but fare < $5) ===
    print("  [Group 3] 10 LOW-FARE FRAUD trips (>10 miles, fare < $5)...")
    for i in range(51, 61):
        trip_id  = f"TC{i:06d}"
        ts       = random_timestamp()
        pickup   = random.randint(1, 265)
        dropoff  = random.randint(1, 265)
        distance = round(random.uniform(10.5, 30.0), 2)   # > 10 miles
        duration = round(random.uniform(15.0, 60.0), 2)   # normal duration, OK speed
        fare     = round(random.uniform(0.50, 4.99), 2)   # under $5 -> suspicious

        f1_records.append(make_f1_record(trip_id, ts, pickup, dropoff, distance, fare))
        f2_records.append(make_f2_record(random_driver_id(), trip_id, duration))
        print(f"    Trip {trip_id}: {distance}mi, Fare=${fare}  [FRAUD: LOW-FARE]")

    # === GROUP 4: 5 ORPHAN trips in FILE1 only (no driver match) ===
    print("  [Group 4] 5 orphan FILE1 records (no matching driver)...")
    for i in range(61, 66):
        trip_id  = f"TC{i:06d}"
        ts       = random_timestamp()
        pickup   = random.randint(1, 265)
        dropoff  = random.randint(1, 265)
        distance = round(random.uniform(1, 8), 2)
        fare     = round(distance * 2.0 + 3, 2)
        # No FILE2 record added for these
        f1_records.append(make_f1_record(trip_id, ts, pickup, dropoff, distance, fare))
        print(f"    Orphan F1 Trip {trip_id} (no driver record)")

    # === GROUP 5: 5 ORPHAN drivers in FILE2 only (no trip match) ===
    print("  [Group 5] 5 orphan FILE2 records (no matching trip)...")
    for i in range(66, 71):
        trip_id  = f"TC{i:06d}"
        duration = round(random.uniform(5, 30), 2)
        # No FILE1 record added for these
        f2_records.append(make_f2_record(random_driver_id(), trip_id, duration))
        print(f"    Orphan F2 Driver for Trip {trip_id} (no trip record)")

    # Shuffle both files
    random.shuffle(f1_records)
    random.shuffle(f2_records)

    path_f1 = os.path.join(OUTPUT_DIR, "FILE1_TRIP_DATA_C.ps")
    path_f2 = os.path.join(OUTPUT_DIR, "FILE2_DRIVER_DATA_C.ps")

    with open(path_f1, "w") as f:
        for rec in f1_records:
            f.write(rec + "\n")

    with open(path_f2, "w") as f:
        for rec in f2_records:
            f.write(rec + "\n")

    print(f"\n  Created: {path_f1}  ({len(f1_records)} records)")
    print(f"  Created: {path_f2}  ({len(f2_records)} records)")
    print(f"  Expected: 40 clean ledger | 20 fraud | 5 F1 orphan | 5 F2 orphan")


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    random.seed(2024)  # reproducible results every run
    generate_batch_a()
    generate_batch_c()
    print("\n" + "="*60)
    print("  All extra test files generated successfully!")
    print("="*60)
