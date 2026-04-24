'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { RouteGuard } from '@/components/layout/RouteGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useFeedback } from '@/components/ui/FeedbackProvider';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { getErrorMessage } from '@/lib/utils/errors';
import {
  APPROVE_LOE_MUTATION,
  REOPEN_LOE_MUTATION,
  REVIEW_SHEETS_QUERY,
} from '@/lib/graphql/documents';

export default function ReviewLoePage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [reopenTargetId, setReopenTargetId] = useState<string | null>(null);
  const [reopenComment, setReopenComment] = useState('');
  const [reopenError, setReopenError] = useState('');
  const [exporting, setExporting] = useState(false);
  const { data, error, refetch } = useQuery(REVIEW_SHEETS_QUERY, {
    skip: !user?.id,
  });
  const [approveLoe, { loading: approving }] = useMutation(APPROVE_LOE_MUTATION);
  const [reopenLoe, { loading: reopening }] = useMutation(REOPEN_LOE_MUTATION);
  const { showError, showSuccess } = useFeedback();
  const [actionSheetId, setActionSheetId] = useState<string | null>(null);

  useRealtimeRefresh(
    {
      topics: ['LOE'],
      reviewerId: user?.id,
    },
    refetch,
    !user?.id,
  );

  const reviewSheets = data?.reviewSheets || [];
  const filteredReviews = useMemo(
    () =>
      reviewSheets.filter((sheet: any) =>
        [
          sheet.user?.name,
          sheet.user?.email,
          sheet.status,
          new Date(sheet.year, sheet.month - 1).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          }),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [reviewSheets, search],
  );

  const pendingReviews = filteredReviews.filter((sheet: any) => sheet.status === 'SUBMITTED');

  async function handleApprove(loeSheetId: string) {
    setActionSheetId(loeSheetId);
    try {
      await approveLoe({
        variables: { loeSheetId },
        refetchQueries: ['PendingReviewSheets', 'ReviewSheets', 'LoeSheet', 'LoeSheets', 'Notifications'],
        awaitRefetchQueries: true,
      });
      showSuccess('LOE sheet approved successfully.');
    } catch (error) {
      showError(getErrorMessage(error, 'Unable to approve this LOE sheet.'));
    } finally {
      setActionSheetId(null);
    }
  }

  async function handleReopen(loeSheetId: string) {
    const trimmedComment = reopenComment.trim();
    if (!trimmedComment) {
      setReopenError('Reviewer comment is required to re-open a sheet.');
      return;
    }

    setActionSheetId(loeSheetId);
    try {
      await reopenLoe({
        variables: { loeSheetId, comment: trimmedComment },
        refetchQueries: ['PendingReviewSheets', 'ReviewSheets', 'LoeSheet', 'LoeSheets', 'Notifications'],
        awaitRefetchQueries: true,
      });
      setReopenTargetId(null);
      setReopenComment('');
      setReopenError('');
      showSuccess('LOE sheet reopened successfully.');
    } catch (error) {
      setReopenError(getErrorMessage(error, 'Unable to re-open this LOE sheet.'));
      showError(getErrorMessage(error, 'Unable to re-open this LOE sheet.'));
    } finally {
      setActionSheetId(null);
    }
  }

  async function handleExportCsv() {
    setExporting(true);

    try {
      const Papa = (await import('papaparse')).default;
      const csv = Papa.unparse(
        filteredReviews.map((sheet: any) => ({
          'Sheet ID': sheet.id,
          'User ID': sheet.user?.id || '—',
          Employee: sheet.user?.name || 'Team Member',
          'Employee Email': sheet.user?.email || '—',
          Month: new Date(sheet.year, sheet.month - 1).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          }),
          Status: sheet.status || '—',
          'Total Hours': Number(sheet.totalHours || 0).toFixed(1),
          'Utilization Percent': sheet.utilizationPercent,
          Submitted: sheet.submittedAt
            ? new Date(sheet.submittedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : '—',
          Approved: sheet.approvedAt
            ? new Date(sheet.approvedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : '—',
        })),
      );
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStamp = new Date().toISOString().slice(0, 10);

      link.href = url;
      link.setAttribute('download', `review-loe-${dateStamp}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      showSuccess(`Exported ${filteredReviews.length} review row(s) to CSV.`);
    } catch (error) {
      showError(getErrorMessage(error, 'Unable to export review sheets.'));
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
                <div className="section-caption">Reviewer Workspace</div>
                <h1>Review LOE</h1>
                <p>Review submitted monthly sheets, approve completed work, or reopen sheets for changes.</p>
              </div>
              <div className="toolbar-group">
                <div className="card" style={{ padding: '12px 16px', minWidth: 220 }}>
                  <div className="section-caption">Pending Reviews</div>
                  <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>{pendingReviews.length}</div>
                </div>
              </div>
            </div>

            {error ? <div className="banner error">{getErrorMessage(error, 'Unable to load review sheets.')}</div> : null}

            <div className="metric-grid">
              <div className="metric-card">
                <div className="section-caption">Visible Reviews</div>
                <div className="metric-card-value">{filteredReviews.length}</div>
              </div>
              <div className="metric-card">
                <div className="section-caption">Total Hours Visible</div>
                <div className="metric-card-value">
                  {filteredReviews.reduce((sum: number, sheet: any) => sum + Number(sheet.totalHours || 0), 0).toFixed(1)}
                </div>
              </div>
              <div className="metric-card">
                <div className="section-caption">This Month</div>
                <div className="metric-card-value">
                  {
                    filteredReviews.filter((sheet: any) => {
                      const now = new Date();
                      return sheet.year === now.getFullYear() && sheet.month === now.getMonth() + 1;
                    }).length
                  }
                </div>
              </div>
              <div className="metric-card">
                <div className="section-caption">Approved</div>
                <div className="metric-card-value">
                  {filteredReviews.filter((sheet: any) => sheet.status === 'APPROVED').length}
                </div>
              </div>
            </div>

            <div className="card table-card">
              <div className="toolbar" style={{ padding: 20, borderBottom: '1px solid #f1f5f9' }}>
                <div className="page-title">
                  <h3 style={{ margin: 0 }}>Assigned Sheets</h3>
                  <p>{filteredReviews.length} sheet(s) assigned to you</p>
                </div>
                <Button className="secondary" onClick={handleExportCsv} loading={exporting} loadingText="Exporting...">
                  Download CSV
                </Button>
                <Input
                  className="search"
                  placeholder="Search by employee, month, or status"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <table className="table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Month</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Total Hours</th>
                    <th style={{ textAlign: 'right' }}>Utilization</th>
                    <th>Submitted</th>
                    <th>Approved</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReviews.map((sheet: any) => (
                    <tr key={sheet.id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{sheet.user?.name || 'Team Member'}</div>
                        <div className="helper-text">{sheet.user?.email || '—'}</div>
                      </td>
                      <td>
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
                      <td>
                        {sheet.submittedAt
                          ? new Date(sheet.submittedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td>
                        {sheet.approvedAt
                          ? new Date(sheet.approvedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td>
                        <div className="table-row-action">
                          <Link
                            href={`/review-loe/${sheet.year}/${sheet.month}?userId=${sheet.user?.id}`}
                            className="button secondary"
                          >
                            Review
                          </Link>
                          <Button
                            onClick={() => handleApprove(sheet.id)}
                            disabled={approving || reopening || sheet.status !== 'SUBMITTED'}
                            loading={actionSheetId === sheet.id && approving}
                            loadingText="Approving..."
                          >
                            Approve
                          </Button>
                          <Button
                            className="ghost"
                            onClick={() => {
                              setReopenTargetId(sheet.id);
                              setReopenComment('');
                              setReopenError('');
                            }}
                            disabled={approving || reopening || sheet.status === 'REOPENED'}
                            loading={actionSheetId === sheet.id && reopening}
                            loadingText="Re-opening..."
                          >
                            Re-open
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filteredReviews.length ? (
                    <tr>
                      <td colSpan={8}>
                        <div className="helper-text" style={{ padding: '8px 0' }}>
                          No LOE sheets are currently assigned to you.
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            {reopenTargetId ? (
              <Modal
                onClose={() => {
                  setReopenTargetId(null);
                  setReopenComment('');
                  setReopenError('');
                }}
              >
                <div style={{ minWidth: 560, maxWidth: '100%' }}>
                  <div className="modal-header">
                    <div className="page-title">
                    <div className="section-caption">Reviewer Action</div>
                    <h3 style={{ margin: 0 }}>Re-open LOE Sheet</h3>
                    <p>Add a comment so the user knows what must be corrected before resubmission.</p>
                    </div>
                    <Button
                      className="ghost"
                      onClick={() => {
                        setReopenTargetId(null);
                        setReopenComment('');
                        setReopenError('');
                      }}
                    >
                      Close
                    </Button>
                  </div>

                  <div className="modal-body">
                    <div className="field" style={{ marginBottom: 0 }}>
                      <label>Reviewer Comment</label>
                      <textarea
                      className={`textarea ${reopenError ? 'error' : ''}`}
                      value={reopenComment}
                      onChange={(event) => {
                        setReopenComment(event.target.value);
                        setReopenError('');
                      }}
                      rows={4}
                      placeholder="Explain what needs to be corrected before resubmission."
                      />
                      {reopenError ? <div className="field-error">{reopenError}</div> : null}
                    </div>
                  </div>

                  <div className="modal-footer">
                    <Button
                      className="ghost"
                      onClick={() => {
                        setReopenTargetId(null);
                        setReopenComment('');
                        setReopenError('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleReopen(reopenTargetId)}
                      disabled={reopening}
                      loading={reopening}
                      loadingText="Re-opening..."
                    >
                      Confirm Re-open
                    </Button>
                  </div>
                </div>
              </Modal>
            ) : null}
          </main>
        </div>
      </div>
    </RouteGuard>
  );
}
