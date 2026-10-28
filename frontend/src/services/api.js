/**
 * API Service Layer for Mainframe Ride Analytics
 * 
 * ============================================================================
 * HOW TO CONNECT TO FASTAPI BACKEND (WHEN READY):
 * 1. Start your FastAPI server on http://127.0.0.1:8000
 * 2. Set USE_MOCK = false below (or add VITE_USE_MOCK=false to your .env file)
 * 3. The React app will immediately start calling your real FastAPI endpoints!
 * ============================================================================
 */

import {
  MOCK_SUMMARY,
  MOCK_TRIPS,
  MOCK_DRIVERS,
  MOCK_HOURLY_ANALYTICS,
  MOCK_ZONE_ANALYTICS,
  MOCK_MAINFRAME_JOBS,
} from "../data/mockData";

// Backend endpoint base URL (FastAPI default)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

// Defaults to false so it connects directly to live FastAPI!
// If backend is ever offline, it gracefully falls back without crashing.
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

/**
 * Helper to fetch from FastAPI with timeout and automatic fallback to mock data
 */
async function fetchWithFallback(endpoint, mockData, options = {}) {
  if (USE_MOCK) {
    // Artificial small delay (120ms) to simulate smooth network response in mock mode
    await new Promise((resolve) => setTimeout(resolve, 120));
    return { data: mockData, source: "mock" };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API error ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();
    return { data: json, source: "live" };
  } catch (err) {
    console.warn(`[API] Endpoint ${endpoint} unreachable. Falling back to mock data.`, err);
    return { data: mockData, source: "mock_fallback", error: err.message };
  }
}

/**
 * 1. Fetch Executive KPI Summary
 * Expected Backend Endpoint: GET /api/summary
 */
export async function getDashboardSummary() {
  return fetchWithFallback("/summary", MOCK_SUMMARY);
}

/**
 * 2. Fetch Processed & Merged Trips
 * Expected Backend Endpoint: GET /api/trips?search=...&limit=...
 */
export async function getTrips(filters = {}) {
  const result = await fetchWithFallback("/trips", MOCK_TRIPS);
  let trips = [...result.data];

  // Client-side filtering when in mock mode
  if (filters.search) {
    const q = filters.search.toLowerCase();
    trips = trips.filter(
      (t) =>
        t.trip_id.toLowerCase().includes(q) ||
        t.driver_id.toLowerCase().includes(q) ||
        (t.pickup_zone && t.pickup_zone.toLowerCase().includes(q)) ||
        (t.dropoff_zone && t.dropoff_zone.toLowerCase().includes(q))
    );
  }

  return { ...result, data: trips };
}

/**
 * 3. Fetch Driver Fleet Performance
 * Expected Backend Endpoint: GET /api/drivers
 */
export async function getDrivers() {
  return fetchWithFallback("/drivers", MOCK_DRIVERS);
}

/**
 * 4. Fetch Hourly Volume & Revenue Breakdown
 * Expected Backend Endpoint: GET /api/analytics/hourly
 */
export async function getHourlyAnalytics() {
  return fetchWithFallback("/analytics/hourly", MOCK_HOURLY_ANALYTICS);
}

/**
 * 5. Fetch High-Demand Pickup/Dropoff Zones
 * Expected Backend Endpoint: GET /api/analytics/zones
 */
export async function getZoneAnalytics() {
  return fetchWithFallback("/analytics/zones", MOCK_ZONE_ANALYTICS);
}

/**
 * 6. Fetch Mainframe Batch Pipeline Status (JCL/REXX progress)
 * Expected Backend Endpoint: GET /api/mainframe/jobs
 */
export async function getMainframeJobs() {
  return fetchWithFallback("/mainframe/jobs", MOCK_MAINFRAME_JOBS);
}

/**
 * 7. Fetch Real-Time Mainframe Batch Spool Logs
 * Expected Backend Endpoint: GET /api/pipeline/logs
 */
export async function getPipelineLogs() {
  return fetchWithFallback("/pipeline/logs", {
    status: "success",
    logs: [
      "JOB04821 $HASP373 MASTERWF STARTED - CLASS A - IBM z/OS BATCH ENGINE",
      "[STEP 00] //CLEANUP EXEC PGM=IEFBR14 - RC=0000",
      "[STEP 01] //SORTF1 EXEC PGM=SORT (SORTF1.jcl) - 10 duplicate rows purged by SUM FIELDS=NONE - RC=0000",
      "[STEP 02] //REXXF2 EXEC PGM=IKJEFT01 (DEDUPF2.rexx) - 15 duplicates purged - QuickSort completed - RC=0000",
      "[STEP 03] //RUNCOBOL EXEC PGM=RIDEANLZ - Balance-Line match - 90 ledger rows - 0 fraud flags - RC=0000",
      "[STEP 04] //SURGSTEP EXEC PGM=IKJEFT01 (SURGEPRC.rexx) - Zone demand matrix generated - RC=0000",
      "[STEP 05] //BACKUP EXEC PGM=IEBGENER - Dataset backup archived - RC=0000",
      "JOB04821 $HASP395 MASTERWF ENDED - MAX RETURN CODE RC=0000 (SUCCESS)",
    ],
  });
}

/**
 * 8. Trigger Live Mainframe Pipeline Execution
 * Expected Backend Endpoint: POST /api/pipeline/run
 */
export async function triggerPipelineExecution() {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return {
      status: "success",
      message: "Mainframe batch pipeline executed successfully (Mock Emulation).",
      return_code: "RC=0000",
      source: "mock",
    };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/pipeline/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    return { ...data, source: "live" };
  } catch (err) {
    console.warn("[API] Trigger pipeline fallback to mock simulation:", err);
    return {
      status: "success",
      message: "Mainframe batch pipeline simulated (Offline mode).",
      return_code: "RC=0000",
      source: "mock_fallback",
    };
  }
}

/**
 * Check if the backend is currently alive
 * Expected Backend Endpoint: GET /api/health
 */
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}
