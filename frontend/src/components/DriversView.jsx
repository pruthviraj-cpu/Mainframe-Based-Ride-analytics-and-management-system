import React from 'react';
import { Users, Star, Car, Clock, DollarSign, Award } from 'lucide-react';

export default function DriversView({ drivers }) {
  if (!drivers || drivers.length === 0) return null;

  return (
    <div className="drivers-container">
      <div className="section-intro">
        <div>
          <h2 className="section-title">Driver Fleet Telemetry</h2>
          <p className="section-desc">
            Extracted from <code className="mono">FILE2_DRIVER_DATA.ps</code> (Cols 01–08 Driver ID, Cols 29–33 Duration).
          </p>
        </div>
        <div className="fleet-summary-tag">
          <Users size={14} />
          <span>Active Fleet: {drivers.length} Tracked Drivers</span>
        </div>
      </div>

      <div className="drivers-grid">
        {drivers.map((drv) => {
          let statusBadgeClass = 'badge-success';
          let statusText = 'On Duty';

          if (drv.status === 'RESTING') {
            statusBadgeClass = 'badge-warning';
            statusText = 'Resting';
          } else if (drv.status === 'OFF_DUTY') {
            statusBadgeClass = 'badge-neutral';
            statusText = 'Off Duty';
          }

          return (
            <div key={drv.driver_id} className="card driver-card">
              <div className="driver-card-top">
                <div className="driver-avatar-section">
                  <div className="driver-avatar">
                    {drv.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="driver-name-header">{drv.name}</h3>
                    <span className="mono driver-id-badge">{drv.driver_id}</span>
                  </div>
                </div>
                <span className={`badge ${statusBadgeClass}`}>
                  <span className="status-dot-sm"></span>
                  {statusText}
                </span>
              </div>

              <div className="driver-vehicle-row">
                <Car size={13} className="text-muted" />
                <span className="text-secondary vehicle-text">{drv.vehicle}</span>
              </div>

              <div className="driver-stats-grid">
                <div className="driver-stat-box">
                  <span className="driver-stat-label">Trips</span>
                  <span className="driver-stat-value">{drv.trips_completed}</span>
                </div>
                <div className="driver-stat-box">
                  <span className="driver-stat-label">Revenue</span>
                  <span className="driver-stat-value">${drv.total_revenue.toFixed(0)}</span>
                </div>
                <div className="driver-stat-box">
                  <span className="driver-stat-label">Avg Trip</span>
                  <span className="driver-stat-value">{drv.avg_trip_mins}m</span>
                </div>
                <div className="driver-stat-box">
                  <span className="driver-stat-label">Rating</span>
                  <span className="driver-stat-value rating-val">
                    <Star size={11} fill="#F59E0B" color="#F59E0B" />
                    {drv.rating}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
