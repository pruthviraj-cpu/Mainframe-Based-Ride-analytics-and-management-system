/* REXX */
/*===================================================================*/
/* ASSIGNMENT 3: REXX SCRIPT FOR FILE2 DRIVER DATA SANITIZATION      */
/* Reads driver telemetry file from INFILE, eliminates duplicates   */
/* based on Trip ID (Cols 21-28), sorts records ascending by Trip ID,*/
/* and writes unique sorted records to OUTFILE.                      */
/* Can be executed in batch (via IKJEFT01 / IRXJCL) or TSO/ISPF.     */
/*===================================================================*/

"EXECIO * DISKR INFILE (STEM in_records. FINIS"
if rc \= 0 then do
    say "ERROR: Failed to read INFILE. Return Code: " rc
    exit 8
end

say "Total records read from INFILE: " in_records.0

/* ----------------------------------------------------------------- */
/* 1. Deduplication using associative stem lookup by Trip ID         */
/*    Trip ID is located at columns 21 to 28 (length 8).             */
/* ----------------------------------------------------------------- */
seen. = 0
unique_count = 0

do i = 1 to in_records.0
    rec = in_records.i
    trip_id = strip(substr(rec, 21, 8))
    
    if seen.trip_id = 0 then do
        seen.trip_id = 1
        unique_count = unique_count + 1
        clean_records.unique_count = rec
        trip_ids.unique_count = trip_id
    end
end

clean_records.0 = unique_count
trip_ids.0 = unique_count

duplicates_removed = in_records.0 - unique_count
say "Unique records retained: " unique_count
say "Duplicates dropped:      " duplicates_removed

/* ----------------------------------------------------------------- */
/* 2. In-place QuickSort ascending on Trip ID (Cols 21-28)           */
/* ----------------------------------------------------------------- */
if clean_records.0 > 1 then
    call QuickSort 1, clean_records.0

/* ----------------------------------------------------------------- */
/* 3. Write sorted, deduplicated records to OUTFILE                  */
/* ----------------------------------------------------------------- */
"EXECIO" clean_records.0 "DISKW OUTFILE (STEM clean_records. FINIS"
if rc \= 0 then do
    say "ERROR: Failed to write to OUTFILE. Return Code: " rc
    exit 8
end

say "Successfully written " clean_records.0 " sorted records to OUTFILE."
exit 0

/* ================================================================= */
/* QuickSort Subroutine for REXX stem variables                      */
/* ================================================================= */
QuickSort: procedure expose clean_records. trip_ids.
    parse arg left, right
    if left >= right then return

    pivot = trip_ids.right
    partition_idx = left

    do j = left to right - 1
        if trip_ids.j <= pivot then do
            /* Swap j and partition_idx */
            temp_rec = clean_records.j
            temp_id  = trip_ids.j
            clean_records.j = clean_records.partition_idx
            trip_ids.j      = trip_ids.partition_idx
            clean_records.partition_idx = temp_rec
            trip_ids.partition_idx      = temp_id

            partition_idx = partition_idx + 1
        end
    end

    /* Move pivot to partition_idx */
    temp_rec = clean_records.right
    temp_id  = trip_ids.right
    clean_records.right = clean_records.partition_idx
    trip_ids.right      = trip_ids.partition_idx
    clean_records.partition_idx = temp_rec
    trip_ids.partition_idx      = temp_id

    call QuickSort left, partition_idx - 1
    call QuickSort partition_idx + 1, right
return
