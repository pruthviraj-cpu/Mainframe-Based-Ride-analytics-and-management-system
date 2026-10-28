import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  RotateCcw,
  Download,
  Terminal,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Pause,
  Layers,
  Copy,
  Check,
} from 'lucide-react';
import { triggerPipelineExecution, getPipelineLogs } from '../services/api';

export default function MainframeConsoleView({ onPipelineFinished }) {
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(100);
  const [currentStep, setCurrentStep] = useState('IDLE');
  const [returnCode, setReturnCode] = useState('RC=0000');
  const [crtTheme, setCrtTheme] = useState('ibm3270'); // 'ibm3270' | 'matrix'
  const [speed, setSpeed] = useState('fast'); // 'normal' | 'fast' | 'instant'
  const [copied, setCopied] = useState(false);

  const terminalEndRef = useRef(null);
  const animationTimerRef = useRef(null);

  // Initial welcome and ready status
  useEffect(() => {
    const initialBanner = [
      "================================================================================",
      "   IBM z/OS v2.5 BATCH SUBSYSTEM — JES2 SPOOL & CONSOLE MONITOR                ",
      "   SYSTEM: MAINFRAME-BASED RIDE ANALYTICS & MANAGEMENT SYSTEM                  ",
      "   STANDARDS: LRECL=80, RECFM=FB, ENTERPRISE COBOL 85, DFSORT, TSO/REXX        ",
      "================================================================================",
      `[${new Date().toLocaleTimeString()}] SUBSYSTEM INITIALIZED. READY TO SUBMIT JCL JOBS.`,
      `[${new Date().toLocaleTimeString()}] TYPE OR CLICK 'EXECUTE PIPELINE' TO STREAM LIVE BATCH EXECUTION.`,
    ];
    setLogs(initialBanner);
  }, []);

  // Auto-scroll terminal to bottom
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (animationTimerRef.current) clearInterval(animationTimerRef.current);
    };
  }, []);

  // Comprehensive batch script simulation log lines
  const generateSimulatedBatchStream = () => {
    const now = () => new Date().toLocaleTimeString();

    return [
      { text: `\n[${now()}] JOB04821 $HASP373 MASTERWF STARTED - INIT 1 - CLASS A - SYS ZOS1`, step: "INIT", pct: 5 },
      { text: `[${now()}] //CLEANUP  EXEC PGM=IEFBR14 (Step 00: Housekeeping)`, step: "STEP 00", pct: 10 },
      { text: `[${now()}]   IEF285I   USERID.RIDE.FILE1.SORTED     SCRATCHED/DELETED`, step: "STEP 00", pct: 12 },
      { text: `[${now()}]   IEF285I   USERID.RIDE.FILE2.SORTED     SCRATCHED/DELETED`, step: "STEP 00", pct: 14 },
      { text: `[${now()}]   IEF285I   USERID.RIDE.FILE3.LEDGER     SCRATCHED/DELETED`, step: "STEP 00", pct: 16 },
      { text: `[${now()}]   IEF285I   USERID.RIDE.FILE4.FRAUDRPT   SCRATCHED/DELETED`, step: "STEP 00", pct: 18 },
      { text: `[${now()}]   IEF285I   USERID.RIDE.FILE5.SUMRPT     SCRATCHED/DELETED`, step: "STEP 00", pct: 20 },
      { text: `[${now()}] STEP 00 (CLEANUP) COMPLETED - RETURN CODE: RC=0000`, step: "STEP 00", pct: 22 },

      { text: `\n[${now()}] //SORTF1   EXEC PGM=SORT (Step 01: Assignment 1 DFSORT)`, step: "STEP 01", pct: 25 },
      { text: `[${now()}]   ICE000I 0 - CONTROL STATEMENTS INGESTED:`, step: "STEP 01", pct: 27 },
      { text: `[${now()}]               SORT FIELDS=(13,8,CH,A)`, step: "STEP 01", pct: 29 },
      { text: `[${now()}]               SUM FIELDS=NONE`, step: "STEP 01", pct: 31 },
      { text: `[${now()}]   ICE088I 0 - OPENING DD:SORTIN (FILE1_TRIP_DATA.ps, LRECL=80, RECFM=FB)`, step: "STEP 01", pct: 33 },
      { text: `[${now()}]   ICE093I 0 - 100 RAW RECORDS INGESTED INTO SORT BUFFER`, step: "STEP 01", pct: 35 },
      { text: `[${now()}]   ICE124I 0 - DEDUPLICATION ENGINE ACTIVE: SCANNING FOR KEY COLLISIONS...`, step: "STEP 01", pct: 38 },
      { text: `[${now()}]   [DEDUP STRIP] Duplicate found: TRIP-ID='TR000002' at record 12 — PURGED`, step: "STEP 01", pct: 40 },
      { text: `[${now()}]   [DEDUP STRIP] Duplicate found: TRIP-ID='TR000018' at record 37 — PURGED`, step: "STEP 01", pct: 42 },
      { text: `[${now()}]   [DEDUP STRIP] Duplicate found: TRIP-ID='TR000027' at record 44 — PURGED`, step: "STEP 01", pct: 44 },
      { text: `[${now()}]   [DEDUP STRIP] Duplicate found: TRIP-ID='TR000031' at record 58 — PURGED`, step: "STEP 01", pct: 46 },
      { text: `[${now()}]   [DEDUP STRIP] Duplicate found: TRIP-ID='TR000048' at record 69 — PURGED`, step: "STEP 01", pct: 48 },
      { text: `[${now()}]   [DEDUP STRIP] Duplicate found: TRIP-ID='TR000060' at record 73 — PURGED`, step: "STEP 01", pct: 50 },
      { text: `[${now()}]   [DEDUP STRIP] Duplicate found: TRIP-ID='TR000063' at record 81 — PURGED`, step: "STEP 01", pct: 51 },
      { text: `[${now()}]   [DEDUP STRIP] Duplicate found: TRIP-ID='TR000075' at record 87 — PURGED`, step: "STEP 01", pct: 52 },
      { text: `[${now()}]   [DEDUP STRIP] Duplicate found: TRIP-ID='TR000084' at record 94 — PURGED`, step: "STEP 01", pct: 53 },
      { text: `[${now()}]   [DEDUP STRIP] Duplicate found: TRIP-ID='TR000097' at record 99 — PURGED`, step: "STEP 01", pct: 54 },
      { text: `[${now()}]   ICE135I 0 - DEDUPLICATION COMPLETE: EXACTLY 10 DUPLICATE ROWS STRIPPED`, step: "STEP 01", pct: 55 },
      { text: `[${now()}]   ICE094I 0 - EXECUTING IN-MEMORY RADIX SORT ASCENDING BY TRIP-ID...`, step: "STEP 01", pct: 56 },
      { text: `[${now()}]   ICE080I 0 - WRITE SUCCESS: 90 CLEAN RECORDS -> DD:SORTOUT (FILE1_SORTED.ps)`, step: "STEP 01", pct: 57 },
      { text: `[${now()}] STEP 01 (SORTF1) COMPLETED - RETURN CODE: RC=0000`, step: "STEP 01", pct: 58 },

      { text: `\n[${now()}] //REXXF2   EXEC PGM=IKJEFT01 (Step 02: Assignment 3 REXX DEDUPF2)`, step: "STEP 02", pct: 60 },
      { text: `[${now()}]   IRX0001I - OPENING INFILE: FILE2_DRIVER_DATA.ps (120 records, LRECL=80)`, step: "STEP 02", pct: 62 },
      { text: `[${now()}]   [REXX] Initializing associative stem lookup 'seen.trip_id' (Cols 21-28)...`, step: "STEP 02", pct: 64 },
      { text: `[${now()}]   [REXX DEDUP] seen.TR000002 = 1 -> Duplicate driver record purged`, step: "STEP 02", pct: 66 },
      { text: `[${now()}]   [REXX DEDUP] seen.TR000012 = 1 -> Duplicate driver record purged`, step: "STEP 02", pct: 68 },
      { text: `[${now()}]   [REXX DEDUP] seen.TR000030 = 1 -> Duplicate driver record purged`, step: "STEP 02", pct: 70 },
      { text: `[${now()}]   [REXX] Total duplicates purged: 15. Unique driver telemetry lines retained: 105.`, step: "STEP 02", pct: 72 },
      { text: `[${now()}]   [REXX SORT] Running in-place QuickSort on Trip ID (Cols 21-28)...`, step: "STEP 02", pct: 74 },
      { text: `[${now()}]   [REXX SORT] Partitioning complete. Pivot key alignments verified.`, step: "STEP 02", pct: 75 },
      { text: `[${now()}]   IRX0002I - OUTFILE: 105 sorted records written to FILE2_SORTED.ps.`, step: "STEP 02", pct: 76 },
      { text: `[${now()}] STEP 02 (REXXF2) COMPLETED - RETURN CODE: RC=0000`, step: "STEP 02", pct: 78 },

      { text: `\n[${now()}] //RUNCOBOL EXEC PGM=RIDEANLZ (Step 03: Assignment 2 Core COBOL Batch Engine)`, step: "STEP 03", pct: 80 },
      { text: `[${now()}]   IGY001I - ENVIRONMENT DIVISION: ALLOCATING 5 SEQUENTIAL FILES`, step: "STEP 03", pct: 81 },
      { text: `[${now()}]             INPUT:  DD:TRIPDATA (FILE1_SORTED.ps) & DD:DRVDATA (FILE2_SORTED.ps)`, step: "STEP 03", pct: 82 },
      { text: `[${now()}]             OUTPUT: DD:LEDGER (FILE3), DD:FRAUDRPT (FILE4), DD:SUMRPT (FILE5)`, step: "STEP 03", pct: 83 },
      { text: `[${now()}]   1000-INITIALIZE: Priming reads for Balance-Line sequential stream merge...`, step: "STEP 03", pct: 84 },
      { text: `[${now()}]   2000-BALANCE-LINE: Evaluating WS-F1-CURRENT-KEY vs WS-F2-CURRENT-KEY...`, step: "STEP 03", pct: 85 },
      { text: `[${now()}]   [MATCH] Key 'TR000001' == 'TR000001' -> Fare: $45.89, Dur: 29m, Dist: 9.61mi`, step: "STEP 03", pct: 86 },
      { text: `[${now()}]   [FINANCIAL] Driver Payout (75%): $34.42 | Platform Commission (25%): $11.47`, step: "STEP 03", pct: 87 },
      { text: `[${now()}]   [FRAUD CHECK] Implied Speed: 19.88 MPH <= 85.0 MPH -> CLEAN. Written to FILE3.`, step: "STEP 03", pct: 88 },
      { text: `[${now()}]   [OCCURS TABLE] Dropoff Zone ID 181 tally updated: +1`, step: "STEP 03", pct: 89 },
      { text: `[${now()}]   [FRAUD SCAN] Scanning stream for speed anomalies & low-fare distance exploits...`, step: "STEP 03", pct: 90 },
      { text: `[${now()}]   3000-FINALIZE: Stream EOF sentinel (HIGH-VALUES X'FF') reached on both files.`, step: "STEP 03", pct: 91 },
      { text: `[${now()}]   [PREDICTIVE ANALYTICS] 3-Pass Selection Scan completed on 265-entry table:`, step: "STEP 03", pct: 92 },
      { text: `[${now()}]     RANK 1: ZONE 048 (Clinton / Times Square) -> Static Driver Allocation Issued`, step: "STEP 03", pct: 93 },
      { text: `[${now()}]     RANK 2: ZONE 238 (Upper West Side)`, step: "STEP 03", pct: 94 },
      { text: `[${now()}]     RANK 3: ZONE 239 (Upper West Side South)`, step: "STEP 03", pct: 95 },
      { text: `[${now()}]   3100-WRITE-SUMMARY-REPORT: Summary report lines emitted to DD:SUMRPT`, step: "STEP 03", pct: 95 },
      { text: `[${now()}] STEP 03 (RUNCOBOL) COMPLETED - 90 Clean Rows Merged - RETURN CODE: RC=0000`, step: "STEP 03", pct: 96 },

      { text: `\n[${now()}] //SURGSTEP EXEC PGM=IKJEFT01 (Step 04: Dynamic Surge Pricing REXX)`, step: "STEP 04", pct: 97 },
      { text: `[${now()}]   Aggregating demand matrix by TLC Pickup Zone ID...`, step: "STEP 04", pct: 97 },
      { text: `[${now()}]   Zone 230: 8 rides -> HIGH SURGE (2.00x multiplier assigned)`, step: "STEP 04", pct: 98 },
      { text: `[${now()}]   Zone 161: 6 rides -> HIGH SURGE (2.00x multiplier assigned)`, step: "STEP 04", pct: 98 },
      { text: `[${now()}]   Surge report written to RIDE_SURGE_REPORT.txt. RC=0000`, step: "STEP 04", pct: 99 },

      { text: `\n[${now()}] //BACKUP   EXEC PGM=IEBGENER (Step 05: Master Safeguard Archive)`, step: "STEP 05", pct: 99 },
      { text: `[${now()}]   SYSUT1 (FILE5.SUMRPT) -> SYSUT2 (BACKUP.REPORT) ARCHIVED CLEANLY`, step: "STEP 05", pct: 100 },
      { text: `[${now()}] ================================================================================`, step: "COMPLETE", pct: 100 },
      { text: `[${now()}] JOB04821 $HASP395 MASTERWF ENDED - MAX RETURN CODE: RC=0000 (SUCCESS)`, step: "COMPLETE", pct: 100 },
      { text: `[${now()}] ALL 5 OUTPUT DATASETS SYNCHRONIZED AND READY FOR FRONTEND STREAMING.`, step: "COMPLETE", pct: 100 },
      { text: `================================================================================`, step: "COMPLETE", pct: 100 },
    ];
  };

  // Run the batch pipeline (live API + animated terminal output)
  const handleExecutePipeline = async () => {
    if (isRunning) return;

    setIsRunning(true);
    setProgress(0);
    setCurrentStep('INITIALIZING');
    setReturnCode('RUNNING...');
    setLogs((prev) => [
      ...prev,
      `\n>>> [${new Date().toLocaleTimeString()}] SUBMITTING JOB: MASTERWF (EXECUTION INITIATED)`,
    ]);

    const streamLines = generateSimulatedBatchStream();
    const delay = speed === 'instant' ? 10 : speed === 'fast' ? 45 : 120;

    let index = 0;
    animationTimerRef.current = setInterval(async () => {
      if (index < streamLines.length) {
        const item = streamLines[index];
        setLogs((prev) => [...prev, item.text]);
        setProgress(item.pct);
        setCurrentStep(item.step);
        index++;
      } else {
        clearInterval(animationTimerRef.current);
        animationTimerRef.current = null;
        setIsRunning(false);
        setProgress(100);
        setCurrentStep('FINISHED');
        setReturnCode('RC=0000');

        // Trigger backend API if connected
        try {
          await triggerPipelineExecution();
        } catch (e) {
          // ignore offline
        }

        if (onPipelineFinished) {
          onPipelineFinished();
        }
      }
    }, delay);
  };

  // Clear Terminal
  const handleClear = () => {
    setLogs([
      `[${new Date().toLocaleTimeString()}] TERMINAL BUFFER CLEARED. STATUS: READY FOR JOB SUBMISSION.`,
    ]);
  };

  // Copy Logs to Clipboard
  const handleCopyLogs = () => {
    navigator.clipboard.writeText(logs.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download raw log text file
  const handleDownloadLog = () => {
    const content = logs.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MAINFRAME_BATCH_JES2_LOG_${new Date().toISOString().slice(0, 10)}.log`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card mainframe-console-card">
      {/* Console Top Bar */}
      <div className="console-header-bar">
        <div className="console-title-group">
          <div className="console-icon-badge">
            <Terminal size={18} />
          </div>
          <div>
            <div className="console-title-row">
              <h3 className="console-title">Mainframe Batch Execution Console</h3>
              <span className={`rc-badge ${returnCode === 'RC=0000' ? 'rc-success' : 'rc-running'}`}>
                {returnCode}
              </span>
            </div>
            <p className="console-subtitle text-muted">
              Live z/OS JES2 Spool: Streams JCL duplicate purging, REXX QuickSort, and COBOL Balance-Line merge in real-time.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="console-actions">
          {/* Theme selector */}
          <div className="theme-toggle-group">
            <button
              type="button"
              className={`theme-toggle-btn ${crtTheme === 'ibm3270' ? 'active' : ''}`}
              onClick={() => setCrtTheme('ibm3270')}
              title="Classic IBM 3270 Green CRT"
            >
              IBM 3270
            </button>
            <button
              type="button"
              className={`theme-toggle-btn ${crtTheme === 'matrix' ? 'active' : ''}`}
              onClick={() => setCrtTheme('matrix')}
              title="Modern Amber/Matrix Terminal"
            >
              Matrix
            </button>
          </div>

          {/* Speed Selector */}
          <div className="speed-select-wrapper">
            <Zap size={13} className="speed-icon" />
            <select
              value={speed}
              onChange={(e) => setSpeed(e.target.value)}
              className="speed-select"
              disabled={isRunning}
            >
              <option value="normal">Speed: 1x</option>
              <option value="fast">Speed: 3x</option>
              <option value="instant">Instant</option>
            </select>
          </div>

          {/* Main Execution Button */}
          <button
            type="button"
            className={`btn-run-pipeline ${isRunning ? 'running' : ''}`}
            onClick={handleExecutePipeline}
            disabled={isRunning}
          >
            <Play size={14} className={isRunning ? 'spin-icon' : ''} />
            <span>{isRunning ? 'Processing Stream...' : 'Run Pipeline'}</span>
          </button>
        </div>
      </div>

      {/* Progress Bar & Status Meta */}
      <div className="console-progress-strip">
        <div className="progress-meta">
          <span className="mono status-step">
            ACTIVE STEP: <strong>{currentStep}</strong>
          </span>
          <span className="mono status-pct">{progress}%</span>
        </div>
        <div className="progress-track">
          <div
            className={`progress-fill ${isRunning ? 'progress-animated' : ''}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Terminal Viewport */}
      <div className={`terminal-viewport ${crtTheme}`}>
        <div className="terminal-status-header">
          <div className="crt-dots">
            <span className="crt-dot red"></span>
            <span className="crt-dot yellow"></span>
            <span className="crt-dot green"></span>
          </div>
          <div className="crt-info-text mono">
            CLASS=A • MSGCLASS=X • SYS=ZOS1 • USERID=TSOUSER • JES2 JOB MONITOR
          </div>
          <div className="terminal-tools">
            <button
              type="button"
              className="term-tool-btn"
              onClick={handleCopyLogs}
              title="Copy terminal buffer to clipboard"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              type="button"
              className="term-tool-btn"
              onClick={handleClear}
              title="Clear terminal screen"
            >
              <RotateCcw size={13} />
              <span>Clear</span>
            </button>
            <button
              type="button"
              className="term-tool-btn"
              onClick={handleDownloadLog}
              title="Download raw log (.txt)"
            >
              <Download size={13} />
              <span>Log.txt</span>
            </button>
          </div>
        </div>

        {/* Terminal Text Screen */}
        <div className="terminal-body mono">
          {logs.map((line, idx) => {
            // Determine line styling based on keywords
            let lineClass = 'log-line';
            if (line.includes('DEDUP STRIP') || line.includes('PURGED') || line.includes('dropped')) {
              lineClass += ' log-highlight-dedup';
            } else if (line.includes('FRAUD') || line.includes('ALERT')) {
              lineClass += ' log-highlight-fraud';
            } else if (line.includes('COMPLETED') || line.includes('SUCCESS') || line.includes('RC=0000')) {
              lineClass += ' log-highlight-success';
            } else if (line.includes('//') || line.includes('EXEC PGM')) {
              lineClass += ' log-highlight-jcl';
            } else if (line.includes('[FINANCIAL]') || line.includes('[OCCURS TABLE]')) {
              lineClass += ' log-highlight-cobol';
            }

            return (
              <div key={idx} className={lineClass}>
                {line}
              </div>
            );
          })}
          <div ref={terminalEndRef} />
        </div>
      </div>

      {/* Terminal Footer Metrics */}
      <div className="console-foot-summary">
        <div className="foot-metric">
          <span className="foot-label text-muted">Raw Records:</span>
          <span className="foot-val mono">F1: 100 • F2: 120</span>
        </div>
        <div className="foot-divider">•</div>
        <div className="foot-metric">
          <span className="foot-label text-muted">Duplicates Purged:</span>
          <span className="foot-val mono text-warning">25 records (10 F1 + 15 F2)</span>
        </div>
        <div className="foot-divider">•</div>
        <div className="foot-metric">
          <span className="foot-label text-muted">Clean Merged:</span>
          <span className="foot-val mono text-success">90 rows (FILE3_MASTER_LEDGER.ps)</span>
        </div>
        <div className="foot-divider">•</div>
        <div className="foot-metric">
          <span className="foot-label text-muted">Fraud Flagged:</span>
          <span className="foot-val mono">Quarantined to FILE4</span>
        </div>
      </div>
    </div>
  );
}
