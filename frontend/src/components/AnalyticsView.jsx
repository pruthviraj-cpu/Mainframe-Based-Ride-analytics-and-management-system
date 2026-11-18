import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  MapPin,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import NycZoneMap from './NycZoneMap';
import FraudThresholdControls from './FraudThresholdControls';

// Colors for Financial Donut
const PIE_COLORS = ['#10b981', '#6366f1']; // Emerald for Driver (80%), Indigo for Platform (20%)

export default function AnalyticsView({
  hourlyData = [],
  zoneData = [],
  summary,
  onSelectZone,
  onPipelineRerun,
}) {
  const [activeMetricTab, setActiveMetricTab] = useState('hourly'); // 'hourly' | 'zones' | 'split'

  // Financial Split calculation for 80/20 Donut
  const grossRev = summary?.total_revenue ?? 1516.33;
  const driverPayout = summary?.driver_disbursements ?? (grossRev * 0.8);
  const platformComm = summary?.platform_commission ?? (grossRev * 0.2);

  const financialSplitData = [
    {
      name: 'Driver Payout (80%)',
      value: Number(driverPayout.toFixed(2)),
      share: '80%',
      description: 'Disbursed to fleet drivers per COBOL WS-PAYOUT-RATE',
    },
    {
      name: 'Platform Commission (20%)',
      value: Number(platformComm.toFixed(2)),
      share: '20%',
      description: 'Retained by platform per COBOL WS-COMM-RATE',
    },
  ];

  // Top zones sorted descending
  const sortedZones = [...zoneData].sort((a, b) => b.pickups - a.pickups).slice(0, 8);

  return (
    <div className="analytics-view-container">
      {/* Financial Split & Executive KPI Highlights */}
      <div className="analytics-top-hero-card card">
        <div className="analytics-hero-grid">
          <div className="analytics-hero-info">
            <div className="badge badge-primary-light">
              <Sparkles size={13} />
              <span>IBM z/OS COBOL & REXX Financial Analytics</span>
            </div>
            <h2 className="analytics-hero-title">
              Dynamic Fare & Fleet Demand Intelligence
            </h2>
            <p className="analytics-hero-sub text-secondary">
              Processed through 80-byte sequential data pipeline with the updated{' '}
              <strong>80% Driver Payout / 20% Platform Commission</strong> model.
            </p>
          </div>

          <div className="analytics-hero-payout-stats">
            <div className="payout-stat-pill payout-driver">
              <div className="payout-stat-header">
                <span className="payout-dot-driver"></span>
                <span className="payout-label">Driver Payout (80%)</span>
              </div>
              <span className="payout-value mono">
                ${driverPayout.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="payout-note text-muted">Direct operator earnings</span>
            </div>

            <div className="payout-stat-pill payout-platform">
              <div className="payout-stat-header">
                <span className="payout-dot-platform"></span>
                <span className="payout-label">Platform Take (20%)</span>
              </div>
              <span className="payout-value mono">
                ${platformComm.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="payout-note text-muted">Infrastructure & operations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Charts Grid */}
      <div className="analytics-charts-dual-grid">
        {/* Chart 1: 24-Hour Demand & Revenue Composed Chart */}
        <div className="card chart-card">
          <div className="chart-header">
            <div>
              <div className="flex-align-gap">
                <BarChart3 size={18} className="text-primary" />
                <h3 className="chart-title">24-Hour Ride Demand & Revenue Curve</h3>
              </div>
              <p className="chart-subtitle text-secondary">
                Hourly temporal distribution parsed from timestamp records (Cols 01–12).
              </p>
            </div>
            <div className="badge badge-neutral mono">
              Peak: 18:00 (Rush)
            </div>
          </div>

          <div className="chart-render-box" style={{ width: '100%', height: 290 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={hourlyData} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: 'Trips', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#94a3b8' }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    fontSize: '12px',
                  }}
                  formatter={(value, name) => [
                    name === 'Revenue ($)' ? `$${Number(value).toFixed(2)}` : `${value} trips`,
                    name,
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue ($)"
                  stroke="#0284c7"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#revenueGrad)"
                />
                <Bar
                  yAxisId="left"
                  dataKey="trips"
                  name="Trips Completed"
                  fill="#93c5fd"
                  radius={[4, 4, 0, 0]}
                  barSize={16}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: 80/20 Financial Split Donut */}
        <div className="card chart-card">
          <div className="chart-header">
            <div>
              <div className="flex-align-gap">
                <PieChartIcon size={18} className="text-success" />
                <h3 className="chart-title">Fare Disbursement Distribution</h3>
              </div>
              <p className="chart-subtitle text-secondary">
                Enforced by COBOL Balance-Line algorithm (80% Driver / 20% Platform).
              </p>
            </div>
            <div className="badge badge-success">
              80/20 Model
            </div>
          </div>

          <div className="financial-donut-container">
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={financialSplitData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {financialSplitData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#fff',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      fontSize: '12px',
                    }}
                    formatter={(value) => [`$${Number(value).toLocaleString()} USD`, 'Amount']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="donut-legend-row">
              <div className="donut-legend-item">
                <span className="donut-color-chip" style={{ background: PIE_COLORS[0] }}></span>
                <div>
                  <div className="legend-label">Driver Payout (80%)</div>
                  <div className="legend-value mono">${driverPayout.toFixed(2)}</div>
                </div>
              </div>
              <div className="donut-legend-item">
                <span className="donut-color-chip" style={{ background: PIE_COLORS[1] }}></span>
                <div>
                  <div className="legend-label">Platform Take (20%)</div>
                  <div className="legend-value mono">${platformComm.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Zones Bar Chart & High Demand Clustering */}
      <div className="card chart-card">
        <div className="chart-header">
          <div>
            <div className="flex-align-gap">
              <MapPin size={18} className="text-primary" />
              <h3 className="chart-title">High-Demand Taxi Zones (OCCURS Array Ranking)</h3>
            </div>
            <p className="chart-subtitle text-secondary">
              Ranked from COBOL memory table tracking pickup spatial volume. Click a bar to filter trips.
            </p>
          </div>
          <div className="badge badge-primary">
            #1 Zone: Clinton East [048]
          </div>
        </div>

        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedZones}
              margin={{ top: 10, right: 30, left: 10, bottom: 25 }}
              onClick={(state) => {
                if (state && state.activePayload && state.activePayload.length > 0) {
                  const clickedZone = state.activePayload[0].payload;
                  if (onSelectZone) {
                    onSelectZone(String(clickedZone.zone_id).padStart(3, '0'));
                  }
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#475569' }}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                label={{ value: 'Pickups', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#94a3b8' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  borderRadius: '8px',
                  border: 'none',
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  fontSize: '12px',
                }}
                formatter={(val, name, props) => [
                  `${val} Pickups (Avg Fare: $${props.payload.avg_fare.toFixed(2)})`,
                  'Volume',
                ]}
              />
              <Bar
                dataKey="pickups"
                name="Pickups"
                fill="#0284c7"
                radius={[4, 4, 0, 0]}
                barSize={32}
              >
                {sortedZones.map((entry, index) => (
                  <Cell
                    key={`bar-cell-${index}`}
                    fill={entry.zone_id === '048' || entry.zone_id === 48 ? '#2563eb' : '#38bdf8'}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interactive NYC Taxi Zone Heatmap */}
      <div className="section-divider-title">
        <MapPin size={16} />
        <span>NYC Spatial Heatmap & Dispatch Routing</span>
      </div>

      <NycZoneMap zoneData={zoneData} onSelectZone={onSelectZone} />

      {/* Dynamic Fraud Threshold Controls & Batch Execution */}
      <div className="section-divider-title">
        <Layers size={16} />
        <span>Pipeline Anomaly Sensitivity Controls</span>
      </div>

      <FraudThresholdControls
        onPipelineRerun={onPipelineRerun}
        currentThresholds={{
          speed_threshold: 85,
          min_fare_threshold: 5.0,
          min_fare_dist: 10.0,
        }}
      />
    </div>
  );
}
