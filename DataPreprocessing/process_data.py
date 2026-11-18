"""
Mainframe Ride Analytics - Batch Processing Pipeline
=====================================================
Executes the core business logic directly on the IBM z/OS Mainframe:
  - Step 1: JCL SORT (SORTF1.jcl) - DFSORT on FILE1_TRIP_DATA
  - Step 2: REXX Deduplication (DEDUPF2.rexx) - IKJEFT01 stem dedup & QuickSort on FILE2
  - Step 3: Enterprise COBOL 85 (RIDEANLZ.cbl) - Balance-line merge, 75/25 split, fraud rules
  - Step 4: REXX Surge Pricing (SURGEPRC.rexx) - Real-time zone density calculation
  - Step 5: IEBGENER Archive - Automated copy triggered conditionally on RC=00

All analysis, sorting, deduplication, and financial computation are executed
by IBM Mainframe technologies, with FastAPI serving as the bridge to React.
"""

import os
from DataPreprocessing.mainframe_bridge import (
    run_mainframe_pipeline,
    get_mainframe_status,
    FILE1_RAW,
    FILE2_RAW,
    FILE1_SORTED,
    FILE2_SORTED,
    FILE3_LEDGER,
    FILE4_FRAUD,
    FILE5_SUMMARY,
    FILE_SURGE,
    FILE_LOGS,
)


def run_batch_pipeline(
    file1_path=None,
    file2_path=None,
    speed_threshold: float = 85.0,
    min_fare_threshold: float = 5.0,
    min_fare_dist: float = 10.0,
):
    """
    Triggers the real mainframe batch processing pipeline on IBM z/OS.
    All deduplication, sorting, financial ledger calculation, fraud analysis,
    and surge pricing are executed by DFSORT, TSO/E REXX, and Enterprise COBOL.
    """
    execution_info = run_mainframe_pipeline(file1_path=file1_path, file2_path=file2_path)
    return execution_info.get("logs", [])


if __name__ == "__main__":
    run_batch_pipeline()
