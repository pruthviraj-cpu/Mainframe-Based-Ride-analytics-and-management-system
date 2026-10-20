import React from 'react';
import { X, Terminal, Check, Layers, ArrowRight } from 'lucide-react';

export default function TripDetailModal({ trip, onClose }) {
  if (!trip) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="badge badge-mainframe">MAINFRAME PS RECORD INSPECTOR</span>
            <h2 className="modal-title">Trip Record: <span className="mono">{trip.trip_id}</span></h2>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Top Formatted Summary Grid */}
          <div className="modal-summary-grid">
            <div className="summary-pill">
              <span className="label">Primary Key</span>
              <span className="mono value text-primary">{trip.trip_id}</span>
            </div>
            <div className="summary-pill">
              <span className="label">Driver Assigned</span>
              <span className="mono value">{trip.driver_id}</span>
            </div>
            <div className="summary-pill">
              <span className="label">Fare Amount</span>
              <span className="mono value font-bold">${trip.fare_usd.toFixed(2)}</span>
            </div>
            <div className="summary-pill">
              <span className="label">Duration</span>
              <span className="mono value">{trip.duration_mins} min</span>
            </div>
            <div className="summary-pill">
              <span className="label">Distance</span>
              <span className="mono value">{trip.distance_miles.toFixed(2)} mi</span>
            </div>
          </div>

          <div className="modal-section-divider">
            <Terminal size={14} />
            <span>Raw 80-Byte Positional Mainframe Representation (LRECL=80, RECFM=FB)</span>
          </div>

          {/* Section 1: FILE1_TRIP_DATA.ps */}
          <div className="raw-record-card">
            <div className="raw-card-header">
              <span className="file-tag">FILE1_TRIP_DATA.ps</span>
              <span className="file-desc">Contains Financial, Timing & Route Coordinates</span>
            </div>
            <div className="raw-code-wrapper">
              <div className="column-ruler mono">
                {"----+----1----+----2----+----3----+----4----+----5----+----6----+----7----+----8"}
              </div>
              <div className="raw-line mono">{trip.raw_file1}</div>
            </div>
            <div className="field-breakdown-tags">
              <span className="tag-pill"><strong>01-12:</strong> Timestamp ({trip.timestamp.replace(/[- :]/g, '')})</span>
              <span className="tag-pill tag-pk"><strong>13-20:</strong> Trip ID ({trip.trip_id}) [PK]</span>
              <span className="tag-pill"><strong>21-23:</strong> Pickup Zone ({trip.pickup_zone_id})</span>
              <span className="tag-pill"><strong>24-26:</strong> Dropoff Zone ({trip.dropoff_zone_id})</span>
              <span className="tag-pill"><strong>27-32:</strong> Distance ({trip.distance_miles.toFixed(2).padStart(6, '0')})</span>
              <span className="tag-pill"><strong>33-38:</strong> Fare (${trip.fare_usd.toFixed(2).padStart(6, '0')})</span>
              <span className="tag-pill text-muted"><strong>39-80:</strong> Blank Padding</span>
            </div>
          </div>

          {/* Section 2: FILE2_DRIVER_DATA.ps */}
          <div className="raw-record-card">
            <div className="raw-card-header">
              <span className="file-tag">FILE2_DRIVER_DATA.ps</span>
              <span className="file-desc">Contains Driver Assignment & Trip Duration Telemetry</span>
            </div>
            <div className="raw-code-wrapper">
              <div className="column-ruler mono">
                {"----+----1----+----2----+----3----+----4----+----5----+----6----+----7----+----8"}
              </div>
              <div className="raw-line mono">{trip.raw_file2}</div>
            </div>
            <div className="field-breakdown-tags">
              <span className="tag-pill"><strong>01-08:</strong> Driver ID ({trip.driver_id})</span>
              <span className="tag-pill text-muted"><strong>09-20:</strong> Blank Filler</span>
              <span className="tag-pill tag-pk"><strong>21-28:</strong> Trip ID ({trip.trip_id}) [PK]</span>
              <span className="tag-pill"><strong>29-33:</strong> Duration ({String(trip.duration_mins).padStart(3, '0')}MN)</span>
              <span className="tag-pill text-muted"><strong>34-80:</strong> Blank Padding</span>
            </div>
          </div>

          {/* How they joined */}
          <div className="join-explanation-box">
            <Layers size={14} className="text-primary" />
            <span className="text-secondary">
              <strong>Mainframe Join Process:</strong> REXX / COBOL matches Column 13–20 of FILE1 with Column 21–28 of FILE2 on Primary Key <code className="mono">{trip.trip_id}</code> to assemble this unified analytical record.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button type="button" className="btn-modal-close" onClick={onClose}>
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
