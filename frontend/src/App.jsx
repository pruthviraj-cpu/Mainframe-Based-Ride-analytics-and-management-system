import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StatCards from './components/StatCards';
import TripsTable from './components/TripsTable';
import TripDetailModal from './components/TripDetailModal';
import FileUploadModal from './components/FileUploadModal';
import DriversView from './components/DriversView';
import AnalyticsView from './components/AnalyticsView';
import MainframePipelineView from './components/MainframePipelineView';
import MainframeConsoleView from './components/MainframeConsoleView';

import {
  getDashboardSummary,
  getTrips,
  getDrivers,
  getHourlyAnalytics,
  getZoneAnalytics,
  getMainframeJobs,
  USE_MOCK,
} from './services/api';

import { List, Users, BarChart3, GitFork, Terminal, CheckCircle2 } from 'lucide-react';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('trips'); // 'trips' | 'drivers' | 'analytics' | 'pipeline' | 'console'
  const [summary, setSummary] = useState(null);
  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [zoneData, setZoneData] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiSource, setApiSource] = useState('mock');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeZoneFilter, setActiveZoneFilter] = useState(null);

  // Switch to Trips tab with zone filter when clicking map or zone charts
  const handleZoneSelect = (zoneIdOrName) => {
    setActiveZoneFilter(zoneIdOrName);
    setActiveTab('trips');
  };

  // Load all initial data from API service
  const loadDashboardData = async () => {
    setIsRefreshing(true);
    try {
      const [sumRes, tripsRes, drvRes, hourlyRes, zoneRes, jobsRes] = await Promise.all([
        getDashboardSummary(),
        getTrips(),
        getDrivers(),
        getHourlyAnalytics(),
        getZoneAnalytics(),
        getMainframeJobs(),
      ]);

      setSummary(sumRes.data);
      setTrips(tripsRes.data);
      setDrivers(drvRes.data);
      setHourlyData(hourlyRes.data);
      setZoneData(zoneRes.data);
      setJobs(jobsRes.data);
      setApiSource(sumRes.source);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 300);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        summary={summary}
        onRefresh={loadDashboardData}
        isRefreshing={isRefreshing}
        apiSource={apiSource}
        onOpenUpload={() => setIsUploadOpen(true)}
      />

      {/* Main Container */}
      <main className="main-content">
        {/* Primary Dashboard Navigation Bar (Above KPI Overview Cards) */}
        <nav className="dashboard-navbar" aria-label="Dashboard Navigation">
          <div className="nav-tabs-group">
            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'trips' ? 'active' : ''}`}
              onClick={() => setActiveTab('trips')}
            >
              <List size={17} className="nav-tab-icon" />
              <span className="nav-tab-label">Clean Trips Output</span>
              <span className="nav-tab-badge">{trips.length}</span>
            </button>

            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'drivers' ? 'active' : ''}`}
              onClick={() => setActiveTab('drivers')}
            >
              <Users size={17} className="nav-tab-icon" />
              <span className="nav-tab-label">Driver Fleet</span>
              <span className="nav-tab-badge">{drivers.length}</span>
            </button>

            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart3 size={17} className="nav-tab-icon" />
              <span className="nav-tab-label">Demand & Zones</span>
            </button>

            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'pipeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('pipeline')}
            >
              <GitFork size={17} className="nav-tab-icon" />
              <span className="nav-tab-label">Mainframe Pipeline</span>
            </button>

            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'console' ? 'active' : ''}`}
              onClick={() => setActiveTab('console')}
            >
              <Terminal size={17} className="nav-tab-icon" />
              <span className="nav-tab-label">Live Console Spool</span>
              <span className="nav-live-pulse-badge">
                <span className="live-dot"></span>
                LIVE
              </span>
            </button>
          </div>
        </nav>

        {/* KPI Overview Cards (Below Navbar) */}
        <StatCards summary={summary} />

        {/* Tab View Content */}
        {activeTab === 'trips' && (
          <TripsTable
            trips={trips}
            summary={summary}
            onSelectTrip={(t) => setSelectedTrip(t)}
            activeZoneFilter={activeZoneFilter}
            onClearZoneFilter={() => setActiveZoneFilter(null)}
          />
        )}

        {activeTab === 'drivers' && (
          <DriversView drivers={drivers} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            hourlyData={hourlyData}
            zoneData={zoneData}
            summary={summary}
            onSelectZone={handleZoneSelect}
            onPipelineRerun={loadDashboardData}
          />
        )}

        {activeTab === 'pipeline' && (
          <MainframePipelineView
            jobs={jobs}
            summary={summary}
            onOpenConsole={() => setActiveTab('console')}
          />
        )}

        {activeTab === 'console' && (
          <MainframeConsoleView onPipelineFinished={loadDashboardData} />
        )}
      </main>

      {/* File Ingestion Modal */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={loadDashboardData}
      />

      {/* 80-Byte Record Inspector Modal */}
      {selectedTrip && (
        <TripDetailModal trip={selectedTrip} onClose={() => setSelectedTrip(null)} />
      )}
    </div>
  );
}
