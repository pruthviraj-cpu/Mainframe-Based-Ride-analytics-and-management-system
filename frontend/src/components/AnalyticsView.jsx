import React from 'react';
import { BarChart3, TrendingUp, MapPin, DollarSign } from 'lucide-react';

export default function AnalyticsView({ hourlyData, zoneData }) {
  const maxHourlyTrips = Math.max(...(hourlyData?.map((h) => h.trips) || [1]));
  const maxPickups = Math.max(...(zoneData?.map((z) => z.pickups) || [1]));

  return (
    <div className="analytics-view-container">
      {/* Hourly Demand Breakdown */}
      <div className="card chart-card">
        <div className="chart-header">
          <div>
            <h3 className="chart-title">Hourly Ride Demand & Fleet Volume</h3>
            <p className="chart-subtitle text-secondary">
              Distribution of rides over a 24-hour cycle from timestamp records (Cols 01–12).
            </p>
          </div>
          <div className="badge badge-primary">
            <TrendingUp size={12} />
            <span>Peak Demand: 18:00 (Evening Rush)</span>
          </div>
        </div>

        {/* Clean CSS/SVG Bar Chart */}
        <div className="hourly-bars-wrapper">
          <div className="hourly-bars-grid">
            {hourlyData?.map((item) => {
              const heightPercent = Math.round((item.trips / maxHourlyTrips) * 100);
              return (
                <div key={item.hour} className="bar-column">
                  <div className="bar-val-tooltip">${item.revenue}</div>
                  <div className="bar-track">
                    <div 
                      className="bar-fill" 
                      style={{ height: `${heightPercent}%` }}
                      title={`${item.hour}: ${item.trips} trips ($${item.revenue})`}
                    ></div>
                  </div>
                  <span className="mono bar-label">{item.hour}</span>
                  <span className="bar-count-sub text-muted">{item.trips} rides</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* High-Demand Zones Grid */}
      <div className="card chart-card">
        <div className="chart-header">
          <div>
            <h3 className="chart-title">High-Demand Taxi Zones & Airport Hubs</h3>
            <p className="chart-subtitle text-secondary">
              Pickup (Cols 21–23) and Dropoff (Cols 24–26) spatial clustering from FILE1.
            </p>
          </div>
          <div className="badge badge-neutral">
            <MapPin size={12} />
            <span>Top Zone: Times Square [230]</span>
          </div>
        </div>

        <div className="zones-list">
          {zoneData?.map((zone) => {
            const widthPercent = Math.round((zone.pickups / maxPickups) * 100);
            return (
              <div key={zone.zone_id} className="zone-row-item">
                <div className="zone-info-left">
                  <span className="mono zone-id-pill">Zone {zone.zone_id}</span>
                  <span className="zone-title">{zone.name}</span>
                </div>

                <div className="zone-bar-middle">
                  <div className="zone-bar-track">
                    <div className="zone-bar-fill" style={{ width: `${widthPercent}%` }}></div>
                  </div>
                </div>

                <div className="zone-metrics-right">
                  <span className="zone-metric-pickups"><strong>{zone.pickups}</strong> pickups</span>
                  <span className="zone-metric-fare text-muted">Avg ${zone.avg_fare.toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
