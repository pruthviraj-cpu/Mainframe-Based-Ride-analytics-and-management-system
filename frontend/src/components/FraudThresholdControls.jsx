import React, { useState } from 'react';
import { Sliders, AlertTriangle, ShieldCheck, Play, RotateCcw, Zap } from 'lucide-react';
import { triggerPipelineExecution } from '../services/api';

export default function FraudThresholdControls({ onPipelineRerun, currentThresholds }) {
  const [speedThreshold, setSpeedThreshold] = useState(currentThresholds?.speed_threshold || 85);
  const [minFareThreshold, setMinFareThreshold] = useState(currentThresholds?.min_fare_threshold || 5.0);
  const [minFareDist, setMinFareDist] = useState(currentThresholds?.min_fare_dist || 10.0);
  const [isRunning, setIsRunning] = useState(false);
  const [resultMsg, setResultMsg] = useState(null);

  const applyPreset = (preset) => {
    if (preset === 'standard') {
      setSpeedThreshold(85);
      setMinFareThreshold(5.0);
      setMinFareDist(10.0);
    } else if (preset === 'strict') {
      setSpeedThreshold(70);
      setMinFareThreshold(8.0);
      setMinFareDist(8.0);
    } else if (preset === 'relaxed') {
      setSpeedThreshold(100);
      setMinFareThreshold(3.0);
      setMinFareDist(15.0);
    }
  };

  const handleApply = async () => {
    setIsRunning(true);
    setResultMsg(null);
    try {
      const res = await triggerPipelineExecution({
        speed_threshold: Number(speedThreshold),
        min_fare_threshold: Number(minFareThreshold),
        min_fare_dist: Number(minFareDist),
      });
      setResultMsg({
        type: 'success',
        text: `Pipeline executed: RC=0000. ${res.metrics?.fraud_trips_count ?? 1} fraud trip(s) flagged under ${speedThreshold} MPH / $${minFareThreshold} threshold.`,
      });
      if (onPipelineRerun) {
        onPipelineRerun(res);
      }
    } catch (err) {
      setResultMsg({
        type: 'error',
        text: `Execution failed: ${err.message || 'Unknown error'}`,
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="card threshold-controls-card">
      <div className="card-header-clean">
        <div className="flex-between">
          <div className="flex-align-gap">
            <Sliders size={18} className="text-primary" />
            <div>
              <h3 className="card-heading">Dynamic Fraud Detection Thresholds</h3>
              <p className="card-subtext">
                Tune COBOL & REXX anomaly parameters in real-time and trigger batch execution.
              </p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="preset-pill-group">
            <span className="preset-label">Presets:</span>
            <button
              type="button"
              className="btn btn-xs btn-outline"
              onClick={() => applyPreset('standard')}
            >
              Standard (85 MPH)
            </button>
            <button
              type="button"
              className="btn btn-xs btn-outline"
              onClick={() => applyPreset('strict')}
            >
              Strict (70 MPH)
            </button>
            <button
              type="button"
              className="btn btn-xs btn-outline"
              onClick={() => applyPreset('relaxed')}
            >
              Relaxed (100 MPH)
            </button>
          </div>
        </div>
      </div>

      <div className="threshold-grid">
        {/* Slider 1: Speed Anomaly */}
        <div className="slider-control-group">
          <div className="slider-top-label">
            <span className="slider-title">
              <AlertTriangle size={14} className="text-warning" />
              Maximum Speed Limit
            </span>
            <span className="slider-value mono badge badge-warning">
              {speedThreshold} MPH
            </span>
          </div>
          <input
            type="range"
            min="60"
            max="120"
            step="5"
            value={speedThreshold}
            onChange={(e) => setSpeedThreshold(Number(e.target.value))}
            className="styled-slider"
          />
          <div className="slider-scale-legend">
            <span>60 MPH (Hyper-strict)</span>
            <span>85 MPH (Standard)</span>
            <span>120 MPH</span>
          </div>
          <span className="slider-hint text-muted">
            Flags trips calculated faster than {speedThreshold} MPH into FILE4_FRAUD_REPORT.ps.
          </span>
        </div>

        {/* Slider 2: Minimum Fare Floor */}
        <div className="slider-control-group">
          <div className="slider-top-label">
            <span className="slider-title">
              <ShieldCheck size={14} className="text-primary" />
              Minimum Fare Floor
            </span>
            <span className="slider-value mono badge badge-primary">
              ${Number(minFareThreshold).toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="2.0"
            max="12.0"
            step="0.5"
            value={minFareThreshold}
            onChange={(e) => setMinFareThreshold(Number(e.target.value))}
            className="styled-slider"
          />
          <div className="slider-scale-legend">
            <span>$2.00</span>
            <span>$5.00 (Standard)</span>
            <span>$12.00</span>
          </div>
          <span className="slider-hint text-muted">
            Flags long trips (distance &gt; {minFareDist} mi) with fare below ${minFareThreshold}.
          </span>
        </div>

        {/* Slider 3: Minimum Distance for Low Fare */}
        <div className="slider-control-group">
          <div className="slider-top-label">
            <span className="slider-title">
              <Zap size={14} className="text-secondary" />
              Low Fare Distance Gate
            </span>
            <span className="slider-value mono badge badge-neutral">
              {minFareDist} miles
            </span>
          </div>
          <input
            type="range"
            min="5.0"
            max="20.0"
            step="1.0"
            value={minFareDist}
            onChange={(e) => setMinFareDist(Number(e.target.value))}
            className="styled-slider"
          />
          <div className="slider-scale-legend">
            <span>5 mi</span>
            <span>10 mi (Standard)</span>
            <span>20 mi</span>
          </div>
          <span className="slider-hint text-muted">
            Trip distance cutoff before the minimum fare rule is enforced.
          </span>
        </div>
      </div>

      {resultMsg && (
        <div className={`notification-banner banner-${resultMsg.type}`}>
          <span>{resultMsg.text}</span>
        </div>
      )}

      <div className="threshold-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => applyPreset('standard')}
          disabled={isRunning}
        >
          <RotateCcw size={14} />
          Reset Defaults
        </button>
        <button
          type="button"
          className="btn btn-primary btn-run-pulse"
          onClick={handleApply}
          disabled={isRunning}
        >
          {isRunning ? (
            <>
              <span className="spinner-border spinner-border-sm" />
              Executing Batch Pipeline...
            </>
          ) : (
            <>
              <Play size={14} />
              Apply Thresholds & Run Pipeline
            </>
          )}
        </button>
      </div>
    </div>
  );
}
