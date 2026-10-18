import pandas as pd
import random

def process_nyc_data(source_path_or_url, total_records_file1, duplicates_file1, total_records_file2, duplicates_file2):
    print(f"Loading first 5,000 rows from: {source_path_or_url} ...")
    
    # 1. Read ONLY the first 5,000 rows (streams fast even from a URL!)
    df = pd.read_csv(source_path_or_url, nrows=5000, low_memory=False)
    
    # 2. Clean the data (Drop nulls, filter out 0 distance or 0 fare)
    df = df.dropna(subset=['tpep_pickup_datetime', 'tpep_dropoff_datetime', 'PULocationID', 'DOLocationID'])
    df = df[(df['trip_distance'] > 0) & (df['total_amount'] > 0)]
    
    # Convert datetime strings to calculate trip duration in minutes
    df['pickup_dt'] = pd.to_datetime(df['tpep_pickup_datetime'])
    df['dropoff_dt'] = pd.to_datetime(df['tpep_dropoff_datetime'])
    df['duration_mins'] = (df['dropoff_dt'] - df['pickup_dt']).dt.total_seconds() / 60
    df = df[df['duration_mins'] > 0] # Ensure positive duration

    file1_records = []
    file2_records = []
    
    # Calculate how many unique rides we need across both files
    unique_trips_needed = max(total_records_file1 - duplicates_file1, total_records_file2 - duplicates_file2)
    
    # Randomly sample the exact number of unique real trips needed
    df_sampled = df.sample(n=unique_trips_needed, random_state=42).reset_index(drop=True)

    print(f"Formatting {unique_trips_needed} unique NYC rides into 80-byte Mainframe PS files...")

    # 3. Format into strict 80-byte PS records
    for index, row in df_sampled.iterrows():
        # Shared Primary Key (8 bytes: e.g., TR000001)
        # In File 1 -> Col 13-20 | In File 2 -> Col 21-28
        trip_id = f"TR{index + 1:06d}"
        
        # --- FILE 1: NYC Trip & Location Data (80 Bytes, PK at Col 13-20) ---
        timestamp = row['pickup_dt'].strftime('%Y%m%d%H%M')        # Col 01-12 (12 bytes)
        pickup_id = f"{int(row['PULocationID']):03d}"[:3]          # Col 21-23 (3 bytes - Start Pt)
        dropoff_id = f"{int(row['DOLocationID']):03d}"[:3]         # Col 24-26 (3 bytes - Dest Pt)
        distance = f"{min(row['trip_distance'], 99.99):06.2f}"     # Col 27-32 (6 bytes)
        fare = f"{min(row['total_amount'], 999.99):06.2f}"         # Col 33-38 (6 bytes)
        
        f1_record = f"{timestamp}{trip_id}{pickup_id}{dropoff_id}{distance}{fare}".ljust(80, " ")
        if index < (total_records_file1 - duplicates_file1):
            file1_records.append(f1_record)

        # --- FILE 2: Driver & Duration Data (80 Bytes, PK at Col 21-28) ---
        driver_id = f"DRV{random.randint(10000, 99999)}"           # Col 01-08 (8 bytes)
        filler1 = " " * 12                                         # Col 09-20 (12 bytes)
        duration = f"{min(int(row['duration_mins']), 999):03d}MN"  # Col 29-33 (5 bytes)
        
        f2_record = f"{driver_id}{filler1}{trip_id}{duration}".ljust(80, " ")
        if index < (total_records_file2 - duplicates_file2):
            file2_records.append(f2_record)

    # 4. Inject exact duplicates as requested by your instructor
    for _ in range(duplicates_file1):
        file1_records.append(random.choice(file1_records))
        
    for _ in range(duplicates_file2):
        file2_records.append(random.choice(file2_records))

    # 5. Shuffle records so they are in random order
    random.shuffle(file1_records)
    random.shuffle(file2_records)

    # 6. Write to PS output files
    with open("FILE1_TRIP_DATA.ps", "w") as f1:
        for rec in file1_records:
            f1.write(rec + "\n")

    with open("FILE2_DRIVER_DATA.ps", "w") as f2:
        for rec in file2_records:
            f2.write(rec + "\n")

    print(f"Success! Created FILE1_TRIP_DATA.ps ({len(file1_records)} rows, 80 bytes each)")
    print(f"Success! Created FILE2_DRIVER_DATA.ps ({len(file2_records)} rows, 80 bytes each)")

# ==========================================
# RUN THE SCRIPT
# You can either leave this direct URL (no manual download needed!) 
# OR replace it with 'yellow_tripdata_2020-04.csv' if you downloaded it from Kaggle.
# ==========================================
DATA_SOURCE = "https://github.com/DataTalksClub/nyc-tlc-data/releases/download/yellow/yellow_tripdata_2021-01.csv.gz"

# Parameters: (Source, Total_F1, Dupes_F1, Total_F2, Dupes_F2)
process_nyc_data(DATA_SOURCE, 100, 10, 120, 15)