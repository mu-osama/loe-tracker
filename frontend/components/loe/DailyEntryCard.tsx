'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@apollo/client';
import { SAVE_DAY_ENTRIES_MUTATION } from '@/lib/graphql/documents';
import { getErrorMessage } from '@/lib/utils/errors';
import { useLoeSheet } from '@/hooks/useLoeSheet';
import { isWeekend } from '@/lib/utils/loe';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useFeedback } from '../ui/FeedbackProvider';
import { Input } from '../ui/Input';
import { StateCard } from '../ui/StateCard';

export function DailyEntryCard({
  year,
  month,
  day,
  categories,
  readOnly,
}: {
  year: number;
  month: number;
  day: number;
  categories: { id: string; name: string; kind: 'project' | 'fixed' }[];
  readOnly?: boolean;
}) {
  const { sheet, refetch, loading: sheetLoading, error: sheetError } = useLoeSheet(year, month);
  const [saveDayEntries, { loading }] = useMutation(SAVE_DAY_ENTRIES_MUTATION);
  const [values, setValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState('Saved');
  const [saveError, setSaveError] = useState('');
  const { showError, showSuccess } = useFeedback();
  const weekend = isWeekend(year, month, day);

  const dayEntries = useMemo(
    () => (sheet?.entries || []).filter((entry: any) => new Date(entry.date).getDate() === day),
    [day, sheet?.entries],
  );

  useEffect(() => {
    const nextValues: Record<string, string> = {};
    dayEntries.forEach((entry: any) => {
      if (entry.project?.id) nextValues[entry.project.id] = String(entry.hours);
      if (entry.fixedCategory?.id) nextValues[entry.fixedCategory.id] = String(entry.hours);
    });
    setValues(nextValues);
  }, [dayEntries]);

  const total = useMemo(
    () => Object.values(values).reduce((sum, value) => sum + (Number(value) || 0), 0),
    [values],
  );
  const hasLoggedHoursForDay = dayEntries.some((entry: any) => Number(entry.hours) > 0);
  const editable = !weekend && !readOnly && !['SUBMITTED', 'APPROVED'].includes(sheet?.status);

  async function save(showSuccessFeedback = false) {
    if (weekend || readOnly || ['SUBMITTED', 'APPROVED'].includes(sheet?.status)) {
      return;
    }

    setStatus('Saving...');
    setSaveError('');
    try {
      await saveDayEntries({
        variables: {
          year,
          month,
          day,
          entries: categories
            .map((category) => ({
              projectId: category.kind === 'project' ? category.id : null,
              fixedCategoryId: category.kind === 'fixed' ? category.id : null,
              hours: Number(values[category.id] || 0),
            }))
            .filter((entry) => entry.hours > 0),
        },
      });
      await refetch();
      setStatus('Saved');
      if (showSuccessFeedback) {
        showSuccess('Draft saved. You can continue updating this day before submission.');
      }
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to save this day.');
      setStatus('Error');
      setSaveError(message);
      showError(message);
    }
  }

  if (sheetLoading) {
    return (
      <div className="card stack daily-entry-card">
        <StateCard
          title="Loading daily entry"
          message="Fetching the current month sheet and today's saved hours."
        />
      </div>
    );
  }

  if (sheetError) {
    return (
      <div className="card stack daily-entry-card">
        <StateCard
          title="Unable to load daily entry"
          message={getErrorMessage(sheetError, 'Refresh the page and try again.')}
          tone="error"
        />
      </div>
    );
  }

  return (
    <div className="card stack daily-entry-card">
      <div className="toolbar daily-entry-toolbar">
        <div className="page-title">
          <div className="section-caption">Daily Entry</div>
          <h2 style={{ fontSize: 24, margin: 0 }}>
            {new Date(year, month - 1, day).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </h2>
          <p>
            Capture effort for today using the same operational structure shown across the admin workspace.
          </p>
        </div>
        <div className="daily-entry-status-block">
          <Badge tone={(sheet?.status || 'draft').toLowerCase()}>{sheet?.status || 'DRAFT'}</Badge>
          <div className="helper-text">
            {sheet?.status === 'REOPENED' ? 'Reopened for updates' : 'Current sheet state'}
          </div>
        </div>
      </div>

      {weekend ? (
        <div className="banner" style={{ background: '#f8fafc', borderColor: '#e2e8f0', borderStyle: 'solid' }}>
          Today is a weekend. No entry is required.
        </div>
      ) : null}

      {sheet?.status === 'REOPENED' && sheet?.reopenComment ? (
        <div className="banner warn">Reviewer comment: {sheet.reopenComment}</div>
      ) : null}

      {sheet?.status === 'SUBMITTED' ? (
        <div className="banner warn">
          The current month sheet has already been submitted. You cannot submit hours until the reviewer re-opens it.
        </div>
      ) : null}

      {sheet?.status === 'APPROVED' ? (
        <div className="banner warn">
          The current month sheet has already been approved. Hour entry is locked for this month.
        </div>
      ) : null}

      {saveError ? <div className="banner error">{saveError}</div> : null}

      {!weekend && hasLoggedHoursForDay && editable ? (
        <div className="banner" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534' }}>
          Hours already logged for this day. Update any value if you need to make changes.
        </div>
      ) : null}

      <div className="daily-entry-section-header">
        <div>
          <div className="section-caption">Tracked Categories</div>
          <h3 style={{ margin: '4px 0 0', fontSize: 20 }}>Today's effort lines</h3>
        </div>
        <div className="helper-text">
          Blur a field or use the action below to persist changes.
        </div>
      </div>

      <div className="entry-grid daily-entry-grid">
        {categories.map((category) => (
          <div
            key={category.id}
            className={category.kind === 'fixed' ? 'entry-row featured daily-entry-row' : 'entry-row daily-entry-row'}
          >
            <div>
              <div style={{ fontWeight: 700 }}>{category.name}</div>
              <div className="helper-text">
                {category.kind === 'fixed' ? 'Shared fixed category' : 'Allocated project'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Input
                type="number"
                min={0}
                step="0.5"
                value={values[category.id] || ''}
                disabled={loading || !editable}
                onChange={(event) =>
                  setValues((current) => ({ ...current, [category.id]: event.target.value }))
                }
                onBlur={() => save()}
                style={{ width: 110, textAlign: 'right' }}
              />
              <span className="muted">hrs</span>
            </div>
          </div>
        ))}
      </div>

      <div className="entry-total">
        <div className="helper-text">
          {status === 'Saving...'
            ? 'Saving…'
            : status === 'Error'
              ? 'Save failed'
            : loading
              ? 'Saving…'
            : hasLoggedHoursForDay
              ? 'Already logged for today ✓'
              : 'Saved ✓'}
        </div>
        <Button
          onClick={() => save(true)}
          disabled={!editable}
          loading={loading}
          loadingText="Saving..."
        >
          Save Draft
        </Button>
      </div>
    </div>
  );
}
