'use client';

import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { LoeGrid } from '@/components/loe/LoeGrid';
import { RouteGuard } from '@/components/layout/RouteGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { useLoeSheet } from '@/hooks/useLoeSheet';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { ALLOCATIONS_QUERY, FIXED_CATEGORIES_QUERY } from '@/lib/graphql/documents';
import { getWorkingDays } from '@/lib/utils/loe';

export default function ReviewLoeDetailPage({
  params,
  searchParams,
}: {
  params: { year: string; month: string };
  searchParams?: { userId?: string };
}) {
  const { user } = useAuth();
  const year = Number(params.year);
  const month = Number(params.month);
  const targetUserId = searchParams?.userId;
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
  const employee = sheet?.user || allocations[0]?.user;
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

  return (
    <RouteGuard>
      <div className="app-shell">
        <Sidebar />
        <div className="shell-main">
          <Topbar user={user} title="LOE Tracker" />
          <main className="page stack">
            <div className="page-header">
              <div className="page-title">
                <div className="section-caption">Reviewer Workspace / Sheet Review</div>
                <h1>
                  {employee?.name || 'Assigned User'} •{' '}
                  {new Date(year, month - 1).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </h1>
                <p>Review the submitted month in read-only mode and compare allocated effort against logged effort.</p>
              </div>
              <div className="card" style={{ minWidth: 320, padding: 16 }}>
                <div className="section-caption">Reviewer Context</div>
                <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                  <div style={{ fontWeight: 800, fontSize: 20 }}>{employee?.name || 'Unassigned User'}</div>
                  <div className="helper-text">{employee?.email || 'No employee selected'}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Badge tone={(sheet?.status || 'draft').toLowerCase()}>{sheet?.status || 'DRAFT'}</Badge>
                    <Badge tone="submitted">{allocations.length} project allocation(s)</Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="metric-grid">
              <div className="metric-card">
                <div className="section-caption">Employee</div>
                <div className="metric-card-value" style={{ fontSize: 24 }}>
                  {employee?.name || '—'}
                </div>
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
                <div className="section-caption">Overall Logged %</div>
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

            {overUtilized ? (
              <div className="banner warn">
                Utilization exceeds 120%. Review the user&apos;s allocations and logged effort before approval.
              </div>
            ) : null}

            <div className="card table-card">
              <div className="toolbar" style={{ padding: 20, borderBottom: '1px solid #f1f5f9' }}>
                <div className="page-title">
                  <h3 style={{ margin: 0 }}>Allocation vs Logged</h3>
                  <p>Allocated percentages are compared against the user’s logged project effort for this month.</p>
                </div>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Code</th>
                    <th style={{ textAlign: 'right' }}>Allocated %</th>
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
                          No active project allocations found for this user.
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
              forceReadOnly
            />
          </main>
        </div>
      </div>
    </RouteGuard>
  );
}
