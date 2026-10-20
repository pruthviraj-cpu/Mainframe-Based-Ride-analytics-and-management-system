import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StatCards from './components/StatCards';
import TripsTable from './components/TripsTable';
import TripDetailModal from './components/TripDetailModal';
import DriversView from './components/DriversView';
import AnalyticsView from './components/AnalyticsView';
import MainframePipelineView from './components/MainframePipelineView';

import {
  getDashboardSummary,
  getTrips,
  getDrivers,
  getHourlyAnalytics,
  getZoneAnalytics,
  getMainframeJobs,
  USE_MOCK,
} from './services/api';

import { List, Users, BarChart3, GitFork, CheckCircle2 } from 'lucide-react';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('trips'); // 'trips' | 'drivers' | 'analytics' | 'pipeline'
  const [summary, setSummary] = useState(null);
  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [zoneData, setZoneData] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiSource, setApiSource] = useState('mock');

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
      />

      {/* Main Container */}
      <main className="main-content">
        {/* KPI Overview Cards */}
        <StatCards summary={summary} />

        {/* Navigation Tabs (Segmented Control) */}
        <div className="tabs-navigation-wrapper">
          <div className="segmented-control">
            <button
              type="button"
              className={`tab-btn ${activeTab === 'trips' ? 'active' : ''}`}
              onClick={() => setActiveTab('trips')}
            >
              <List size={15} />
              <span>Clean Trips Output</span>
              <span className="tab-badge">{trips.length}</span>
            </button>

            <button
              type="button"
              className={`tab-btn ${activeTab === 'drivers' ? 'active' : ''}`}
              onClick={() => setActiveTab('drivers')}
            >
              <Users size={15} />
              <span>Driver Fleet</span>
              <span className="tab-badge">{drivers.length}</span>
            </button>

            <button
              type="button"
              className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart3 size={15} />
              <span>Demand & Zones</span>
            </button>

            <button
              type="button"
              className={`tab-btn ${activeTab === 'pipeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('pipeline')}
            >
              <GitFork size={15} />
              <span>Mainframe Pipeline</span>
            </button>
          </div>

          <div className="tabs-right-meta text-muted">
            <span className="mono">LRECL=80, RECFM=FB</span>
            <span>•</span>
            <span>z/OS Sequential Data</span>
          </div>
        </div>

        {/* Tab View Content */}
        {activeTab === 'trips' && (
          <TripsTable trips={trips} onSelectTrip={(t) => setSelectedTrip(t)} />
        )}

        {activeTab === 'drivers' && (
          <DriversView drivers={drivers} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView hourlyData={hourlyData} zoneData={zoneData} />
        )}

        {activeTab === 'pipeline' && (
          <MainframePipelineView jobs={jobs} summary={summary} />
        )}
      </main>

      {/* 80-Byte Record Inspector Modal */}
      {selectedTrip && (
        <TripDetailModal trip={selectedTrip} onClose={() => setSelectedTrip(null)} />
      )}

      {/* Minimal Footer */}
      <footer className="app-footer">
        <div className="footer-inner">
          <span>
            Mainframe-Based Ride Analytics & Management System — IBM z/OS Batch Pipeline
          </span>
          <span className="mono">
            FastAPI / JCL / REXX Connection Ready
          </span>
        </div>
      </footer>
    </div>
  );
}
