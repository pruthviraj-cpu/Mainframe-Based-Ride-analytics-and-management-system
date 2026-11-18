import React from 'react';
import { Car, DollarSign, Wallet, ShieldAlert, CheckCircle2, ArrowUpRight } from 'lucide-react';

export default function StatCards({ summary }) {
  if (!summary) return null;

  const totalRev = Number(summary.totalRevenue) || 0;
  const driverPayout75 = Number(summary.driverPayouts) || (totalRev * 0.75);
  const platformComm25 = Number(summary.platformCommission) || (totalRev * 0.25);
  const fraudCount = Number(summary.fraudTripsCount) || 0;
  const totalTrips = Number(summary.totalTrips) || Number(summary.cleanMergedRecords) || 0;

  const cards = [
    {
      title: 'Gross Fleet Revenue',
      value: `$${totalRev.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtext: `Avg $${(summary.avgFareUSD || (totalTrips > 0 ? totalRev / totalTrips : 0)).toFixed(2)} / trip`,
      icon: DollarSign,
      trend: 'positive',
      meta: 'FILE1 Raw Fares',
      accent: 'border-l-4 border-sky-500',
    },
    {
      title: 'Driver Disbursements (75%)',
      value: `$${driverPayout75.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtext: '75% Net to active drivers',
      icon: Wallet,
      trend: 'positive',
      meta: 'COBOL Calculated',
      accent: 'border-l-4 border-emerald-500',
    },
    {
      title: 'Platform Commission (25%)',
      value: `$${platformComm25.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtext: '25% Net platform margin',
      icon: DollarSign,
      trend: 'positive',
      meta: 'FILE3 Master Ledger',
      accent: 'border-l-4 border-indigo-500',
    },
    {
      title: 'Clean Trips Processed',
      value: totalTrips.toLocaleString(),
      subtext: `${summary.duplicatesRemoved || 10} duplicates purged`,
      icon: Car,
      trend: 'positive',
      meta: 'Balance-Line Merged',
      accent: 'border-l-4 border-blue-500',
    },
    {
      title: 'Fraud Anomalies Quarantined',
      value: `${fraudCount} ${fraudCount === 1 ? 'Trip' : 'Trips'}`,
      subtext: fraudCount > 0 ? 'Zero payout disbursed' : 'No speed violations',
      icon: fraudCount > 0 ? ShieldAlert : CheckCircle2,
      trend: fraudCount > 0 ? 'negative' : 'positive',
      meta: 'FILE4 Fraud Report',
      accent: fraudCount > 0 ? 'border-l-4 border-rose-500' : 'border-l-4 border-emerald-500',
    },
  ];

  return (
    <div className="stat-cards-grid">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div key={idx} className={`card stat-card ${card.accent}`}>
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
