'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import { LoeGrid } from '@/components/loe/LoeGrid';
import { RouteGuard } from '@/components/layout/RouteGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { useFeedback } from '@/components/ui/FeedbackProvider';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { ALLOCATIONS_QUERY, FIXED_CATEGORIES_QUERY } from '@/lib/graphql/documents';
import { useLoeSheet } from '@/hooks/useLoeSheet';
import { getDaysInMonth, getWorkingDays, isWeekend } from '@/lib/utils/loe';

export default function MonthlyLoePage({
  params,
  searchParams,
}: {
  params: { year: string; month: string };
  searchParams?: { userId?: string };
}) {
  const { user } = useAuth();
  const year = Number(params.year);
  const month = Number(params.month);
  const [exportingProjects, setExportingProjects] = useState(false);
  const [exportingSheet, setExportingSheet] = useState(false);
  const { showError, showSuccess } = useFeedback();
  const targetUserId = searchParams?.userId || user?.id;
  const { sheet, refetch: refetchSheet } = useLoeSheet(year, month, targetUserId);
  const { data: allocationsData, refetch: refetchAllocations } = useQuery(ALLOCATIONS_QUERY, {
    skip: !targetUserId,
    variables: { userId: targetUserId },
  });
  const { data: fixedData } = useQuery(FIXED_CATEGORIES_QUERY);

  useRealtimeRefresh(
    {
      topics: ['LOE', 'ALLOCATION'],
      userId: targetUserId,
      year,
      month,
    },
    async () => {
      await Promise.all([refetchSheet(), refetchAllocations()]);
    },
    !targetUserId,
  );

  const categories = useMemo(
    () => [
      ...((fixedData?.fixedCategories || []).map((category: any) => ({
        id: category.id,
        name: category.name,
        kind: 'fixed' as const,
      }))),
      ...((allocationsData?.allocations || []).map((allocation: any) => ({
        id: allocation.project.id,
        name: allocation.project.name,
        kind: 'project' as const,
      }))),
    ],
    [allocationsData?.allocations, fixedData?.fixedCategories],
  );
  const allocations = allocationsData?.allocations || [];
  const expectedHours = getWorkingDays(year, month) * 8;
  const overallLoggedPercent = Number(sheet?.utilizationPercent || 0);
  const overUtilized = overallLoggedPercent >= 120;
  const projectBreakdown = useMemo(
    () =>
      allocations.map((allocation: any) => {
        const loggedHours = (sheet?.entries || [])
          .filter((entry: any) => entry.project?.id === allocation.project?.id)
          .reduce((sum: number, entry: any) => sum + Number(entry.hours || 0), 0);

        return {
          id: allocation.id,
          name: allocation.project?.name || 'Project',
          code: allocation.project?.code || '—',
          allocationPercent: Number(allocation.percentage || 0),
          loggedHours,
          loggedPercent: expectedHours ? Number(((loggedHours / expectedHours) * 100).toFixed(1)) : 0,
          differencePercent: expectedHours
            ? Number((((loggedHours / expectedHours) * 100) - Number(allocation.percentage || 0)).toFixed(1))
            : Number((0 - Number(allocation.percentage || 0)).toFixed(1)),
        };
      }),
    [allocations, expectedHours, sheet?.entries],
  );

  async function handleExportProjectsCsv() {
    setExportingProjects(true);

    try {
      const Papa = (await import('papaparse')).default;
      const csv = Papa.unparse(
        projectBreakdown.map((row) => ({
          'Allocation ID': row.id,
          Project: row.name,
          Code: row.code,
          'Assigned Percent': row.allocationPercent.toFixed(1),
          'Logged Hours': row.loggedHours.toFixed(1),
          'Logged Percent': row.loggedPercent.toFixed(1),
          'Difference Percent': row.differencePercent.toFixed(1),
        })),
      );
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStamp = new Date().toISOString().slice(0, 10);

      link.href = url;
      link.setAttribute('download', `assigned-projects-vs-logged-${year}-${String(month).padStart(2, '0')}-${dateStamp}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      showSuccess(`Exported ${projectBreakdown.length} project comparison row(s) to CSV.`);
    } catch (error) {
      showError('Unable to export assigned projects vs logged.');
    } finally {
      setExportingProjects(false);
    }
  }

  async function handleExportSheetCsv() {
    setExportingSheet(true);

    try {
      const Papa = (await import('papaparse')).default;
      const entryMap = new Map<string, any[]>();

      for (const entry of sheet?.entries || []) {
        const dayKey = String(new Date(entry.date).getDate());
        entryMap.set(dayKey, [...(entryMap.get(dayKey) || []), entry]);
      }

      const rows = Array.from({ length: getDaysInMonth(year, month) }, (_, index) => {
        const day = index + 1;
        const date = new Date(year, month - 1, day);
        const rowEntries = entryMap.get(String(day)) || [];
        const row: Record<string, string | number> = {
          Date: date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          Day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          Weekend: isWeekend(year, month, day) ? 'Yes' : 'No',
        };

        for (const category of categories) {
          const matched = rowEntries.find(
            (entry: any) => entry.project?.id === category.id || entry.fixedCategory?.id === category.id,
          );
          row[category.name] = matched ? Number(matched.hours).toFixed(1) : '';
        }

        row['Total Hours'] = rowEntries.reduce((sum: number, entry: any) => sum + Number(entry.hours || 0), 0).toFixed(1);
        row.Note = rowEntries.find((entry: any) => entry.note)?.note || '';

        return row;
      });

      const csv = Papa.unparse(rows);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStamp = new Date().toISOString().slice(0, 10);

      link.href = url;
      link.setAttribute('download', `loe-sheet-${year}-${String(month).padStart(2, '0')}-${dateStamp}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      showSuccess(`Exported ${rows.length} sheet row(s) to CSV.`);
    } catch (error) {
      showError('Unable to export this LOE sheet.');
    } finally {
      setExportingSheet(false);
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
                <div className="section-caption">Effort Management / Monthly Grid</div>
                <h1>
                  {new Date(year, month - 1).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </h1>
                <p>Review day-by-day allocations, fill missing weekdays, and submit when complete.</p>
              </div>
              <div className="card" style={{ minWidth: 280, padding: 16 }}>
                <div className="section-caption">Current Status</div>
                <div style={{ fontSize: 22, fontWeight: 700, marginTop: 8 }}>{sheet?.status || 'DRAFT'}</div>
                <div className="helper-text" style={{ marginTop: 6 }}>
                  Deadlines and utilization are calculated from the current month data.
                </div>
                <div className="helper-text" style={{ marginTop: 10 }}>
                  Reviewer: {sheet?.reviewer?.name || 'Not assigned yet'}
                </div>
              </div>
            </div>

            <div className="metric-grid">
              <div className="metric-card">
                <div className="section-caption">Assigned Projects</div>
                <div className="metric-card-value">{allocations.length}</div>
              </div>
              <div className="metric-card">
                <div className="section-caption">Expected Hours</div>
                <div className="metric-card-value">{expectedHours.toFixed(0)}</div>
              </div>
              <div className="metric-card">
                <div className="section-caption">Logged Hours</div>
                <div className="metric-card-value">{Number(sheet?.totalHours || 0).toFixed(1)}</div>
              </div>
              <div
                className="metric-card"
                style={
                  overUtilized
                    ? {
                        borderColor: '#f59e0b',
                        background: '#fffbeb',
                      }
                    : undefined
                }
              >
                <div className="section-caption">Overall Utilization</div>
                <div className="metric-card-value">
                  {overUtilized ? '⚠ ' : ''}
                  {overallLoggedPercent}%
                </div>
                {overUtilized ? (
                  <div className="helper-text" style={{ color: '#b45309', marginTop: 6 }}>
                    Over-utilized. Logged effort exceeds 120% of expected monthly hours.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="card table-card">
              <div className="toolbar" style={{ padding: 20, borderBottom: '1px solid #f1f5f9' }}>
                <div className="page-title">
                  <h3 style={{ margin: 0 }}>Assigned Projects vs Logged</h3>
                  <p>Track how your assigned project percentages compare with your logged month-to-date effort.</p>
                </div>
                <Button className="secondary" onClick={handleExportProjectsCsv} loading={exportingProjects} loadingText="Exporting...">
                  Download CSV
                </Button>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Code</th>
                    <th style={{ textAlign: 'right' }}>Assigned %</th>
                    <th style={{ textAlign: 'right' }}>Logged Hours</th>
                    <th style={{ textAlign: 'right' }}>Logged %</th>
                    <th style={{ textAlign: 'right' }}>Difference %</th>
                  </tr>
                </thead>
                <tbody>
                  {projectBreakdown.map((row) => (
                    <tr key={row.id}>
                      <td style={{ fontWeight: 700 }}>{row.name}</td>
                      <td>{row.code}</td>
                      <td style={{ textAlign: 'right' }}>{row.allocationPercent.toFixed(1)}%</td>
                      <td style={{ textAlign: 'right' }}>{row.loggedHours.toFixed(1)}</td>
                      <td style={{ textAlign: 'right' }}>{row.loggedPercent.toFixed(1)}%</td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          color: row.differencePercent > 0 ? '#16a34a' : row.differencePercent < 0 ? '#dc2626' : '#0f172a',
                        }}
                      >
                        {row.differencePercent > 0 ? '+' : ''}
                        {row.differencePercent.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                  {!projectBreakdown.length ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="helper-text" style={{ padding: '8px 0' }}>
                          No active project allocations found for this month.
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <LoeGrid
              year={year}
              month={month}
              sheet={sheet}
              categories={categories}
              allocations={allocations.map((allocation: any) => ({
                projectId: allocation.projectId,
                percentage: Number(allocation.percentage || 0),
              }))}
              viewerRole={user?.role}
              onDownloadCsv={handleExportSheetCsv}
              downloadLoading={exportingSheet}
            />
          </main>
        </div>
      </div>
    </RouteGuard>
  );
}
