import React, { useState } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Play, Database, ShieldAlert, Sparkles } from 'lucide-react';
import { uploadInputFiles, loadSamplePreset } from '../services/api';

export default function FileUploadModal({ isOpen, onClose, onSuccess }) {
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [speedThreshold, setSpeedThreshold] = useState(85);
  const [minFareThreshold, setMinFareThreshold] = useState(5.0);
  const [minFareDist, setMinFareDist] = useState(10.0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file1 && !file2) {
      setStatusMessage({
        type: 'error',
        text: 'Please select at least FILE1 (Trips) or FILE2 (Drivers) to upload.',
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await uploadInputFiles(file1, file2, {
        speed_threshold: speedThreshold,
        min_fare_threshold: minFareThreshold,
        min_fare_dist: minFareDist,
      });

      setStatusMessage({
        type: 'success',
        text: res.message || 'Files uploaded and batch pipeline completed with RC=0000.',
      });

      setTimeout(() => {
        if (onSuccess) onSuccess(res);
        onClose();
      }, 1200);
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: `Upload failed: ${err.message || 'Unknown error'}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreset = async (presetName) => {
    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      const res = await loadSamplePreset(presetName);
      setStatusMessage({
        type: 'success',
        text: `Successfully loaded scenario "${presetName}". Pipeline refreshed with RC=0000.`,
      });
      setTimeout(() => {
        if (onSuccess) onSuccess(res);
        onClose();
      }, 1000);
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: `Failed to load scenario: ${err.message || 'Network error'}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="flex-align-gap">
            <UploadCloud className="text-primary" size={22} />
            <div>
              <h2 className="modal-title">Ingest Custom Dataset Files</h2>
              <p className="modal-subtitle">
                Upload raw PS / CSV files for IBM z/OS Batch Pipeline (FILE1 Trips & FILE2 Drivers)
              </p>
            </div>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Quick Benchmark Preset Bar */}
          <div className="preset-callout-box">
            <div className="preset-callout-header">
              <Sparkles size={16} className="text-warning" />
              <strong>Quick Benchmark Scenarios</strong>
              <span className="text-muted">— Or load curated mainframe test suites:</span>
            </div>
            <div className="preset-btn-row">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => handlePreset('standard')}
                disabled={isSubmitting}
              >
                <Database size={14} className="text-primary" />
                Standard 100-Ride Benchmark
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm btn-outline-warning"
                onClick={() => handlePreset('high_fraud')}
                disabled={isSubmitting}
              >
                <ShieldAlert size={14} className="text-warning" />
                High-Fraud Stress Test (264 MPH / Low Fare)
              </button>
            </div>
          </div>

          <div className="divider-with-text">
            <span>OR UPLOAD CUSTOM FILES</span>
          </div>

          <form onSubmit={handleFileUpload} className="upload-form">
            <div className="upload-dropzone-grid">
              {/* FILE1 Dropzone */}
              <div className={`dropzone-box ${file1 ? 'dropzone-active' : ''}`}>
                <label htmlFor="file1-input" className="dropzone-label">
                  <FileText size={28} className={file1 ? 'text-primary' : 'text-muted'} />
                  <div className="dropzone-text">
                    <span className="dropzone-title">FILE1: Trip Data</span>
                    <span className="dropzone-hint text-muted">
                      {file1 ? file1.name : 'Click to select .ps, .txt, or .csv'}
                    </span>
                    <span className="dropzone-specs mono">
                      LRECL=80 (Cols: Timestamp, TripID, Zones, Distance, Fare)
                    </span>
                  </div>
                  {file1 && (
                    <span className="badge badge-success badge-sm">
                      <CheckCircle2 size={12} /> Ready
                    </span>
                  )}
                </label>
                <input
                  id="file1-input"
                  type="file"
                  accept=".ps,.txt,.csv,.dat"
                  className="visually-hidden"
                  onChange={(e) => setFile1(e.target.files?.[0] || null)}
                />
              </div>

              {/* FILE2 Dropzone */}
              <div className={`dropzone-box ${file2 ? 'dropzone-active' : ''}`}>
                <label htmlFor="file2-input" className="dropzone-label">
                  <FileText size={28} className={file2 ? 'text-primary' : 'text-muted'} />
                  <div className="dropzone-text">
                    <span className="dropzone-title">FILE2: Driver Telemetry</span>
                    <span className="dropzone-hint text-muted">
                      {file2 ? file2.name : 'Click to select .ps, .txt, or .csv'}
                    </span>
                    <span className="dropzone-specs mono">
                      LRECL=80 (Cols: DriverID, TripID, Duration, Status)
                    </span>
                  </div>
                  {file2 && (
                    <span className="badge badge-success badge-sm">
                      <CheckCircle2 size={12} /> Ready
                    </span>
                  )}
                </label>
                <input
                  id="file2-input"
                  type="file"
                  accept=".ps,.txt,.csv,.dat"
                  className="visually-hidden"
                  onChange={(e) => setFile2(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            {/* Threshold Configuration row */}
            <div className="upload-threshold-subpanel">
              <span className="subpanel-title">Batch Execution Parameters</span>
              <div className="subpanel-inputs">
                <div className="input-group-compact">
                  <label>Speed Limit (MPH):</label>
                  <input
                    type="number"
                    min="50"
                    max="140"
                    value={speedThreshold}
                    onChange={(e) => setSpeedThreshold(Number(e.target.value))}
                    className="styled-input-sm mono"
                  />
                </div>
                <div className="input-group-compact">
                  <label>Min Fare Floor ($):</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    step="0.5"
                    value={minFareThreshold}
                    onChange={(e) => setMinFareThreshold(Number(e.target.value))}
                    className="styled-input-sm mono"
                  />
                </div>
                <div className="input-group-compact">
                  <label>Fare Gate Dist (mi):</label>
                  <input
                    type="number"
                    min="5"
                    max="30"
                    value={minFareDist}
                    onChange={(e) => setMinFareDist(Number(e.target.value))}
                    className="styled-input-sm mono"
                  />
                </div>
              </div>
            </div>

            {statusMessage && (
              <div className={`notification-banner banner-${statusMessage.type}`}>
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            <div className="modal-footer-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-run-pulse"
                disabled={isSubmitting || (!file1 && !file2)}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" />
                    Ingesting & Executing...
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    Upload & Execute Batch Pipeline
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
