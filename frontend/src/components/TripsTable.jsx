import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  FileText,
  Eye,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  DollarSign,
  Gauge,
  Clock,
  Navigation,
} from 'lucide-react';
import { generateRidesPdfReport } from '../services/pdfReportGenerator';

export default function TripsTable({ trips = [], summary = {}, onSelectTrip }) {
  // --- Filter State Across All Attributes ---
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'CLEAN' | 'ALL_FRAUD' | 'FRAUD_SPEED' | 'FRAUD_FARE'
  const [pickupZoneFilter, setPickupZoneFilter] = useState('ALL');
  const [dropoffZoneFilter, setDropoffZoneFilter] = useState('ALL');
  const [driverFilter, setDriverFilter] = useState('ALL');
  const [minFare, setMinFare] = useState('');
  const [maxFare, setMaxFare] = useState('');
  const [minDistance, setMinDistance] = useState('');
  const [maxDistance, setMaxDistance] = useState('');
  const [minDuration, setMinDuration] = useState('');
  const [maxDuration, setMaxDuration] = useState('');
  const [minSpeed, setMinSpeed] = useState('');
  const [maxSpeed, setMaxSpeed] = useState('');
  const [highSpeedOnly, setHighSpeedOnly] = useState(false);

  // Sorting State
  const [sortField, setSortField] = useState('trip_id');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'

  // Filter Drawer Toggle & Pagination
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // --- Dynamic Option Lists Extracted from Data ---
  const uniquePickupZones = useMemo(() => {
    const zones = new Set();
    trips.forEach((t) => {
      if (t.pickup_zone) zones.add(t.pickup_zone);
      else if (t.pickup_zone_id) zones.add(`Zone ${t.pickup_zone_id}`);
    });
    return Array.from(zones).sort();
  }, [trips]);

  const uniqueDropoffZones = useMemo(() => {
    const zones = new Set();
    trips.forEach((t) => {
      if (t.dropoff_zone) zones.add(t.dropoff_zone);
      else if (t.dropoff_zone_id) zones.add(`Zone ${t.dropoff_zone_id}`);
    });
    return Array.from(zones).sort();
  }, [trips]);

  const uniqueDrivers = useMemo(() => {
    const drivers = new Map();
    trips.forEach((t) => {
      if (t.driver_id) {
        drivers.set(t.driver_id, t.driver_name ? `${t.driver_id} (${t.driver_name})` : t.driver_id);
      }
    });
    return Array.from(drivers.entries()).map(([id, label]) => ({ id, label }));
  }, [trips]);

  // --- Calculate Active Filters Count ---
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (statusFilter !== 'ALL') count++;
    if (pickupZoneFilter !== 'ALL') count++;
    if (dropoffZoneFilter !== 'ALL') count++;
    if (driverFilter !== 'ALL') count++;
    if (minFare || maxFare) count++;
    if (minDistance || maxDistance) count++;
    if (minDuration || maxDuration) count++;
    if (minSpeed || maxSpeed || highSpeedOnly) count++;
    return count;
  }, [
    searchTerm,
    statusFilter,
    pickupZoneFilter,
    dropoffZoneFilter,
    driverFilter,
    minFare,
    maxFare,
    minDistance,
    maxDistance,
    minDuration,
    maxDuration,
    minSpeed,
    maxSpeed,
    highSpeedOnly,
  ]);

  // --- Reset All Filters ---
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setPickupZoneFilter('ALL');
    setDropoffZoneFilter('ALL');
    setDriverFilter('ALL');
    setMinFare('');
    setMaxFare('');
    setMinDistance('');
    setMaxDistance('');
    setMinDuration('');
    setMaxDuration('');
    setMinSpeed('');
    setMaxSpeed('');
    setHighSpeedOnly(false);
    setCurrentPage(1);
  };

  // --- Filtering Logic Across All Attributes ---
  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      // 1. Search Query
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchSearch =
          (t.trip_id && t.trip_id.toLowerCase().includes(q)) ||
          (t.driver_id && t.driver_id.toLowerCase().includes(q)) ||
          (t.driver_name && t.driver_name.toLowerCase().includes(q)) ||
          (t.pickup_zone && t.pickup_zone.toLowerCase().includes(q)) ||
          (t.dropoff_zone && t.dropoff_zone.toLowerCase().includes(q));
        if (!matchSearch) return false;
      }

      // 2. Status / Fraud Filter
      const statusStr = (t.status || '').toLowerCase();
      const isFraud = statusStr.includes('fraud') || t.is_fraud === true;
      const isSpeedFraud = statusStr.includes('speed') || (t.speed_mph && t.speed_mph > 85);
      const isFareFraud = statusStr.includes('low-fare') || statusStr.includes('fare');

      if (statusFilter === 'CLEAN' && isFraud) return false;
      if (statusFilter === 'ALL_FRAUD' && !isFraud) return false;
      if (statusFilter === 'FRAUD_SPEED' && !isSpeedFraud) return false;
      if (statusFilter === 'FRAUD_FARE' && !isFareFraud) return false;

      // 3. Pickup Zone
      if (pickupZoneFilter !== 'ALL') {
        const pZone = t.pickup_zone || `Zone ${t.pickup_zone_id}`;
        if (pZone !== pickupZoneFilter) return false;
      }

      // 4. Dropoff Zone
      if (dropoffZoneFilter !== 'ALL') {
        const dZone = t.dropoff_zone || `Zone ${t.dropoff_zone_id}`;
        if (dZone !== dropoffZoneFilter) return false;
      }

      // 5. Driver
      if (driverFilter !== 'ALL' && t.driver_id !== driverFilter) {
        return false;
      }

      // 6. Fare Range
      const fare = Number(t.fare_usd) || 0;
      if (minFare !== '' && fare < Number(minFare)) return false;
      if (maxFare !== '' && fare > Number(maxFare)) return false;

      // 7. Distance Range
      const dist = Number(t.distance_miles) || 0;
      if (minDistance !== '' && dist < Number(minDistance)) return false;
      if (maxDistance !== '' && dist > Number(maxDistance)) return false;

      // 8. Duration Range
      const dur = Number(t.duration_mins) || 0;
      if (minDuration !== '' && dur < Number(minDuration)) return false;
      if (maxDuration !== '' && dur > Number(maxDuration)) return false;

      // 9. Speed Range & High Speed Toggle
      const speed = Number(t.speed_mph) || (dur > 0 ? (dist * 60) / dur : 0);
      if (highSpeedOnly && speed < 60) return false;
      if (minSpeed !== '' && speed < Number(minSpeed)) return false;
      if (maxSpeed !== '' && speed > Number(maxSpeed)) return false;

      return true;
    });
  }, [
    trips,
    searchTerm,
    statusFilter,
    pickupZoneFilter,
    dropoffZoneFilter,
    driverFilter,
    minFare,
    maxFare,
    minDistance,
    maxDistance,
    minDuration,
    maxDuration,
    minSpeed,
    maxSpeed,
    highSpeedOnly,
  ]);

  // --- Sorting Logic ---
  const sortedTrips = useMemo(() => {
    const list = [...filteredTrips];
    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Numerical fields
      if (
        [
          'fare_usd',
          'distance_miles',
          'duration_mins',
          'speed_mph',
          'driver_payout_usd',
          'platform_commission_usd',
        ].includes(sortField)
      ) {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else {
        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredTrips, sortField, sortOrder]);

  // --- Pagination ---
  const totalPages = Math.ceil(sortedTrips.length / pageSize) || 1;
  const paginatedTrips = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedTrips.slice(start, start + pageSize);
  }, [sortedTrips, currentPage, pageSize]);

  // --- Column Header Click for Quick Sorting ---
  const handleSortClick = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // --- Export PDF Report ---
  const handleExportPDF = async () => {
    try {
      setIsGeneratingPdf(true);
      await new Promise((r) => setTimeout(r, 100));

      const activeFiltersObj = {
        searchTerm,
        statusFilter,
        pickupZone: pickupZoneFilter,
        dropoffZone: dropoffZoneFilter,
        driverFilter,
        minFare,
        maxFare,
        minDistance,
        maxDistance,
        speedOnly: highSpeedOnly,
      };

      generateRidesPdfReport(sortedTrips, summary, activeFiltersObj);
    } catch (err) {
      console.error('Failed to generate PDF report:', err);
      alert('Unable to generate PDF. Check browser popup blockers.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // --- Export CSV ---
  const handleExportCSV = () => {
    const headers = [
      'Trip_ID',
      'Driver_ID',
      'Driver_Name',
      'Timestamp',
      'Pickup_Zone',
      'Dropoff_Zone',
      'Distance_Miles',
      'Fare_USD',
      'Driver_Payout_75',
      'Platform_Commission_25',
      'Duration_Mins',
      'Implied_Speed_MPH',
      'Status',
    ];

    const rows = sortedTrips.map((t) => {
      const fare = Number(t.fare_usd) || 0;
      const payout = Number(t.driver_payout_usd) || fare * 0.75;
      const comm = Number(t.platform_commission_usd) || fare * 0.25;
      const speed = Number(t.speed_mph) || 0;

      return [
        t.trip_id,
        t.driver_id,
        `"${t.driver_name || ''}"`,
        t.timestamp,
        `"${t.pickup_zone || ''}"`,
        `"${t.dropoff_zone || ''}"`,
        t.distance_miles,
        fare.toFixed(2),
        payout.toFixed(2),
        comm.toFixed(2),
        t.duration_mins,
        speed.toFixed(1),
        `"${t.status || 'CLEAN'}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `mainframe_rides_export_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="card table-container">
      {/* Table Toolbar */}
      <div className="table-toolbar">
        <div className="toolbar-left">
          {/* Quick Search */}
          <div className="search-input-wrapper">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search Trip ID, Driver, Route..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="search-input"
            />
            {searchTerm && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchTerm('')}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Status Quick Filter */}
          <div className="filter-select-wrapper">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="ALL">All Statuses</option>
              <option value="CLEAN">Clean Ledger Only</option>
              <option value="ALL_FRAUD">All Flagged Fraud</option>
              <option value="FRAUD_SPEED">Speed Fraud (&gt;85 MPH)</option>
              <option value="FRAUD_FARE">Low Fare Anomaly (&gt;10mi, &lt;$5)</option>
            </select>
          </div>

          {/* Toggle Advanced Filters Drawer */}
          <button
            type="button"
            className={`btn-filter-toggle ${showAdvancedFilters ? 'active' : ''} ${activeFiltersCount > 0 ? 'has-active' : ''}`}
            onClick={() => setShowAdvancedFilters((prev) => !prev)}
            title="Expand / collapse multi-attribute filter controls"
          >
            <SlidersHorizontal size={14} />
            <span>Attributes Filter</span>
            {activeFiltersCount > 0 && (
              <span className="filter-count-badge">{activeFiltersCount}</span>
            )}
          </button>

          {/* Reset Filters */}
          {activeFiltersCount > 0 && (
            <button
              type="button"
              className="btn-reset-filters"
              onClick={handleResetFilters}
              title="Reset all active filters"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Toolbar Right: Export Buttons */}
        <div className="toolbar-right">
          <span className="results-count text-secondary">
            Showing <strong>{sortedTrips.length}</strong> of {trips.length} records
          </span>

          {/* PDF Report Export Button */}
          <button
            type="button"
            className="btn-export-pdf"
            onClick={handleExportPDF}
            disabled={isGeneratingPdf || sortedTrips.length === 0}
            title="Generate and download formatted PDF report"
          >
            <FileText size={14} />
            <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF Report'}</span>
          </button>

          {/* CSV Export Button */}
          <button
            type="button"
            className="btn-export"
            onClick={handleExportCSV}
            disabled={sortedTrips.length === 0}
            title="Export filtered data to CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Expandable Advanced Multi-Attribute Filters Drawer */}
      {showAdvancedFilters && (
        <div className="advanced-filters-panel">
          <div className="filters-grid">
            {/* Pickup Zone */}
            <div className="filter-group">
              <label className="filter-label">Pickup Zone</label>
              <select
                value={pickupZoneFilter}
                onChange={(e) => {
                  setPickupZoneFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="filter-input-select"
              >
                <option value="ALL">All Pickup Locations ({uniquePickupZones.length})</option>
                {uniquePickupZones.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>

            {/* Dropoff Zone */}
            <div className="filter-group">
              <label className="filter-label">Dropoff Zone</label>
              <select
                value={dropoffZoneFilter}
                onChange={(e) => {
                  setDropoffZoneFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="filter-input-select"
              >
                <option value="ALL">All Dropoff Locations ({uniqueDropoffZones.length})</option>
                {uniqueDropoffZones.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>

            {/* Driver */}
            <div className="filter-group">
              <label className="filter-label">Assigned Driver</label>
              <select
                value={driverFilter}
                onChange={(e) => {
                  setDriverFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="filter-input-select"
              >
                <option value="ALL">All Fleet Drivers ({uniqueDrivers.length})</option>
                {uniqueDrivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Fare Range */}
            <div className="filter-group">
              <label className="filter-label">Fare Range ($ USD)</label>
              <div className="range-inputs-row">
                <input
                  type="number"
                  placeholder="Min $"
                  value={minFare}
                  onChange={(e) => {
                    setMinFare(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="filter-number-input"
                />
                <span className="range-separator">-</span>
                <input
                  type="number"
                  placeholder="Max $"
                  value={maxFare}
                  onChange={(e) => {
                    setMaxFare(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="filter-number-input"
                />
              </div>
            </div>

            {/* Distance Range */}
            <div className="filter-group">
              <label className="filter-label">Distance Range (Miles)</label>
              <div className="range-inputs-row">
                <input
                  type="number"
                  placeholder="Min mi"
                  value={minDistance}
                  onChange={(e) => {
                    setMinDistance(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="filter-number-input"
                />
                <span className="range-separator">-</span>
                <input
                  type="number"
                  placeholder="Max mi"
                  value={maxDistance}
                  onChange={(e) => {
                    setMaxDistance(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="filter-number-input"
                />
              </div>
            </div>

            {/* Duration Range */}
            <div className="filter-group">
              <label className="filter-label">Duration Range (Mins)</label>
              <div className="range-inputs-row">
                <input
                  type="number"
                  placeholder="Min min"
                  value={minDuration}
                  onChange={(e) => {
                    setMinDuration(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="filter-number-input"
                />
                <span className="range-separator">-</span>
                <input
                  type="number"
                  placeholder="Max min"
                  value={maxDuration}
                  onChange={(e) => {
                    setMaxDuration(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="filter-number-input"
                />
              </div>
            </div>

            {/* Speed Range & High Speed Toggle */}
            <div className="filter-group">
              <label className="filter-label">Implied Speed (MPH)</label>
              <div className="speed-filter-block">
                <div className="range-inputs-row">
                  <input
                    type="number"
                    placeholder="Min mph"
                    value={minSpeed}
                    onChange={(e) => {
                      setMinSpeed(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="filter-number-input"
                  />
                  <span className="range-separator">-</span>
                  <input
                    type="number"
                    placeholder="Max mph"
                    value={maxSpeed}
                    onChange={(e) => {
                      setMaxSpeed(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="filter-number-input"
                  />
                </div>
                <label className="speed-toggle-label">
                  <input
                    type="checkbox"
                    checked={highSpeedOnly}
                    onChange={(e) => {
                      setHighSpeedOnly(e.target.checked);
                      setCurrentPage(1);
                    }}
                  />
                  <span>&gt;60 MPH Only</span>
                </label>
              </div>
            </div>

            {/* Sort Controls */}
            <div className="filter-group">
              <label className="filter-label">Sort Records By</label>
              <div className="range-inputs-row">
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value)}
                  className="filter-input-select"
                >
                  <option value="trip_id">Trip ID</option>
                  <option value="fare_usd">Total Fare</option>
                  <option value="distance_miles">Distance</option>
                  <option value="duration_mins">Duration</option>
                  <option value="speed_mph">Speed (MPH)</option>
                  <option value="driver_payout_usd">Driver Payout</option>
                  <option value="timestamp">Timestamp</option>
                </select>
                <button
                  type="button"
                  className="btn-sort-dir"
                  onClick={() =>
                    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                  }
                  title={`Order: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
                >
                  {sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Chips / Badges Bar */}
      {activeFiltersCount > 0 && (
        <div className="active-filter-chips-bar">
          <span className="chips-label text-muted">Applied Filters:</span>
          {searchTerm && (
            <span className="filter-chip">
              Search: "{searchTerm}"
              <X size={12} onClick={() => setSearchTerm('')} />
            </span>
          )}
          {statusFilter !== 'ALL' && (
            <span className="filter-chip">
              Status: {statusFilter.replace('_', ' ')}
              <X size={12} onClick={() => setStatusFilter('ALL')} />
            </span>
          )}
          {pickupZoneFilter !== 'ALL' && (
            <span className="filter-chip">
              Pickup: {pickupZoneFilter}
              <X size={12} onClick={() => setPickupZoneFilter('ALL')} />
            </span>
          )}
          {dropoffZoneFilter !== 'ALL' && (
            <span className="filter-chip">
              Dropoff: {dropoffZoneFilter}
              <X size={12} onClick={() => setDropoffZoneFilter('ALL')} />
            </span>
          )}
          {driverFilter !== 'ALL' && (
            <span className="filter-chip">
              Driver: {driverFilter}
              <X size={12} onClick={() => setDriverFilter('ALL')} />
            </span>
          )}
          {(minFare || maxFare) && (
            <span className="filter-chip">
              Fare: ${minFare || '0'} - ${maxFare || 'MAX'}
              <X
                size={12}
                onClick={() => {
                  setMinFare('');
                  setMaxFare('');
                }}
              />
            </span>
          )}
          {(minDistance || maxDistance) && (
            <span className="filter-chip">
              Dist: {minDistance || '0'} - {maxDistance || 'MAX'} mi
              <X
                size={12}
                onClick={() => {
                  setMinDistance('');
                  setMaxDistance('');
                }}
              />
            </span>
          )}
          {highSpeedOnly && (
            <span className="filter-chip">
              Speed &gt; 60 MPH
              <X size={12} onClick={() => setHighSpeedOnly(false)} />
            </span>
          )}
          <button
            type="button"
            className="clear-all-chips-btn"
            onClick={handleResetFilters}
          >
            Clear All
          </button>
        </div>
      )}

      {/* Main Table */}
      <div className="table-responsive">
        <table className="trips-data-table">
          <thead>
            <tr>
              <th onClick={() => handleSortClick('trip_id')} className="cursor-pointer">
                <div className="th-content">
                  <span>Trip ID (PK)</span>
                  {sortField === 'trip_id' && (
                    sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                  )}
                </div>
              </th>
              <th>Driver</th>
              <th onClick={() => handleSortClick('timestamp')} className="cursor-pointer">
                <div className="th-content">
                  <span>Pickup Time</span>
                  {sortField === 'timestamp' && (
                    sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                  )}
                </div>
              </th>
              <th>Route (Pickup → Dropoff)</th>
              <th
                onClick={() => handleSortClick('distance_miles')}
                className="text-right cursor-pointer"
              >
                <div className="th-content justify-end">
                  <span>Distance</span>
                  {sortField === 'distance_miles' && (
                    sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSortClick('fare_usd')}
                className="text-right cursor-pointer"
              >
                <div className="th-content justify-end">
                  <span>Fare (USD)</span>
                  {sortField === 'fare_usd' && (
                    sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSortClick('driver_payout_usd')}
                className="text-right cursor-pointer"
              >
                <div className="th-content justify-end">
                  <span>Payout (75%)</span>
                  {sortField === 'driver_payout_usd' && (
                    sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSortClick('speed_mph')}
                className="text-right cursor-pointer"
              >
                <div className="th-content justify-end">
                  <span>Speed</span>
                  {sortField === 'speed_mph' && (
                    sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSortClick('duration_mins')}
                className="text-right cursor-pointer"
              >
                <div className="th-content justify-end">
                  <span>Duration</span>
                  {sortField === 'duration_mins' && (
                    sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                  )}
                </div>
              </th>
              <th>Status</th>
              <th className="text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTrips.length === 0 ? (
              <tr>
                <td colSpan="11" className="no-records-row">
                  <div className="empty-state-box">
                    <SlidersHorizontal size={24} className="text-muted" />
                    <p>No ride records found matching the active filter criteria.</p>
                    <button
                      type="button"
                      className="btn-reset-filters"
                      onClick={handleResetFilters}
                    >
                      Reset All Filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedTrips.map((trip) => {
                const fare = Number(trip.fare_usd) || 0;
                const payout =
                  Number(trip.driver_payout_usd) || fare * 0.75;
                const speed =
                  Number(trip.speed_mph) ||
                  (trip.duration_mins > 0
                    ? (trip.distance_miles * 60) / trip.duration_mins
                    : 0);

                const statusStr = (trip.status || '').toLowerCase();
                const isFraud =
                  statusStr.includes('fraud') ||
                  trip.is_fraud === true ||
                  speed > 85;

                return (
                  <tr
                    key={trip.trip_id}
                    className={`trip-table-row ${isFraud ? 'row-fraud-alert' : ''}`}
                  >
                    {/* Trip ID */}
                    <td>
                      <button
                        type="button"
                        className="trip-id-btn"
                        onClick={() => onSelectTrip(trip)}
                        title="Click to view 80-byte mainframe mapping"
                      >
                        <span className="mono trip-id-text">{trip.trip_id}</span>
                      </button>
                    </td>

                    {/* Driver */}
                    <td>
                      <div className="driver-cell">
                        <span className="mono driver-id">{trip.driver_id}</span>
                        {trip.driver_name && (
                          <span className="driver-name">{trip.driver_name}</span>
                        )}
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td>
                      <span className="mono timestamp-text">{trip.timestamp}</span>
                    </td>

                    {/* Route */}
                    <td>
                      <div className="route-cell">
                        <span className="zone-name" title={trip.pickup_zone}>
                          {trip.pickup_zone || `Zone ${trip.pickup_zone_id || '???'}`}
                        </span>
                        <ArrowRight size={12} className="route-arrow text-muted" />
                        <span className="zone-name" title={trip.dropoff_zone}>
                          {trip.dropoff_zone || `Zone ${trip.dropoff_zone_id || '???'}`}
                        </span>
                      </div>
                    </td>

                    {/* Distance */}
                    <td className="text-right">
                      <span className="mono">
                        {Number(trip.distance_miles).toFixed(2)} mi
                      </span>
                    </td>

                    {/* Fare */}
                    <td className="text-right">
                      <span className="mono fare-text">${fare.toFixed(2)}</span>
                    </td>

                    {/* Payout */}
                    <td className="text-right">
                      <span className="mono payout-text">${payout.toFixed(2)}</span>
                    </td>

                    {/* Speed */}
                    <td className="text-right">
                      <span
                        className={`mono speed-text ${speed > 85 ? 'speed-fraud' : ''}`}
                      >
                        {speed.toFixed(1)} mph
                      </span>
                    </td>

                    {/* Duration */}
                    <td className="text-right">
                      <span className="mono duration-text">
                        {trip.duration_mins} min
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      {isFraud ? (
                        <span className="badge badge-danger">
                          <ShieldAlert size={11} />
                          {trip.status || 'FRAUD FLAG'}
                        </span>
                      ) : (
                        <span className="badge badge-success">
                          <CheckCircle2 size={11} />
                          CLEAN
                        </span>
                      )}
                    </td>

                    {/* Inspect Mainframe */}
                    <td className="text-center">
                      <button
                        type="button"
                        className="btn-inspect"
                        onClick={() => onSelectTrip(trip)}
                        title="Inspect 80-byte records from FILE1 and FILE2"
                      >
                        <Eye size={13} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="table-pagination-footer">
        <span className="text-muted pagination-info">
          Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>{' '}
          ({sortedTrips.length} matching rides)
        </span>

        <div className="pagination-buttons">
          <button
            type="button"
            className="btn-page"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={15} />
            <span>Prev</span>
          </button>
          <button
            type="button"
            className="btn-page"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            <span>Next</span>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
