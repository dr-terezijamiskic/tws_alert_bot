'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Trade, TradeMetrics } from '@/lib/types';

export default function ReviewPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [metrics, setMetrics] = useState<TradeMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tradesRes, metricsRes] = await Promise.all([
        fetch('/api/trades'),
        fetch('/api/metrics'),
      ]);

      if (!tradesRes.ok || !metricsRes.ok) {
        throw new Error('Failed to load data');
      }

      const tradesData = await tradesRes.json();
      const metricsData = await metricsRes.json();

      setTrades(tradesData);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (startIso: string, endIso: string | null) => {
    if (!endIso) return 'Active';
    const start = new Date(startIso);
    const end = new Date(endIso);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  if (loading) {
    return <div className="text-3xl text-center mt-20">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-5xl font-bold">Trading Journal</h1>
        <Link
          href="/new"
          className="px-8 py-4 text-2xl font-bold bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
        >
          New Trade
        </Link>
      </div>

      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-xl text-muted mb-2">Total Trades</p>
            <p className="text-4xl font-bold">{metrics.totalTrades}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-xl text-muted mb-2">Avg Exit Delay</p>
            <p className="text-4xl font-bold">
              {metrics.avgExitDelaySeconds !== null
                ? `${metrics.avgExitDelaySeconds.toFixed(1)}s`
                : 'N/A'}
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-xl text-muted mb-2">EXIT_NOW Ignored &gt;60s</p>
            <p className="text-4xl font-bold">
              {metrics.exitNowIgnoredPct !== null
                ? `${metrics.exitNowIgnoredPct.toFixed(1)}%`
                : 'N/A'}
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-xl text-muted mb-2">Rule Violations</p>
            <p className="text-4xl font-bold text-danger">{metrics.ruleViolationCount}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-xl text-muted mb-2">Avg Reduces/Trade</p>
            <p className="text-4xl font-bold">{metrics.avgReduceCountPerTrade.toFixed(2)}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-xl text-muted mb-2">Avg Hold Time</p>
            <p className="text-4xl font-bold">
              {metrics.avgHoldTimeMinutes !== null
                ? `${metrics.avgHoldTimeMinutes.toFixed(0)}m`
                : 'N/A'}
            </p>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="text-left px-6 py-4 text-xl font-medium text-muted">Ticker</th>
                <th className="text-left px-6 py-4 text-xl font-medium text-muted">Direction</th>
                <th className="text-left px-6 py-4 text-xl font-medium text-muted">Setup</th>
                <th className="text-left px-6 py-4 text-xl font-medium text-muted">Entry Time</th>
                <th className="text-left px-6 py-4 text-xl font-medium text-muted">Duration</th>
                <th className="text-left px-6 py-4 text-xl font-medium text-muted">Status</th>
                <th className="text-left px-6 py-4 text-xl font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {trades.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center px-6 py-12 text-2xl text-muted">
                    No trades yet. Start by creating a new trade.
                  </td>
                </tr>
              ) : (
                trades.map((trade) => (
                  <tr key={trade.id} className="border-b border-border hover:bg-card-hover transition-colors">
                    <td className="px-6 py-4 text-xl font-mono font-bold">{trade.ticker}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded text-lg font-medium ${
                        trade.direction === 'LONG'
                          ? 'bg-success bg-opacity-20 text-success'
                          : 'bg-danger bg-opacity-20 text-danger'
                      }`}>
                        {trade.direction}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-lg max-w-xs truncate">{trade.setup}</td>
                    <td className="px-6 py-4 text-lg text-muted font-mono">
                      {formatDate(trade.entryTime)}
                    </td>
                    <td className="px-6 py-4 text-lg font-mono">
                      {formatDuration(trade.entryTime, trade.closedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded text-lg font-medium ${
                        trade.status === 'CLOSED'
                          ? 'bg-muted bg-opacity-20 text-muted'
                          : trade.status === 'EXIT_NOW'
                          ? 'bg-danger text-white'
                          : 'bg-success bg-opacity-20 text-success'
                      }`}>
                        {trade.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {trade.status !== 'CLOSED' ? (
                        <Link
                          href={`/trade/${trade.id}`}
                          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded text-lg font-medium transition-colors"
                        >
                          Monitor
                        </Link>
                      ) : (
                        <Link
                          href={`/trade/${trade.id}`}
                          className="px-4 py-2 bg-muted hover:bg-opacity-80 text-white rounded text-lg font-medium transition-colors"
                        >
                          View
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
