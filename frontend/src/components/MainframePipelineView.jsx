import React from 'react';
import { Layers, Database, ArrowRight, CheckCircle2, Clock, Terminal, Cpu } from 'lucide-react';

export default function MainframePipelineView({ jobs, summary }) {
  const steps = [
    {
      num: '01',
      name: 'Python Preprocessing (ETL)',
      owner: 'Existing (script.py)',
      status: 'COMPLETED',
      badgeClass: 'badge-success',
      icon: Database,
      details: [
        'Streams 5,000 real NYC Yellow Taxi rows.',
        'Cleans zero distances and invalid fares.',
        'Formats strictly into 80-byte sequential (.ps) files.',
        'Injects deliberate duplicates for mainframe sorting practice.',
      ],
      output: 'FILE1_TRIP_DATA.ps & FILE2_DRIVER_DATA.ps',
    },
    {
      num: '02',
      name: 'Mainframe JCL SORT (Deduplication)',
      owner: 'Pending (Groupmate Task)',
      status: 'AWAITING_JCL',
      badgeClass: 'badge-warning',
      icon: Terminal,
      details: [
        'Reads 80-byte sequential datasets on z/OS.',
        'Sorts records by Primary Key TRIP_ID.',
        'Uses DFSORT / SYNCSORT (SUM FIELDS=NONE) to strip duplicate rows.',
        'Outputs sorted, clean datasets for merge step.',
      ],
      output: 'Deduplicated Sequential Files',
    },
    {
      num: '03',
      name: 'REXX / COBOL Aggregator & Join',
      owner: 'Pending (Groupmate Task)',
      status: 'AWAITING_REXX',
      badgeClass: 'badge-warning',
      icon: Cpu,
      details: [
        'Reads deduplicated FILE1 (Trip) and FILE2 (Driver).',
        'Matches Column 13-20 with Column 21-28 on TRIP_ID.',
        'Computes totals, driver averages, and route durations.',
        'Outputs unified clean output stream.',
      ],
      output: 'Clean Merged Analytical Dataset',
    },
    {
      num: '04',
      name: 'FastAPI Backend & React Dashboard',
      owner: 'Frontend Ready (Awaiting Live API)',
      status: 'READY_TO_CONNECT',
      badgeClass: 'badge-primary',
      icon: Layers,
      details: [
        'FastAPI serves REST endpoints (/api/summary, /api/trips, /api/drivers).',
        'Currently running in mock mode with clean dummy datasets.',
        'Simply toggle USE_MOCK=false in src/services/api.js when backend launches!',
      ],
      output: 'Interactive Web Operations Dashboard',
    },
  ];

  return (
    <div className="pipeline-view-container">
      <div className="section-intro">
        <div>
          <h2 className="section-title">End-to-End System Integration Flow</h2>
          <p className="section-desc">
            Visual map showing how the Python preprocessor, Mainframe JCL/REXX batch jobs, and this React dashboard connect.
          </p>
        </div>
        <div className="system-pill">
          <Terminal size={14} />
          <span>Target Architecture: z/OS Mainframe Batch ➔ FastAPI ➔ React</span>
        </div>
      </div>

      <div className="pipeline-steps-grid">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={s.num} className="card pipeline-step-card">
              <div className="step-card-header">
                <div className="step-number-tag">{s.num}</div>
                <span className={`badge ${s.badgeClass}`}>
                  {s.status === 'COMPLETED' ? (
                    <CheckCircle2 size={12} />
                  ) : (
                    <Clock size={12} />
                  )}
                  {s.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="step-card-title-row">
                <div className="step-icon-box">
                  <Icon size={18} />
                </div>
                <div>
                  <h3 className="step-name">{s.name}</h3>
                  <span className="step-owner text-muted">{s.owner}</span>
                </div>
              </div>

              <ul className="step-details-list">
                {s.details.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>

              <div className="step-card-footer">
                <span className="text-muted footer-label">Artifact / Result:</span>
                <span className="mono footer-artifact">{s.output}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
