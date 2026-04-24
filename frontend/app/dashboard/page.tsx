'use client';

import Link from 'next/link';
import { useMutation, useQuery } from '@apollo/client';
import { useState } from 'react';
import { DailyEntryCard } from '@/components/loe/DailyEntryCard';
import { DayChipStrip } from '@/components/loe/DayChipStrip';
import { RouteGuard } from '@/components/layout/RouteGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useFeedback } from '@/components/ui/FeedbackProvider';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import {
  ALLOCATIONS_QUERY,
  FIXED_CATEGORIES_QUERY,
  LOE_SHEET_QUERY,
  LOE_SHEETS_QUERY,
  PENDING_REVIEW_SHEETS_QUERY,
  APPROVE_LOE_MUTATION,
} from '@/lib/graphql/documents';
import { getErrorMessage } from '@/lib/utils/errors';
import { getWorkingDays } from '@/lib/utils/loe';

export default function DashboardPage() {
  const { user } = useAuth();
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  const { data: allocationsData, refetch: refetchAllocations } = useQuery(ALLOCATIONS_QUERY, {
    skip: !user?.id,
    variables: { userId: user?.id },
  });
  const { data: fixedData } = useQuery(FIXED_CATEGORIES_QUERY);
  const { data: sheetsData, refetch: refetchSheets } = useQuery(LOE_SHEETS_QUERY);
  const { data: pendingReviewData, refetch: refetchPendingReviews } = useQuery(PENDING_REVIEW_SHEETS_QUERY, {
    skip: !user?.id,
  });
  const { data: currentSheetData, refetch: refetchCurrentSheet } = useQuery(LOE_SHEET_QUERY, {
    variables: { year, month },
  });
  const [approveLoe, { loading: approving }] = useMutation(APPROVE_LOE_MUTATION);
  const { showError, showSuccess } = useFeedback();
  const [actionSheetId, setActionSheetId] = useState<string | null>(null);

  useRealtimeRefresh(
    {
      topics: ['LOE', 'ALLOCATION'],
      userId: user?.id,
    },
    async () => {
      await Promise.all([
        refetchAllocations(),
        refetchSheets(),
        refetchPendingReviews(),
        refetchCurrentSheet(),
      ]);
    },
    !user?.id,
  );

  useRealtimeRefresh(
    {
      topics: ['LOE'],
      reviewerId: user?.id,
    },
    async () => {
      await Promise.all([
        refetchSheets(),
        refetchPendingReviews(),
        refetchCurrentSheet(),
      ]);
    },
    !user?.id,
  );

  const currentSheet = currentSheetData?.loeSheet;
  const currentMonthHours = Number(currentSheet?.totalHours || 0);
  const categories = [
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
  ];

  const recentMonths = sheetsData?.loeSheets || [];
  const pendingReviews = pendingReviewData?.pendingReviewSheets || [];
  const delayedMonths = recentMonths.filter((sheet: any) => sheet.isDelayed);
  const assignedProjectsCount = (allocationsData?.allocations || []).filter((allocation: any) => allocation.isActive).length;
  const fixedCategoryCount = (fixedData?.fixedCategories || []).length;
  const filledDays = new Set(
    (currentSheet?.entries || [])
      .filter((entry: any) => Number(entry.hours) > 0)
      .map((entry: any) => new Date(entry.date).getDate()),
  ).size;
  const workingDays = getWorkingDays(year, month);
  const remainingWorkingDays = Math.max(workingDays - filledDays, 0);
  const expectedHours = workingDays * 8;
  const remainingHours = Math.max(expectedHours - currentMonthHours, 0);
  const utilization = currentSheet?.utilizationPercent || 0;
  const recentFive = Array.from({ length: 7 }, (_, index) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - index));
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
    const entryDays = new Set(
      (currentSheet?.entries || []).map((entry: any) => new Date(entry.date).getDate()),
    );
    return {
      label: weekday,
      day: d.getDate(),
      ok: entryDays.has(d.getDate()),
      weekend: [0, 6].includes(d.getDay()),
    };
  });

  async function handleQuickApprove(loeSheetId: string) {
    setActionSheetId(loeSheetId);
    try {
      await approveLoe({
        variables: { loeSheetId },
        refetchQueries: ['PendingReviewSheets', 'LoeSheet', 'LoeSheets'],
        awaitRefetchQueries: true,
      });
      showSuccess('LOE sheet approved successfully.');
    } catch (error) {
      showError(getErrorMessage(error, 'Unable to approve this LOE sheet.'));
    } finally {
      setActionSheetId(null);
    }
  }

  return (
    <RouteGuard>
      <div className="app-shell">
        <Sidebar />
        <div className="shell-main">
          <Topbar user={user} title="LOE Tracker" />
          <main className="page stack">
            {delayedMonths.length ? (
              <div className="soft-banner">
                <div>
                  <div className="section-caption">Critical</div>
                  <div>
                    You have {delayedMonths.length} overdue LOE month(s). Please complete them to
                    maintain utilization accuracy.
                  </div>
                </div>
                <Link href="/loe" className="button">
                  Review Missing
                </Link>
              </div>
            ) : null}

            <div className="dashboard-main-grid">
              <div style={{ gridColumn: 'span 7' }}>
                <DailyEntryCard year={year} month={month} day={day} categories={categories} />
              </div>

              <div className="stack" style={{ gridColumn: 'span 5' }}>
                <div className="card stack">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div className="page-title">
                      <div className="section-caption">This Month</div>
                      <h2 style={{ fontSize: 24, margin: 0 }}>Summary</h2>
                      <p>
                        {new Date(year, month - 1).toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Badge tone={(currentSheet?.status || 'draft').toLowerCase()}>
                        {currentSheet?.status || 'DRAFT'}
                      </Badge>
                    </div>
                  </div>

                  <div className="month-summary-grid">
                    <div className="month-summary-cell">
                      <div className="section-caption">Total Hours</div>
                      <div className="month-summary-value">
                        {currentMonthHours.toFixed(1)}
                      </div>
                    </div>
                    <div className="month-summary-cell">
                      <div className="section-caption">Utilization</div>
                      <div className="month-summary-value">{utilization}%</div>
                    </div>
                    <div className="month-summary-cell">
                      <div className="section-caption">Remaining Hours</div>
                      <div className="month-summary-value">{remainingHours.toFixed(1)}</div>
                    </div>
                    <div className="month-summary-cell">
                      <div className="section-caption">Days Left</div>
                      <div className="month-summary-value">{remainingWorkingDays}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                      <span style={{ fontWeight: 700 }}>Completion</span>
                      <span className="helper-text">
                        {filledDays} / {workingDays} Days
                      </span>
                    </div>
                    <div className="progress">
                      <span style={{ width: `${workingDays ? (filledDays / workingDays) * 100 : 0}%` }} />
                    </div>
                  </div>

                  <div className="entry-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                    <div className="entry-row" style={{ padding: '14px 16px' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>Assigned Projects</div>
                        <div className="helper-text">Active allocations contributing to this month.</div>
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 800 }}>{assignedProjectsCount}</div>
                    </div>
                    <div className="entry-row" style={{ padding: '14px 16px' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>Fixed Categories</div>
                        <div className="helper-text">Shared categories available on the sheet.</div>
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 800 }}>{fixedCategoryCount}</div>
                    </div>
                  </div>

                  <div className="card" style={{ padding: 16, background: '#f8fafc', borderColor: '#e2e8f0' }}>
                    <div className="section-caption">Month Guidance</div>
                    <div style={{ marginTop: 8, fontWeight: 700 }}>
                      Reviewer: {currentSheet?.reviewer?.name || 'Not assigned yet'}
                    </div>
                    <div className="helper-text" style={{ marginTop: 6 }}>
                      {currentSheet?.status === 'SUBMITTED'
                        ? 'Your sheet is waiting for reviewer action.'
                        : currentSheet?.status === 'APPROVED'
                          ? 'This month is approved and locked.'
                          : remainingWorkingDays > 0
                            ? `You still have ${remainingWorkingDays} working day(s) and ${remainingHours.toFixed(1)} expected hour(s) to account for this month.`
                            : 'All working days for this month are covered. Review your totals before submission.'}
                    </div>
                  </div>
                </div>

                <div className="card stack">
                  <div className="page-title">
                    <div className="section-caption">Weekly Compliance</div>
                    <h3 style={{ margin: 0 }}>Recent Week</h3>
                  </div>
                  <div className="weekly-strip">
                    {recentFive.map((item) => (
                      <div key={`${item.label}-${item.day}`} className="weekly-day">
                        <span className="section-caption" style={{ color: '#94a3b8' }}>
                          {item.label}
                        </span>
                        <span
                          className={[
                            'weekly-pill',
                            item.ok ? 'ok' : item.weekend ? 'empty' : 'missing',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          {item.ok ? '✓' : item.weekend ? '+' : '✕'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div className="card table-card">
                  <div className="toolbar" style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
                    <h3 style={{ margin: 0, fontSize: 20 }}>My Recent Months</h3>
                    <Link href="/loe" className="button secondary">
                      View All History
                    </Link>
                  </div>

                  <table className="table">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Total Hours</th>
                        <th style={{ textAlign: 'right' }}>Utilization</th>
                        <th style={{ textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentMonths.map((sheet: any) => (
                        <tr key={sheet.id}>
                          <td style={{ fontWeight: 700 }}>
                            {new Date(sheet.year, sheet.month - 1).toLocaleDateString('en-US', {
                              month: 'long',
                              year: 'numeric',
                            })}
                          </td>
                          <td>
                            <Badge tone={sheet.status.toLowerCase()}>{sheet.status}</Badge>
                          </td>
                          <td style={{ textAlign: 'right' }}>{Number(sheet.totalHours || 0).toFixed(1)}</td>
                          <td style={{ textAlign: 'right' }}>{sheet.utilizationPercent}%</td>
                          <td style={{ textAlign: 'center' }}>
                            <Link href={`/loe/${sheet.year}/${sheet.month}`} className="button secondary">
                              Open
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {user?.role === 'ADMIN' ? (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div className="card stack">
                    <div className="page-title">
                      <h3 style={{ margin: 0, fontSize: 20 }}>Pending Approvals</h3>
                      <p>
                        You have {pendingReviews.length} submissions waiting for your review
                      </p>
                    </div>
                    <div className="stack">
                      {pendingReviews.slice(0, 5).map((sheet: any) => (
                          <div
                            key={sheet.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 16,
                              padding: 16,
                              border: '1px solid #f1f5f9',
                              borderRadius: 12,
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700 }}>{sheet.user?.name || 'Team Member'}</div>
                              <div className="helper-text">
                                {new Date(sheet.year, sheet.month - 1).toLocaleDateString('en-US', {
                                  month: 'long',
                                  year: 'numeric',
                                })}
                                {' '}• {Number(sheet.totalHours || 0).toFixed(1)} Hours
                              </div>
                            </div>
                            <div className="table-row-action">
                              <Link
                                href={`/review-loe/${sheet.year}/${sheet.month}?userId=${sheet.user?.id}`}
                                className="button secondary"
                              >
                                Review
                              </Link>
                              <Button
                                onClick={() => handleQuickApprove(sheet.id)}
                                loading={actionSheetId === sheet.id && approving}
                                loadingText="Approving..."
                              >
                                Quick Approve
                              </Button>
                            </div>
                          </div>
                        ))}
                      {!pendingReviews.length ? <div className="helper-text">No pending submissions for review.</div> : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </main>
        </div>
      </div>
    </RouteGuard>
  );
}
