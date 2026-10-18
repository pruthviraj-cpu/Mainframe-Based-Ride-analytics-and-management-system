# Mainframe Ride Analytics: Data Preprocessing

This module serves as the ETL (Extract, Transform, Load) pipeline for the Mainframe-Based Ride Analytics system. It downloads real-world NYC Taxi data and formats it into strict, 80-byte Physical Sequential (PS) files required by legacy IBM Mainframe systems (z/OS).

## Prerequisites

This project uses [uv](https://github.com/astral-sh/uv), an extremely fast Python package and project manager written in Rust. You do not need to install Python manually; `uv` handles it.

### 1. Install `uv`
**Mac / Linux:**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows:**
```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

## Setup Instructions

Because this project already contains a `pyproject.toml` and a `uv.lock` file, setting up your environment is instantaneous.

1. **Navigate to the directory:**
   ```bash
   cd DataPreprocessing
   ```

2. **Sync the environment:**
   This command reads the `uv.lock` file, creates a hidden `.venv` virtual environment, and installs exact versions of the dependencies (like `pandas`).
   ```bash
   uv sync
   ```

## Running the ETL Pipeline

To process the data and generate the mainframe files, run the main Python script using `uv`. 

*(Note: Depending on which file contains the ETL logic, run either `main.py` or `script.py`)*
```bash
uv run script.py
```

### What the script does:
1. Streams real NYC TLC Yellow Taxi data directly via an official GitHub release link (no manual dataset downloads required).
2. Filters out anomalies (zero distances, negative fares).
3. Randomly samples the exact number of unique rides needed.
4. Generates two strict 80-byte text files (`.ps` format) and artificially injects the exact number of duplicate records required for mainframe JCL/REXX sorting assignments.

## Output Files & Data Layout

The script generates two files ready to be uploaded to the Mainframe (e.g., via Zowe or FTP). These are not standard CSVs; they are positional text files. **Do not format them or open them in Excel.**

### 1. `FILE1_TRIP_DATA.ps`
Contains the financial and location data for the trips.
*   **Col 01-12:** Timestamp (`YYYYMMDDHHMM`)
*   **Col 13-20:** Trip ID **[PRIMARY KEY]** (e.g., `TR000001`)
*   **Col 21-23:** Pickup Zone ID
*   **Col 24-26:** Dropoff Zone ID
*   **Col 27-32:** Distance in Miles (e.g., `012.50`)
*   **Col 33-38:** Total Fare in USD (e.g., `045.50`)
*   **Col 39-80:** Blank spaces (Filler)

### 2. `FILE2_DRIVER_DATA.ps`
Contains driver telemetry and trip duration.
*   **Col 01-08:** Driver ID (e.g., `DRV12345`)
*   **Col 09-20:** Blank spaces (Filler)
*   **Col 21-28:** Trip ID **[PRIMARY KEY]** (e.g., `TR000001`)
*   **Col 29-33:** Trip Duration (e.g., `015MN`)
*   **Col 34-80:** Blank spaces (Filler)

## Next Steps

Once the `.ps` files are generated, use the Zowe Explorer extension (visible in your IDE) or FTP to allocate these datasets on the mainframe (LRECL=80, RECFM=FB) and upload the contents. From there, they are ready for JCL `SORT` and REXX deduplication.