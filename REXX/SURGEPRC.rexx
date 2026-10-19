/* REXX */
/*===================================================================*/
/* REXX SCRIPT: SURGE PRICING ANALYTICS & DEMAND MONITOR             */
/* Reads sanitized FILE1 (Trip Data) from DD:TRIPIN                 */
/* 1. Aggregates ride demand per Pickup Zone (Cols 21-23).           */
/* 2. Flags zones exceeding demand threshold as SURGE ACTIVE.        */
/* 3. Computes dynamic surge multipliers (1.25x - 2.00x) & surge fare*/
/* 4. Outputs an 80-byte formatted report to DD:SURGEOUT.            */
/*===================================================================*/

"EXECIO * DISKR TRIPIN (STEM trips. FINIS"
if rc \= 0 then do
    say "ERROR: Failed to read from DD:TRIPIN. RC = " rc
    exit 8
end

say "Analyzing " trips.0 " ride records for surge pricing..."

/* Threshold definition */
SURGE_THRESHOLD_MED = 3
SURGE_THRESHOLD_HIGH = 5

zone_count. = 0
zone_list = ""
zone_total_fare. = 0

/* ----------------------------------------------------------------- */
/* 1. Aggregate demand by Pickup Zone ID (Cols 21-23)                */
/*    Fare is located at Cols 33-38 (format: 999.99)                 */
/* ----------------------------------------------------------------- */
do i = 1 to trips.0
    rec = trips.i
    zone_id = strip(substr(rec, 21, 3))
    fare    = strip(substr(rec, 33, 6))

    if datatype(zone_id, 'W') & zone_id \= '' then do
        if zone_count.zone_id = 0 then
            zone_list = zone_list zone_id

        zone_count.zone_id = zone_count.zone_id + 1
        if datatype(fare, 'NUM') then
            zone_total_fare.zone_id = format(zone_total_fare.zone_id + fare, , 2)
    end
end

/* ----------------------------------------------------------------- */
/* 2. Format Surge Analytics Report into 80-byte records             */
/* ----------------------------------------------------------------- */
rpt.1 = center("--- NYC TAXI RIDE ANALYTICS: SURGE PRICING REPORT ---", 80)
rpt.2 = center("DYNAMIC DEMAND MONITORING SYSTEM", 80)
rpt.3 = copies("-", 80)
rpt.4 = left("ZONE ID  | RIDE DEMAND | SURGE STATUS | MULTIPLIER | AVG BASE FARE", 80)
rpt.5 = copies("-", 80)

line_idx = 5
total_surging_zones = 0

do k = 1 to words(zone_list)
    zid = word(zone_list, k)
    demand = zone_count.zid
    tot_fare = zone_total_fare.zid

    if demand > 0 then
        avg_fare = format(tot_fare / demand, , 2)
    else
        avg_fare = 0.00

    /* Determine Surge Tier */
    if demand >= SURGE_THRESHOLD_HIGH then do
        status = "HIGH SURGE  "
        multiplier = "2.00x"
        total_surging_zones = total_surging_zones + 1
    end
    else if demand >= SURGE_THRESHOLD_MED then do
        status = "MODERATE    "
        multiplier = "1.35x"
        total_surging_zones = total_surging_zones + 1
    end
    else do
        status = "STANDARD    "
        multiplier = "1.00x"
    end

    line_idx = line_idx + 1
    rpt.line_idx = left("Zone " || right(zid, 3, '0') || " | " || right(demand, 11) || " | " || status || " | " || right(multiplier, 10) || " | $" || right(avg_fare, 12), 80)
end

line_idx = line_idx + 1
rpt.line_idx = copies("-", 80)
line_idx = line_idx + 1
rpt.line_idx = left("Total Unique Zones Monitored: " || words(zone_list), 80)
line_idx = line_idx + 1
rpt.line_idx = left("Total High-Demand Surging Zones: " || total_surging_zones, 80)
line_idx = line_idx + 1
rpt.line_idx = center("--- END OF REPORT ---", 80)

rpt.0 = line_idx

/* ----------------------------------------------------------------- */
/* 3. Write surge pricing analytics to DD:SURGEOUT                   */
/* ----------------------------------------------------------------- */
"EXECIO" rpt.0 "DISKW SURGEOUT (STEM rpt. FINIS"
if rc \= 0 then do
    say "ERROR: Failed to write to DD:SURGEOUT. RC = " rc
    exit 8
end

say "Surge pricing report generated successfully with " rpt.0 " lines."
exit 0
