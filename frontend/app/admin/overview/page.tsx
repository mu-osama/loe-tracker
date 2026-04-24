'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import { RouteGuard } from '@/components/layout/RouteGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useFeedback } from '@/components/ui/FeedbackProvider';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { ADMIN_OVERVIEW_QUERY } from '@/lib/graphql/documents';

export default function AdminOverviewPage() {
  const { user } = useAuth();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [status, setStatus] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [overUtilizedOnly, setOverUtilizedOnly] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { showError, showSuccess } = useFeedback();
  const { data, refetch } = useQuery(ADMIN_OVERVIEW_QUERY, {
    variables: {
      year,
      month,
      country: country || undefined,
      city: city || undefined,
      status: status || undefined,
      overUtilized: overUtilizedOnly || undefined,
    },
  });
  useRealtimeRefresh(
    {
      topics: ['LOE', 'USER'],
      year,
      month,
    },
    refetch,
  );

  const rows = data?.adminLoeOverview || [];
  const filteredRows = useMemo(
    () =>
      rows.filter((row: any) => {
        if (country && row.user.country !== country) return false;
        if (city && row.user.city !== city) return false;
        if (overdueOnly && !row.isDelayed) return false;
        return true;
      }),
    [city, country, overdueOnly, rows],
  );

  const delayedCount = rows.filter((row: any) => row.isDelayed).length;
  const countries = Array.from(
    new Set<string>(rows.map((row: any) => row.user.country).filter(Boolean)),
  );
  const cities = Array.from(
    new Set<string>(
      rows
        .filter((row: any) => !country || row.user.country === country)
        .map((row: any) => row.user.city)
        .filter(Boolean),
    ),
  );

  async function handleExportCsv() {
    setExporting(true);

    try {
      const Papa = (await import('papaparse')).default;
      const csv = Papa.unparse(
        filteredRows.map((row: any) => ({
          'Sheet ID': row.id,
          'User ID': row.user?.id || '—',
          User: row.user?.name || '—',
          'User Email': row.user?.email || '—',
          Country: row.user?.country || '—',
          City: row.user?.city || '—',
          Reviewer: row.reviewer?.name || '—',
          'Reviewer Email': row.reviewer?.email || '—',
          Status: row.status || '—',
          Delayed: row.isDelayed ? 'Yes' : 'No',
          'Total Hours': row.totalHours,
          'Utilization Percent': row.utilizationPercent,
        })),
      );
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStamp = new Date().toISOString().slice(0, 10);

      link.href = url;
      link.setAttribute('download', `admin-overview-${dateStamp}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      showSuccess(`Exported ${filteredRows.length} overview row(s) to CSV.`);
    } catch (error) {
      showError('Unable to export overview data.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <RouteGuard>
      <div className="app-shell">
        <Sidebar />
        <div className="shell-main">
          <Topbar user={user} title="LOE Tracker" />
          <main className="page stack">
            <div className="page-header">
              <div className="page-title">
                <div className="section-caption">Global View</div>
                <h1>Admin Overview</h1>
                <p>Global level of effort management and utilization tracking.</p>
              </div>
              <div className="toolbar-group">
                <Button className="secondary" onClick={handleExportCsv} loading={exporting} loadingText="Exporting...">
                  Download CSV
                </Button>
              </div>
            </div>

            {delayedCount ? (
              <div className="soft-banner info">
                <div>{delayedCount} users have delayed LOE submissions.</div>
              </div>
            ) : null}

            <div className="metric-grid">
              <div className="metric-card">
                <div className="section-caption">Tracked Sheets</div>
                <div className="metric-card-value">{rows.length}</div>
              </div>
              <div className="metric-card">
                <div className="section-caption">Delayed</div>
                <div className="metric-card-value">{delayedCount}</div>
              </div>
              <div className="metric-card">
                <div className="section-caption">Over-Utilized</div>
                <div className="metric-card-value">
                  {rows.filter((row: any) => row.utilizationPercent >= 120).length}
                </div>
              </div>
              <div className="metric-card">
                <div className="section-caption">Approved</div>
                <div className="metric-card-value">
                  {rows.filter((row: any) => row.status === 'APPROVED').length}
                </div>
              </div>
            </div>

            <div className="card stack">
              <div className="overview-filters">
                <div className="field">
                  <label>Country</label>
                  <Select value={country} onChange={(event) => setCountry(event.target.value)}>
                    <option value="">All Countries</option>
                    {countries.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="field">
                  <label>City</label>
                  <Select value={city} onChange={(event) => setCity(event.target.value)}>
                    <option value="">All Cities</option>
                    {cities.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="field">
                  <label>Status</label>
                  <Select value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="SUBMITTED">SUBMITTED</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REOPENED">REOPENED</option>
                  </Select>
                </div>
                <label className="overview-toggle">
                  <input type="checkbox" checked={overdueOnly} onChange={(event) => setOverdueOnly(event.target.checked)} />
                  <span>Overdue Only</span>
                </label>
                <label className="overview-toggle">
                  <input
                    type="checkbox"
                    checked={overUtilizedOnly}
                    onChange={(event) => setOverUtilizedOnly(event.target.checked)}
                  />
                  <span>Over-Utilized</span>
                </label>
                <div className="overview-actions">
                  <Button
                    className="ghost"
                    onClick={() => {
                      setCountry('');
                      setCity('');
                      setStatus('');
                      setOverdueOnly(false);
                      setOverUtilizedOnly(false);
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>

              <div className="table-card overview-table-card">
                <table className="table">
                  <colgroup>
                    <col className="overview-col-user" />
                    <col className="overview-col-location" />
                    <col className="overview-col-reviewer" />
                    <col className="overview-col-status" />
                    <col className="overview-col-delayed" />
                    <col className="overview-col-hours" />
                    <col className="overview-col-utilization" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Country / City</th>
                      <th>Reviewer</th>
                      <th>Status</th>
                      <th>Delayed</th>
                      <th>Total Hrs</th>
                      <th>Utilization</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row: any) => (
                      <tr key={row.id}>
                        <td>
                          <div style={{ fontWeight: 700 }}>{row.user.name}</div>
                          <div className="helper-text">{row.user.email}</div>
                        </td>
                        <td>{[row.user.country, row.user.city].filter(Boolean).join(' / ') || '—'}</td>
                        <td>{row.reviewer?.name || '—'}</td>
                        <td>
                          <Badge tone={row.status.toLowerCase()}>{row.status}</Badge>
                        </td>
                        <td>{row.isDelayed ? <Badge tone="delayed">Overdue</Badge> : '—'}</td>
                        <td>{row.totalHours}</td>
                        <td className={row.utilizationPercent >= 120 ? 'loe-summary-highlight' : ''}>
                          {row.utilizationPercent}% {row.utilizationPercent >= 120 ? '⚠' : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>
    </RouteGuard>
  );
}
