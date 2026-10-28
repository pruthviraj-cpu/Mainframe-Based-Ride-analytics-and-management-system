import React from 'react';
import {
  Layers,
  Database,
  ArrowRight,
  CheckCircle2,
  Clock,
  Terminal,
  Cpu,
  FileCode2,
  TrendingUp,
  ShieldCheck,
  Play,
} from 'lucide-react';

export default function MainframePipelineView({ jobs, summary, onOpenConsole }) {
  const steps = [
    {
      num: '01',
      name: 'Python Preprocessing (ETL)',
      owner: 'DataPreprocessing/script.py',
      status: 'COMPLETED',
      badgeClass: 'badge-success',
      icon: Database,
      details: [
        'Streams real NYC TLC Yellow Taxi records directly from GitHub.',
        'Cleans zero distances and non-positive fares.',
        'Formats strictly into fixed 80-byte sequential (.ps) files.',
        'Injects deliberate duplicates for mainframe deduplication testing.',
      ],
      output: 'FILE1_TRIP_DATA.ps & FILE2_DRIVER_DATA.ps (80b)',
    },
    {
      num: '02',
      name: 'JCL DFSORT Deduplication (Assignment 1)',
      owner: 'JCL/SORTF1.jcl',
      status: 'COMPLETED',
      badgeClass: 'badge-success',
      icon: Terminal,
      details: [
        'Executes PGM=SORT on DD:SORTIN (FILE1).',
        'Sorts ascending on Trip ID primary key (Cols 13-20, CH, A).',
        'Applies SUM FIELDS=NONE to strip duplicate rows.',
        'Produces clean sorted sequential dataset for merge stage.',
      ],
      output: 'FILE1.SORTED (LRECL=80, RECFM=FB)',
    },
    {
      num: '03',
      name: 'REXX QuickSort & Deduplication (Assignment 3)',
      owner: 'REXX/DEDUPF2.rexx',
      status: 'COMPLETED',
      badgeClass: 'badge-success',
      icon: Cpu,
      details: [
        'Executed via IKJEFT01 / IRXJCL batch runner.',
        'Uses associative stem lookup (seen.trip_id) to discard duplicate driver lines.',
        'Implements in-place QuickSort ascending on Trip ID (Cols 21-28).',
        'Ensures both input files match sorting order for Balance-Line.',
      ],
      output: 'FILE2.SORTED (LRECL=80, RECFM=FB)',
    },
    {
      num: '04',
      name: 'COBOL Balance-Line Merge & Fraud (Assignment 2)',
      owner: 'COBOL/RIDEANLZ.cbl',
      status: 'COMPLETED',
      badgeClass: 'badge-success',
      icon: FileCode2,
      details: [
        'Single-pass O(N+M) Balance-Line sequential file match.',
        'Computes 75% Driver Payout and 25% Platform Commission.',
        'Evaluates Implied Speed (>85 MPH) and Low-Fare distance anomalies.',
        'Routes clean trips to FILE3 and quarantined anomalies to FILE4.',
        'Maintains 265-entry OCCURS array to advise driver allocation.',
      ],
      output: 'FILE3_MASTER_LEDGER.ps & FILE4_FRAUD_REPORT.ps',
    },
    {
      num: '05',
      name: 'Dynamic Surge Pricing Monitor',
      owner: 'REXX/SURGEPRC.rexx',
      status: 'COMPLETED',
      badgeClass: 'badge-success',
      icon: TrendingUp,
      details: [
        'Aggregates demand density per TLC Pickup Zone ID.',
        'Applies dynamic 1.35x moderate and 2.00x high surge multipliers.',
        'Operates independently of base fare COBOL calculations.',
        'Outputs formatted 80-byte surge demand report.',
      ],
      output: 'RIDE_SURGE_REPORT.txt',
    },
    {
      num: '06',
      name: 'Master Workflow & Safeguard Archive (Assignment 4)',
      owner: 'JCL/MASTERWF.jcl',
      status: 'COMPLETED',
      badgeClass: 'badge-success',
      icon: ShieldCheck,
      details: [
        'Automated conditional pipeline evaluating return codes (IF RC = 00).',
        'Executes Step 00 IEFBR14 scratch housekeeping.',
        'Triggers IEBGENER to copy and archive FILE5 summary report.',
        'Executes critical failure notification if any prior step fails.',
      ],
      output: 'BACKUP.REPORT & Full JCL Pipeline Audit',
    },
  ];

  return (
    <div className="pipeline-view-container">
      <div className="section-intro">
        <div>
          <h2 className="section-title">End-to-End Mainframe Batch Pipeline Flow</h2>
          <p className="section-desc">
            Architectural map illustrating how Python ETL, JCL DFSORT, REXX Deduplication, and COBOL Balance-Line batch jobs interact.
          </p>
        </div>
        <div className="header-action-group">
          {onOpenConsole && (
            <button
              type="button"
              className="btn-launch-terminal"
              onClick={onOpenConsole}
              title="Open real-time interactive terminal console"
            >
              <Terminal size={14} />
              <span>Open Live Console Spool</span>
            </button>
          )}
          <div className="system-pill">
            <CheckCircle2 size={13} className="text-success" />
            <span>z/OS Batch Architecture: RC=0000</span>
          </div>
        </div>
      </div>

      <div className="pipeline-steps-grid">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.num} className="card pipeline-step-card">
              <div className="step-card-header">
                <div className="step-number-tag">{s.num}</div>
                <span className={`badge ${s.badgeClass}`}>
                  <CheckCircle2 size={12} />
                  {s.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="step-card-title-row">
                <div className="step-icon-box">
                  <Icon size={18} />
                </div>
                <div>
                  <h3 className="step-name">{s.name}</h3>
                  <span className="step-owner mono text-muted">{s.owner}</span>
                </div>
              </div>

              <ul className="step-details-list">
                {s.details.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>

              <div className="step-card-footer">
                <span className="text-muted footer-label">Dataset / Artifact:</span>
                <span className="mono footer-artifact">{s.output}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
