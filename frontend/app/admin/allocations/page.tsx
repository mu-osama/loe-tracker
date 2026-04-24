'use client';

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
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { getErrorMessage } from '@/lib/utils/errors';
import {
  ALLOCATIONS_QUERY,
  CREATE_ALLOCATION_MUTATION,
  DEACTIVATE_ALLOCATION_MUTATION,
  PROJECTS_QUERY,
  UPDATE_ALLOCATION_MUTATION,
  USERS_QUERY,
} from '@/lib/graphql/documents';

const emptyForm = {
  userId: '',
  projectId: '',
  percentage: '',
};

type AllocationErrors = Partial<Record<keyof typeof emptyForm, string>>;

function AllocationModal({
  editing,
  form,
  setForm,
  users,
  projects,
  errors,
  formError,
  saving,
  onClose,
  onSubmit,
}: {
  editing: boolean;
  form: typeof emptyForm;
  setForm: (value: typeof emptyForm) => void;
  users: any[];
  projects: any[];
  errors: AllocationErrors;
  formError: string;
  saving: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
}) {
  return (
    <Modal onClose={onClose}>
      <div className="modal-header">
        <div className="page-title">
          <h2>{editing ? 'Edit Allocation' : 'Create Allocation'}</h2>
          <p>Assign resources to projects and manage workload percentages.</p>
        </div>
        <Button className="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
      <div className="modal-body">
        {formError ? <div className="banner error">{formError}</div> : null}
        <div className="form-grid">
          <div className="field">
            <label>User</label>
            <Select
              className={errors.userId ? 'error' : ''}
              value={form.userId}
              onChange={(event) => setForm({ ...form, userId: event.target.value })}
              disabled={editing}
            >
              <option value="">Select user</option>
              {users.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </Select>
            {errors.userId ? <div className="field-error">{errors.userId}</div> : null}
          </div>
          <div className="field">
            <label>Project</label>
            <Select
              className={errors.projectId ? 'error' : ''}
              value={form.projectId}
              onChange={(event) => setForm({ ...form, projectId: event.target.value })}
              disabled={editing}
            >
              <option value="">Select project</option>
              {projects.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </Select>
            {errors.projectId ? <div className="field-error">{errors.projectId}</div> : null}
          </div>
        </div>
        <div className="field">
          <label>Allocation Percentage</label>
          <Input
            className={errors.percentage ? 'error' : ''}
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={form.percentage}
            onChange={(event) => setForm({ ...form, percentage: event.target.value })}
          />
          {errors.percentage ? <div className="field-error">{errors.percentage}</div> : null}
        </div>
      </div>
      <div className="modal-footer">
        <Button className="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={saving}>
          {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Allocation'}
        </Button>
      </div>
    </Modal>
  );
}

function ConfirmAllocationModal({
  title,
  message,
  confirmLabel,
  confirmClassName,
  loadingText,
  loading,
  onClose,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  confirmClassName?: string;
  loadingText: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  return (
    <Modal onClose={onClose}>
      <div className="modal-header">
        <div className="page-title">
          <h2>{title}</h2>
          <p>{message}</p>
        </div>
        <Button className="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
      <div className="modal-footer">
        <Button className="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button className={confirmClassName} onClick={onConfirm} loading={loading} loadingText={loadingText}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export default function AdminAllocationsPage() {
  const { user } = useAuth();
  const { data, loading, error, refetch } = useQuery(ALLOCATIONS_QUERY);
  const { data: usersData, refetch: refetchUsers } = useQuery(USERS_QUERY);
  const { data: projectsData, refetch: refetchProjects } = useQuery(PROJECTS_QUERY, {
    variables: { includeInactive: true },
  });
  const [createAllocation, { loading: creating }] = useMutation(CREATE_ALLOCATION_MUTATION);
  const [updateAllocation, { loading: updating }] = useMutation(UPDATE_ALLOCATION_MUTATION);
  const [deactivateAllocation] = useMutation(DEACTIVATE_ALLOCATION_MUTATION);
  const { showError, showSuccess } = useFeedback();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<AllocationErrors>({});
  const [formError, setFormError] = useState('');
  const [actionAllocationId, setActionAllocationId] = useState<string | null>(null);
  const [deactivateCandidate, setDeactivateCandidate] = useState<{ id: string; name: string } | null>(null);
  const [activateCandidate, setActivateCandidate] = useState<{ id: string; name: string } | null>(null);
  const [exporting, setExporting] = useState(false);

  const allocations = data?.allocations || [];
  useRealtimeRefresh(
    { topics: ['ALLOCATION', 'USER', 'PROJECT'] },
    async () => {
      await Promise.all([refetch(), refetchUsers(), refetchProjects()]);
    },
  );
  const users = (usersData?.users || []).filter((row: any) => row.isActive);
  const projects = (projectsData?.projects || []).filter((row: any) => row.isActive);

  const filteredAllocations = useMemo(
    () =>
      allocations.filter((row: any) => {
        if (statusFilter === 'ACTIVE' && !row.isActive) return false;
        if (statusFilter === 'INACTIVE' && row.isActive) return false;
        return [row.user?.name, row.project?.name, row.project?.code, row.assignedBy?.name, row.assignedBy?.email]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase());
      }),
    [allocations, search, statusFilter],
  );
  const totalAllocationPercent = allocations.reduce((sum: number, row: any) => sum + Number(row.percentage || 0), 0);
  const activeAllocationPercent = allocations
    .filter((row: any) => row.isActive)
    .reduce((sum: number, row: any) => sum + Number(row.percentage || 0), 0);
  const avgAllocationPercent = allocations.length ? (totalAllocationPercent / allocations.length).toFixed(1) : '0.0';
  const activeUserCount = new Set(
    allocations.filter((row: any) => row.isActive).map((row: any) => row.userId),
  ).size;

  function openCreate() {
    setModalOpen(true);
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setFormError('');
  }

  function openEdit(row: any) {
    setModalOpen(true);
    setEditingId(row.id);
    setForm({
      userId: row.userId,
      projectId: row.projectId,
      percentage: String(row.percentage),
    });
    setErrors({});
    setFormError('');
  }

  function validateForm() {
    const next: AllocationErrors = {};
    if (!form.userId) next.userId = 'User is required.';
    if (!form.projectId) next.projectId = 'Project is required.';
    if (!form.percentage) next.percentage = 'Allocation percentage is required.';
    else if (Number(form.percentage) < 0 || Number(form.percentage) > 100) {
      next.percentage = 'Allocation percentage must be between 0 and 100.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validateForm()) return;

    setFormError('');
    try {
      if (editingId) {
        await updateAllocation({
          variables: {
            id: editingId,
            input: { percentage: Number(form.percentage) },
          },
        });
      } else {
        await createAllocation({
          variables: {
            input: {
              userId: form.userId,
              projectId: form.projectId,
              percentage: Number(form.percentage),
            },
          },
        });
      }
      showSuccess(editingId ? 'Allocation updated successfully.' : 'Allocation created successfully.');
    } catch (error) {
      setFormError(getErrorMessage(error, 'Unable to save allocation.'));
      return;
    }

    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    await refetch();
  }

  async function handleDeactivate(id: string) {
    setActionAllocationId(id);
    try {
      await deactivateAllocation({ variables: { id } });
      await refetch();
      showSuccess('Allocation deactivated successfully.');
      setDeactivateCandidate(null);
    } catch (error) {
      showError(getErrorMessage(error, 'Unable to deactivate allocation.'));
    } finally {
      setActionAllocationId(null);
    }
  }

  async function handleActivate(id: string) {
    setActionAllocationId(id);
    try {
      await updateAllocation({ variables: { id, input: { isActive: true } } });
      await refetch();
      showSuccess('Allocation activated successfully.');
      setActivateCandidate(null);
    } catch (error) {
      showError(getErrorMessage(error, 'Unable to activate allocation.'));
    } finally {
      setActionAllocationId(null);
    }
  }

  async function handleExportCsv() {
    setExporting(true);

    try {
      const Papa = (await import('papaparse')).default;
      const csv = Papa.unparse(
        filteredAllocations.map((row: any) => ({
          'Allocation ID': row.id,
          'User ID': row.userId,
          User: row.user?.name || '—',
          'User Email': row.user?.email || '—',
          'Project ID': row.projectId,
          Project: row.project?.name || '—',
          'Project Code': row.project?.code || '—',
          'Assigned By': row.assignedBy?.name || '—',
          'Assigned By Email': row.assignedBy?.email || '—',
          'Allocation Percentage': Number(row.percentage).toFixed(2),
          Period: row.isActive ? 'Ongoing' : 'Inactive Allocation',
          Status: row.isActive ? 'Active' : 'Inactive',
        })),
      );
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStamp = new Date().toISOString().slice(0, 10);

      link.href = url;
      link.setAttribute('download', `allocations-${dateStamp}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      showSuccess(`Exported ${filteredAllocations.length} allocation row(s) to CSV.`);
    } catch (error) {
      showError(getErrorMessage(error, 'Unable to export allocations.'));
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
                <h1>Allocation Management</h1>
                <p>Assign resources to projects and manage their workload percentages.</p>
              </div>
              <Button onClick={openCreate}>Create Allocation</Button>
            </div>

            {error ? <div className="banner error">{getErrorMessage(error, 'Unable to load allocations.')}</div> : null}

            <div className="metric-grid">
              <div className="metric-card">
                <div className="section-caption">Total Allocations</div>
                <div className="metric-card-value">{allocations.length}</div>
              </div>
              <div className="metric-card">
                <div className="section-caption">Active Projects</div>
                <div className="metric-card-value">{projects.length}</div>
              </div>
              <div className="metric-card">
                <div className="section-caption">Inactive Allocations</div>
                <div className="metric-card-value">
                  {allocations.filter((row: any) => !row.isActive).length}
                </div>
              </div>
              <div className="metric-card">
                <div className="section-caption">Visible Rows</div>
                <div className="metric-card-value">{filteredAllocations.length}</div>
              </div>
            </div>

            <div className="card table-card">
              <div className="toolbar" style={{ padding: 20, borderBottom: '1px solid #f1f5f9' }}>
                <div className="toolbar-group">
                  <Select
                    className="allocation-status-select"
                    style={{ width: 170 }}
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </Select>
                  <Button className="secondary" onClick={handleExportCsv} loading={exporting} loadingText="Exporting...">
                    Download CSV
                  </Button>
                </div>
                <Input
                  className="search"
                  placeholder="Filter by user or project..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Project</th>
                    <th>Assigned By</th>
                    <th>Allocation %</th>
                    <th>Period</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAllocations.map((row: any) => (
                    <tr key={row.id}>
                      <td>{row.user?.name}</td>
                      <td>{row.project?.name}</td>
                      <td>{row.assignedBy?.name || '—'}</td>
                      <td>{Number(row.percentage).toFixed(2)}%</td>
                      <td>{row.isActive ? 'Ongoing' : 'Inactive Allocation'}</td>
                      <td>
                        <Badge tone={row.isActive ? 'active' : 'inactive'}>
                          {row.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td>
                        <div className="table-row-action">
                          <Button className="secondary" onClick={() => openEdit(row)}>
                            Edit
                          </Button>
                          {row.isActive ? (
                            <Button
                              className="danger"
                              onClick={() =>
                                setDeactivateCandidate({
                                  id: row.id,
                                  name: `${row.user?.name || 'User'} → ${row.project?.name || 'Project'}`,
                                })
                              }
                              loading={actionAllocationId === row.id}
                              loadingText="Deactivating..."
                            >
                              Deactivate
                            </Button>
                          ) : (
                            <Button
                              className="secondary"
                              onClick={() =>
                                setActivateCandidate({
                                  id: row.id,
                                  name: `${row.user?.name || 'User'} → ${row.project?.name || 'Project'}`,
                                })
                              }
                              loading={actionAllocationId === row.id}
                              loadingText="Activating..."
                            >
                              Activate
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="pagination-bar">
                <span>
                  Showing 1 to {filteredAllocations.length} of {allocations.length} results
                </span>
                <div className="table-row-action">
                  <Button className="secondary" disabled>
                    ‹
                  </Button>
                  <Button className="secondary" disabled={filteredAllocations.length === 0}>
                    ›
                  </Button>
                </div>
              </div>
            </div>

            <div className="content-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <div className="insight-card">
                <div style={{ fontWeight: 700 }}>i</div>
                <div>
                  <div style={{ fontWeight: 700 }}>Allocation Tip</div>
                  <div className="helper-text">
                    Active allocations currently represent {activeAllocationPercent.toFixed(1)}% of total assigned effort across {activeUserCount} active users.
                  </div>
                </div>
              </div>
              <div className="insight-card secondary">
                <div style={{ fontWeight: 700 }}>★</div>
                <div>
                  <div style={{ fontWeight: 700 }}>Smart Suggestions</div>
                  <div className="helper-text">
                    Average allocation size is {avgAllocationPercent}%. {projects.length} active project(s) are available for new assignments.
                  </div>
                </div>
              </div>
            </div>

            {modalOpen ? (
              <AllocationModal
                editing={!!editingId}
                form={form}
                setForm={setForm}
                users={users}
                projects={projects}
                errors={errors}
                formError={formError}
                saving={creating || updating}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
              />
            ) : null}

            {deactivateCandidate ? (
              <ConfirmAllocationModal
                title="Deactivate Allocation"
                message={`Are you sure you want to deactivate ${deactivateCandidate.name}?`}
                confirmLabel="Deactivate"
                confirmClassName="danger"
                loadingText="Deactivating..."
                loading={actionAllocationId === deactivateCandidate.id}
                onClose={() => {
                  if (!actionAllocationId) setDeactivateCandidate(null);
                }}
                onConfirm={() => handleDeactivate(deactivateCandidate.id)}
              />
            ) : null}

            {activateCandidate ? (
              <ConfirmAllocationModal
                title="Activate Allocation"
                message={`Are you sure you want to activate ${activateCandidate.name}?`}
                confirmLabel="Activate"
                loadingText="Activating..."
                loading={actionAllocationId === activateCandidate.id}
                onClose={() => {
                  if (!actionAllocationId) setActivateCandidate(null);
                }}
                onConfirm={() => handleActivate(activateCandidate.id)}
              />
            ) : null}
          </main>
        </div>
      </div>
    </RouteGuard>
  );
}
