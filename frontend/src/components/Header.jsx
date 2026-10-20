import React, { useState } from 'react';
import { Server, RefreshCw, Terminal, CheckCircle2, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { API_BASE_URL, USE_MOCK } from '../services/api';

export default function Header({ summary, onRefresh, isRefreshing, apiSource }) {
  const [showConnectionInfo, setShowConnectionInfo] = useState(false);

  return (
    <header className="header-wrapper">
      <div className="header-content">
        {/* Left Branding */}
        <div className="brand-section">
          <div className="brand-icon">
            <Terminal size={20} strokeWidth={2.2} />
          </div>
          <div>
            <div className="brand-title-row">
              <h1 className="brand-title">Mainframe Ride Analytics</h1>
              <span className="badge badge-mainframe">z/OS BATCH</span>
            </div>
            <p className="brand-subtitle">
              IBM Mainframe Fixed-Width Ingestion & Fleet Operations Console
            </p>
          </div>
        </div>

        {/* Right Status & Controls */}
        <div className="header-actions">
          {/* Connection Ready Badge */}
          <div className="connection-badge-wrapper">
            <button 
              type="button" 
              className={`connection-pill ${USE_MOCK ? 'connection-pill-mock' : 'connection-pill-live'}`}
              onClick={() => setShowConnectionInfo(!showConnectionInfo)}
              title="Click for Backend Connection Details"
            >
              <span className="status-dot"></span>
              <span className="connection-text">
                {USE_MOCK ? 'Data Mode: Dummy / Mock' : 'Data Mode: Live FastAPI'}
              </span>
              <Info size={13} className="info-icon" />
            </button>

            {/* Connection Info Popover */}
            {showConnectionInfo && (
              <div className="connection-popover card">
                <div className="popover-header">
                  <Server size={15} />
                  <strong>Backend Connection Ready</strong>
                </div>
                <p className="popover-desc">
                  This dashboard is wired to consume the clean merged output from your mainframe pipeline.
                </p>
                <div className="popover-row">
                  <span className="text-muted">Target Endpoint:</span>
                  <code className="mono">{API_BASE_URL}</code>
                </div>
                <div className="popover-row">
                  <span className="text-muted">Current State:</span>
                  <span className="badge badge-primary">
                    {USE_MOCK ? 'Serving Clean Mock Dataset' : 'Connected to Live Server'}
                  </span>
                </div>
                <div className="popover-tip">
                  💡 <strong>To plug in real backend:</strong> When your groupmate's FastAPI backend is running, set <code>USE_MOCK = false</code> in <code>src/services/api.js</code>. No other code changes needed!
                </div>
                <button 
                  className="popover-close-btn"
                  onClick={() => setShowConnectionInfo(false)}
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>

          {/* Last Batch Time */}
          <div className="batch-meta">
            <span className="text-muted">Batch ID:</span>
            <span className="mono batch-code">{summary?.batchId || 'JOB_RIDE_001'}</span>
          </div>

          {/* Refresh Action */}
          <button 
            type="button" 
            className={`btn-refresh ${isRefreshing ? 'is-spinning' : ''}`}
            onClick={onRefresh}
            title="Reload dataset"
          >
            <RefreshCw size={15} />
            <span>Sync</span>
          </button>
        </div>
      </div>
    </header>
  );
}
