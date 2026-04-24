'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@apollo/client';
import { SAVE_DAY_ENTRIES_MUTATION, SUBMIT_LOE_MUTATION } from '@/lib/graphql/documents';
import { getErrorMessage } from '@/lib/utils/errors';
import { getDaysInMonth, getWorkingDays, isWeekend, utilization } from '@/lib/utils/loe';
import { Button } from '../ui/Button';
import { useFeedback } from '../ui/FeedbackProvider';
import { MonthProgressBar } from './MonthProgressBar';
import { LoeStatusBanner } from './LoeStatusBanner';

function keyFor(day: number, categoryId: string) {
  return `${day}-${categoryId}`;
}

export function LoeGrid({
  year,
  month,
  sheet,
  categories,
  allocations,
  viewerRole,
  forceReadOnly,
  onDownloadCsv,
  downloadLoading,
}: {
  year: number;
  month: number;
  sheet: any;
  categories: { id: string; name: string; kind: 'project' | 'fixed' }[];
  allocations?: { projectId: string; percentage: number }[];
  viewerRole?: string;
  forceReadOnly?: boolean;
  onDownloadCsv?: () => void;
  downloadLoading?: boolean;
}) {
  const [saveDayEntries] = useMutation(SAVE_DAY_ENTRIES_MUTATION);
  const [submitLoe, { loading: submitting }] = useMutation(SUBMIT_LOE_MUTATION);
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [savingDay, setSavingDay] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState('');
  const { showError, showSuccess } = useFeedback();
  const days = getDaysInMonth(year, month);
  const showRightTotalColumn = viewerRole !== 'USER';
  const readOnly = forceReadOnly || ['SUBMITTED', 'APPROVED'].includes(sheet?.status);
  const showUserActions = !forceReadOnly;

  useEffect(() => {
    const next: Record<string, string> = {};
    (sheet?.entries || []).forEach((entry: any) => {
      const day = new Date(entry.date).getDate();
      if (entry.project?.id) next[keyFor(day, entry.project.id)] = String(entry.hours);
      if (entry.fixedCategory?.id) next[keyFor(day, entry.fixedCategory.id)] = String(entry.hours);
    });
    setDraftValues(next);
  }, [sheet?.entries]);

  const filledWorkingDays = useMemo(() => {
    const daysWithHours = new Set<number>();
    (sheet?.entries || []).forEach((entry: any) => {
      const date = new Date(entry.date);
      const day = date.getDate();
      if (!isWeekend(year, month, day) && Number(entry.hours) > 0) {
        daysWithHours.add(day);
      }
    });
    return daysWithHours.size;
  }, [month, sheet?.entries, year]);

  const totalHours = useMemo(
    () => (sheet?.entries || []).reduce((sum: number, entry: any) => sum + Number(entry.hours), 0),
    [sheet?.entries],
  );
  const billableHours = useMemo(
    () =>
      (sheet?.entries || [])
        .filter((entry: any) => entry.project)
        .reduce((sum: number, entry: any) => sum + Number(entry.hours), 0),
    [sheet?.entries],
  );
  const allocationMap = useMemo(
    () =>
      Object.fromEntries((allocations || []).map((allocation) => [allocation.projectId, Number(allocation.percentage || 0)])),
    [allocations],
  );

  async function saveDay(day: number) {
    if (readOnly || isWeekend(year, month, day)) {
      return;
    }

    setSavingDay(day);
    setSubmitError('');
    try {
      const entries = categories
        .map((category) => ({
          projectId: category.kind === 'project' ? category.id : null,
          fixedCategoryId: category.kind === 'fixed' ? category.id : null,
          hours: Number(draftValues[keyFor(day, category.id)] || 0),
        }))
        .filter((entry) => entry.hours > 0);

      await saveDayEntries({
        variables: { year, month, day, entries },
        refetchQueries: ['LoeSheet'],
        awaitRefetchQueries: true,
      });
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to save entries for this day.');
      setSubmitError(message);
      showError(message);
    } finally {
      setSavingDay(null);
    }
  }

  async function handleSubmit() {
    if (!sheet?.id || readOnly) {
      return;
    }

    setSubmitError('');
    try {
      await submitLoe({
        variables: { loeSheetId: sheet.id },
        refetchQueries: ['LoeSheet', 'LoeSheets'],
        awaitRefetchQueries: true,
      });
      showSuccess('LOE sheet submitted successfully.');
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to submit this LOE sheet.');
      setSubmitError(message);
      showError(message);
    }
  }

  function handleDraftNotice() {
    showSuccess('Draft saved. Your month remains editable until you submit it.');
  }

  const dayRows = Array.from({ length: days }, (_, index) => index + 1);

  return (
    <div className="loe-layout">
      <LoeStatusBanner
        status={sheet?.status || 'DRAFT'}
        delayed={sheet?.isDelayed}
        reopenComment={sheet?.reopenComment}
      />
      <div className="card stack">
        {submitError ? <div className="banner error">{submitError}</div> : null}
        <div className="page-header" style={{ alignItems: 'center' }}>
          <MonthProgressBar filled={filledWorkingDays} total={getWorkingDays(year, month)} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
            {onDownloadCsv ? (
              <Button className="secondary" onClick={onDownloadCsv} loading={downloadLoading} loadingText="Exporting...">
                Download CSV
              </Button>
            ) : null}
            <div className="month-summary-grid" style={{ minWidth: 320 }}>
              <div className="month-summary-cell">
                <div className="section-caption">Monthly Utilization</div>
                <div className="month-summary-value">
                  {sheet?.utilizationPercent || utilization(totalHours, year, month)}%
                </div>
              </div>
              <div className="month-summary-cell">
                <div className="section-caption">{showUserActions ? 'Save Status' : 'View Mode'}</div>
                <div className="month-summary-value" style={{ fontSize: 20 }}>
                  {showUserActions
                    ? submitting
                      ? 'Submitting sheet'
                      : savingDay
                        ? `Saving day ${savingDay}`
                        : 'Ready'
                    : 'Reviewer'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="loe-grid-card">
          <div className="loe-grid-wrap">
            <table className="table loe-grid">
              <thead>
                <tr>
                  <th className="row-index">#</th>
                  <th className="row-day">Day</th>
                  {categories.map((category) => (
                    <th key={category.id}>{category.name}</th>
                  ))}
                  {showRightTotalColumn ? <th style={{ textAlign: 'right' }}>Total (h)</th> : null}
                  <th className="loe-note">Notes / Comments</th>
                </tr>
              </thead>
              <tbody>
                {dayRows.map((day) => {
                  const weekend = isWeekend(year, month, day);
                  const isToday =
                    new Date().getFullYear() === year &&
                    new Date().getMonth() + 1 === month &&
                    new Date().getDate() === day;
                  const rowEntries = (sheet?.entries || []).filter(
                    (entry: any) => new Date(entry.date).getDate() === day,
                  );
                  const rowTotal = categories.reduce(
                    (sum, category) => sum + (Number(draftValues[keyFor(day, category.id)]) || 0),
                    0,
                  );
                  const note = rowEntries.find((entry: any) => entry.note)?.note;

                  return (
                    <tr
                      key={day}
                      className={[
                        'loe-grid-row',
                        weekend ? 'weekend' : '',
                        isToday ? 'today' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <td className="row-index">{String(day).padStart(2, '0')}</td>
                      <td className="row-day">
                        {new Date(year, month - 1, day).toLocaleDateString('en-US', {
                          weekday: 'short',
                        })}
                      </td>
                      {categories.map((category) => (
                        <td key={keyFor(day, category.id)}>
                          <input
                            className="loe-cell-input"
                            type="number"
                            min={0}
                            step="0.5"
                            value={draftValues[keyFor(day, category.id)] || ''}
                            disabled={weekend || readOnly || submitting}
                            onChange={(event) =>
                              setDraftValues((current) => ({
                                ...current,
                                [keyFor(day, category.id)]: event.target.value,
                              }))
                            }
                            onBlur={() => saveDay(day)}
                          />
                        </td>
                      ))}
                      {showRightTotalColumn ? <td style={{ textAlign: 'right', fontWeight: 800 }}>{rowTotal || '—'}</td> : null}
                      <td className="muted">{note || (weekend ? 'Weekend' : '—')}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot style={{ background: '#0f172a', color: 'white' }}>
                <tr>
                  <th colSpan={2}>MONTHLY TOTALS</th>
                  {categories.map((category) => {
                    const sum = (sheet?.entries || [])
                      .filter(
                        (entry: any) =>
                          entry.project?.id === category.id || entry.fixedCategory?.id === category.id,
                      )
                      .reduce((acc: number, entry: any) => acc + Number(entry.hours), 0);
                    return (
                      <th key={category.id}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 18 }}>{sum.toFixed(1)}</div>
                          <div style={{ fontSize: 10, color: '#94a3b8' }}>
                            {utilization(sum, year, month)}% Total
                          </div>
                        </div>
                      </th>
                    );
                  })}
                  {showRightTotalColumn ? (
                    <th
                      style={{ textAlign: 'right' }}
                      className={(sheet?.utilizationPercent || utilization(totalHours, year, month)) >= 120 ? 'loe-summary-highlight' : ''}
                    >
                      <div style={{ fontSize: 22 }}>{totalHours.toFixed(1)}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>Total Hours</div>
                    </th>
                  ) : null}
                  <th>
                    <div style={{ display: 'grid', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        <span>Target Completion</span>
                        <span>{Math.round((filledWorkingDays / getWorkingDays(year, month)) * 100)}%</span>
                      </div>
                      <div className="progress" style={{ background: '#334155' }}>
                        <span
                          style={{
                            width: `${(filledWorkingDays / getWorkingDays(year, month)) * 100}%`,
                            background: '#dbe1ff',
                          }}
                        />
                      </div>
                    </div>
                  </th>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="footer-analysis-grid">
          <div className="card">
            <div className="section-caption" style={{ marginBottom: 16 }}>Time Distribution</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                className="donut"
                data-value={`${Math.round(totalHours ? (billableHours / totalHours) * 100 : 0)}%`}
              />
              <div>
                <div style={{ fontWeight: 700 }}>Project Hours</div>
                <div className="helper-text">
                  {billableHours.toFixed(1)} of {totalHours.toFixed(1)} logged hours are against projects.
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="section-caption" style={{ marginBottom: 16 }}>Effort Split (%)</div>
            <div className="stack" style={{ gap: 10 }}>
              {categories.slice(0, 3).map((category) => {
                const sum = (sheet?.entries || [])
                  .filter(
                    (entry: any) =>
                      entry.project?.id === category.id || entry.fixedCategory?.id === category.id,
                  )
                  .reduce((acc: number, entry: any) => acc + Number(entry.hours), 0);
                const percent = totalHours ? ((sum / totalHours) * 100).toFixed(1) : '0.0';
                return (
                  <div key={category.id} className="stack" style={{ gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span>{category.name}</span>
                      <strong>{percent}%</strong>
                    </div>
                    <div className="progress">
                      <span style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card">
            <div className="section-caption" style={{ marginBottom: 16 }}>Assigned Project Split (%)</div>
            <div className="stack" style={{ gap: 10 }}>
              {categories
                .filter((category) => category.kind === 'project')
                .slice(0, 3)
                .map((category) => {
                  const allocationPercent = Number(allocationMap[category.id] || 0);
                  return (
                    <div key={category.id} className="stack" style={{ gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span>{category.name}</span>
                        <strong>{allocationPercent.toFixed(1)}%</strong>
                      </div>
                      <div className="progress">
                        <span style={{ width: `${allocationPercent}%`, background: '#0f766e' }} />
                      </div>
                    </div>
                  );
                })}
              {!categories.some((category) => category.kind === 'project') ? (
                <div className="helper-text">No assigned projects for this month.</div>
              ) : null}
            </div>
          </div>
          <div className="card">
            <div className="section-caption" style={{ marginBottom: 16 }}>Submission Status</div>
            <div className="stack" style={{ gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                <span>{sheet?.status === 'DRAFT' ? '✎' : '✓'}</span>
                <span>Currently in {sheet?.status || 'Draft'}</span>
              </div>
              <div className="helper-text">
                Review weekday coverage before final submission.
              </div>
            </div>
          </div>
          <div className="card feature-card-primary">
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, opacity: 0.8, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                Grand Total
              </div>
              <div style={{ fontSize: 32, fontWeight: 900 }}>
                {totalHours.toFixed(1)} <span style={{ fontSize: 14, opacity: 0.75 }}>hrs</span>
              </div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 8, lineHeight: 1.5 }}>
                Total logged hours for this month across all projects and fixed categories.
              </div>
            </div>
            {showUserActions ? (
              <Button
                className="secondary"
                style={{ alignSelf: 'stretch', marginTop: 16, background: 'white', color: 'var(--primary)' }}
                onClick={handleSubmit}
                disabled={!sheet?.id || readOnly || submitting}
                loading={submitting}
                loadingText="Submitting..."
              >
                Finalize {new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long' })} LOE
              </Button>
            ) : null}
          </div>
        </div>

        {showUserActions ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button
              className="secondary"
              onClick={handleDraftNotice}
              disabled={readOnly || submitting || savingDay !== null}
            >
              Save as Draft
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!sheet?.id || readOnly || submitting || savingDay !== null}
              loading={submitting}
              loadingText="Submitting..."
            >
              Submit Draft
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
