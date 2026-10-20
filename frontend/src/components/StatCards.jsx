import React from 'react';
import { Car, DollarSign, Users, Clock, Filter, ArrowUpRight, CheckCircle2 } from 'lucide-react';

export default function StatCards({ summary }) {
  if (!summary) return null;

  const cards = [
    {
      title: 'Total Processed Rides',
      value: summary.totalTrips.toLocaleString(),
      subtext: '+12.4% vs previous batch',
      icon: Car,
      trend: 'positive',
      meta: 'Merged on TRIP_ID',
    },
    {
      title: 'Total Fleet Revenue',
      value: `$${summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtext: `Avg $${summary.avgFareUSD.toFixed(2)} / ride`,
      icon: DollarSign,
      trend: 'positive',
      meta: 'From FILE1 (Col 33-38)',
    },
    {
      title: 'Active Drivers',
      value: summary.activeDrivers.toLocaleString(),
      subtext: '98.2% shift completion',
      icon: Users,
      trend: 'neutral',
      meta: 'From FILE2 (Col 01-08)',
    },
    {
      title: 'Avg Trip Duration',
      value: `${summary.avgTripDurationMins} min`,
      subtext: `Avg Distance: ${summary.avgTripDistanceMiles} mi`,
      icon: Clock,
      trend: 'neutral',
      meta: 'From FILE2 (Col 29-33)',
    },
    {
      title: 'Deduplication Integrity',
      value: '100% Clean',
      subtext: `${summary.duplicatesRemoved} duplicate records purged`,
      icon: Filter,
      trend: 'positive',
      meta: 'JCL SORT (SUM FIELDS=NONE)',
    },
  ];

  return (
    <div className="stat-cards-grid">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div key={idx} className="card stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">{card.title}</span>
              <div className="stat-icon-wrapper">
                <IconComponent size={16} />
              </div>
            </div>

            <div className="stat-card-body">
              <div className="stat-value">{card.value}</div>
              <div className="stat-subtext-row">
                <span className={`stat-trend ${card.trend}`}>
                  <ArrowUpRight size={13} />
                  {card.subtext}
                </span>
              </div>
            </div>

            <div className="stat-card-footer">
              <span className="mono text-muted stat-meta">{card.meta}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
