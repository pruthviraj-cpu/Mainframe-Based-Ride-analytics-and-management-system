import React, { useState, useMemo } from 'react';
import { Search, Download, Eye, ChevronLeft, ChevronRight, SlidersHorizontal, MapPin, ArrowRight } from 'lucide-react';

export default function TripsTable({ trips, onSelectTrip }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Filtered trips
  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      const matchSearch =
        t.trip_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.driver_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.pickup_zone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.dropoff_zone.toLowerCase().includes(searchTerm.toLowerCase());

      const matchZone =
        zoneFilter === 'ALL' ||
        t.pickup_zone_id === zoneFilter ||
        t.dropoff_zone_id === zoneFilter;

      return matchSearch && matchZone;
    });
  }, [trips, searchTerm, zoneFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredTrips.length / pageSize) || 1;
  const paginatedTrips = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTrips.slice(start, start + pageSize);
  }, [filteredTrips, currentPage, pageSize]);

  // Download simple CSV
  const handleExportCSV = () => {
    const headers = ["Trip_ID", "Driver_ID", "Timestamp", "Pickup_Zone", "Dropoff_Zone", "Distance_Miles", "Fare_USD", "Duration_Mins"];
    const rows = filteredTrips.map(t => [
      t.trip_id,
      t.driver_id,
      t.timestamp,
      `"${t.pickup_zone}"`,
      `"${t.dropoff_zone}"`,
      t.distance_miles,
      t.fare_usd,
      t.duration_mins,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `clean_mainframe_rides_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="card table-container">
      {/* Table Toolbar */}
      <div className="table-toolbar">
        <div className="toolbar-left">
          <div className="search-input-wrapper">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search Trip ID, Driver, or Zone..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="search-input"
            />
          </div>

          <div className="filter-select-wrapper">
            <SlidersHorizontal size={14} className="filter-icon" />
            <select
              value={zoneFilter}
              onChange={(e) => {
                setZoneFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="ALL">All Zones</option>
              <option value="230">Times Sq (Zone 230)</option>
              <option value="161">Midtown Center (Zone 161)</option>
              <option value="132">JFK Airport (Zone 132)</option>
              <option value="138">LaGuardia Airport (Zone 138)</option>
              <option value="237">Upper East Side (Zone 237)</option>
              <option value="181">Park Slope (Zone 181)</option>
            </select>
          </div>
        </div>

        <div className="toolbar-right">
          <span className="results-count text-secondary">
            Showing <strong>{filteredTrips.length}</strong> clean records
          </span>
          <button 
            type="button" 
            className="btn-export"
            onClick={handleExportCSV}
            title="Export clean merged data to CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="table-responsive">
        <table className="trips-data-table">
          <thead>
            <tr>
              <th>Trip ID (PK)</th>
              <th>Driver</th>
              <th>Pickup Time</th>
              <th>Route (Pickup → Dropoff)</th>
              <th className="text-right">Distance</th>
              <th className="text-right">Fare (USD)</th>
              <th className="text-right">Duration</th>
              <th>Status</th>
              <th className="text-center">Mainframe Line</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTrips.length === 0 ? (
              <tr>
                <td colSpan="9" className="no-records-row">
                  No ride records found matching the filter criteria.
                </td>
              </tr>
            ) : (
              paginatedTrips.map((trip) => (
                <tr key={trip.trip_id} className="trip-table-row">
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
                      <span className="driver-name">{trip.driver_name}</span>
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
                        {trip.pickup_zone} <span className="zone-tag">[{trip.pickup_zone_id}]</span>
                      </span>
                      <ArrowRight size={12} className="route-arrow text-muted" />
                      <span className="zone-name" title={trip.dropoff_zone}>
                        {trip.dropoff_zone} <span className="zone-tag">[{trip.dropoff_zone_id}]</span>
                      </span>
                    </div>
                  </td>

                  {/* Distance */}
                  <td className="text-right">
                    <span className="mono">{trip.distance_miles.toFixed(2)} mi</span>
                  </td>

                  {/* Fare */}
                  <td className="text-right">
                    <span className="mono fare-text">${trip.fare_usd.toFixed(2)}</span>
                  </td>

                  {/* Duration */}
                  <td className="text-right">
                    <span className="mono duration-text">{trip.duration_mins} min</span>
                  </td>

                  {/* Status */}
                  <td>
                    <span className="badge badge-success">CLEAN</span>
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="table-pagination-footer">
        <span className="text-muted pagination-info">
          Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
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
