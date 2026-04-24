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
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { getErrorMessage } from '@/lib/utils/errors';
import {
  CREATE_PROJECT_MUTATION,
  DEACTIVATE_PROJECT_MUTATION,
  PROJECTS_QUERY,
  UPDATE_PROJECT_MUTATION,
} from '@/lib/graphql/documents';

const emptyProjectForm = {
  name: '',
  code: '',
  description: '',
};

type ProjectFieldErrors = Partial<Record<keyof typeof emptyProjectForm, string>>;

function ProjectModal({
  editing,
  form,
  setForm,
  errors,
  formError,
  saving,
  onClose,
  onSubmit,
}: {
  editing: boolean;
  form: typeof emptyProjectForm;
  setForm: (value: typeof emptyProjectForm) => void;
  errors: ProjectFieldErrors;
  formError: string;
  saving: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
}) {
  return (
    <Modal onClose={onClose}>
      <div className="modal-header">
        <div className="page-title">
          <h2>{editing ? 'Edit Project' : 'Create Project'}</h2>
          <p>Maintain the active project catalog used in allocations and LOE sheets.</p>
        </div>
        <Button className="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
      <div className="modal-body">
        {formError ? <div className="banner error">{formError}</div> : null}
        <div className="field">
          <label>Project Name</label>
          <Input
            className={errors.name ? 'error' : ''}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          {errors.name ? <div className="field-error">{errors.name}</div> : null}
        </div>
        <div className="field">
          <label>Code</label>
          <Input
            className={errors.code ? 'error' : ''}
            value={form.code}
            onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })}
          />
          {errors.code ? <div className="field-error">{errors.code}</div> : null}
        </div>
        <div className="field">
          <label>Description</label>
          <textarea
            className={`textarea ${errors.description ? 'error' : ''}`.trim()}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
          {errors.description ? <div className="field-error">{errors.description}</div> : null}
        </div>
      </div>
      <div className="modal-footer">
        <Button className="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={saving}>
          {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Project'}
        </Button>
      </div>
    </Modal>
  );
}

function ConfirmProjectModal({
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

export default function AdminProjectsPage() {
  const { user } = useAuth();
  const { data, error, refetch } = useQuery(PROJECTS_QUERY, {
    variables: { includeInactive: true },
  });
  const [createProject, { loading: creating }] = useMutation(CREATE_PROJECT_MUTATION);
  const [updateProject, { loading: updating }] = useMutation(UPDATE_PROJECT_MUTATION);
  const [deactivateProject] = useMutation(DEACTIVATE_PROJECT_MUTATION);
  const { showError, showSuccess } = useFeedback();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyProjectForm);
  const [fieldErrors, setFieldErrors] = useState<ProjectFieldErrors>({});
  const [formError, setFormError] = useState('');
  const [actionProjectId, setActionProjectId] = useState<string | null>(null);
  const [deactivateCandidate, setDeactivateCandidate] = useState<{ id: string; name: string } | null>(null);
  const [activateCandidate, setActivateCandidate] = useState<{ id: string; name: string } | null>(null);
  const [exporting, setExporting] = useState(false);

  const projects = data?.projects || [];
  useRealtimeRefresh({ topics: ['PROJECT'] }, refetch);
  const filteredProjects = useMemo(
    () =>
      projects.filter((row: any) =>
        [row.name, row.code, row.description]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [projects, search],
  );

  function openCreate() {
    setModalOpen(true);
    setEditingId(null);
    setForm(emptyProjectForm);
    setFieldErrors({});
    setFormError('');
  }

  function openEdit(row: any) {
    setModalOpen(true);
    setEditingId(row.id);
    setForm({
      name: row.name || '',
      code: row.code || '',
      description: row.description || '',
    });
    setFieldErrors({});
    setFormError('');
  }

  function validateProjectForm() {
    const nextErrors: ProjectFieldErrors = {};
    const name = form.name.trim();
    const code = form.code.trim().toUpperCase();

    if (!name) nextErrors.name = 'Project name is required.';
    if (!code) nextErrors.code = 'Project code is required.';
    else if (!/^[A-Z0-9_-]+$/.test(code)) nextErrors.code = 'Use uppercase letters, numbers, hyphens, or underscores only.';
    if (form.description.length > 300) nextErrors.description = 'Description must be 300 characters or fewer.';

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validateProjectForm()) return;

    setFormError('');
    const input = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || null,
    };

    try {
      if (editingId) {
        await updateProject({ variables: { id: editingId, input } });
      } else {
        await createProject({ variables: { input } });
      }
      showSuccess(editingId ? 'Project updated successfully.' : 'Project created successfully.');
    } catch (error) {
      setFormError(getErrorMessage(error, 'Unable to save project.'));
      return;
    }

    setModalOpen(false);
    setEditingId(null);
    setForm(emptyProjectForm);
    await refetch();
  }

  async function handleDeactivate(id: string) {
    setActionProjectId(id);
    try {
      await deactivateProject({ variables: { id } });
      await refetch();
      showSuccess('Project deactivated successfully.');
      setDeactivateCandidate(null);
    } catch (error) {
      showError(getErrorMessage(error, 'Unable to deactivate project.'));
    } finally {
      setActionProjectId(null);
    }
  }

  async function handleActivate(id: string) {
    setActionProjectId(id);
    try {
      await updateProject({ variables: { id, input: { isActive: true } } });
      await refetch();
      showSuccess('Project activated successfully.');
      setActivateCandidate(null);
    } catch (error) {
      showError(getErrorMessage(error, 'Unable to activate project.'));
    } finally {
      setActionProjectId(null);
    }
  }

  async function handleExportCsv() {
    setExporting(true);

    try {
      const Papa = (await import('papaparse')).default;
      const csv = Papa.unparse(
        filteredProjects.map((row: any) => ({
          'Project ID': row.id,
          'Project Name': row.name || '—',
          Code: row.code || '—',
          Description: row.description || '—',
          Status: row.isActive ? 'Active' : 'Inactive',
        })),
      );
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStamp = new Date().toISOString().slice(0, 10);

      link.href = url;
      link.setAttribute('download', `projects-${dateStamp}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      showSuccess(`Exported ${filteredProjects.length} project row(s) to CSV.`);
    } catch (error) {
      showError(getErrorMessage(error, 'Unable to export projects.'));
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
                <h1>Project Management</h1>
                <p>Centralized repository for all LOE tracking entities and deliverables.</p>
              </div>
              <Button onClick={openCreate}>Create Project</Button>
            </div>

            {error ? <div className="banner error">{getErrorMessage(error, 'Unable to load projects.')}</div> : null}

            <div className="metric-grid">
              <div className="metric-card">
                <div className="section-caption">Total Projects</div>
                <div className="metric-card-value">{projects.length}</div>
              </div>
              <div className="metric-card">
                <div className="section-caption">Active Projects</div>
                <div className="metric-card-value">{projects.filter((row: any) => row.isActive).length}</div>
              </div>
              <div className="metric-card">
                <div className="section-caption">Inactive Projects</div>
                <div className="metric-card-value">{projects.filter((row: any) => !row.isActive).length}</div>
              </div>
              <div className="metric-card">
                <div className="section-caption">Visible Rows</div>
                <div className="metric-card-value">{filteredProjects.length}</div>
              </div>
            </div>

            <div className="card table-card">
              <div className="toolbar" style={{ padding: 20, borderBottom: '1px solid #f1f5f9' }}>
                <div className="toolbar-group">
                  <Button className="secondary" onClick={handleExportCsv} loading={exporting} loadingText="Exporting...">
                    Download CSV
                  </Button>
                </div>
                <Input
                  className="search"
                  placeholder="Search project name, code, or description"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <table className="table">
                <thead>
                  <tr>
                    <th>Project Name</th>
                    <th>Code</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((row: any) => (
                    <tr key={row.id}>
                      <td style={{ fontWeight: 700 }}>{row.name}</td>
                      <td>{row.code}</td>
                      <td>{row.description || '—'}</td>
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
                              onClick={() => setDeactivateCandidate({ id: row.id, name: row.name })}
                              loading={actionProjectId === row.id}
                              loadingText="Deactivating..."
                            >
                              Deactivate
                            </Button>
                          ) : (
                            <Button
                              className="secondary"
                              onClick={() => setActivateCandidate({ id: row.id, name: row.name })}
                              loading={actionProjectId === row.id}
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
                <span>Page 1 of 1</span>
                <div className="table-row-action">
                  <Button className="secondary" disabled>
                    Previous
                  </Button>
                  <Button className="secondary" disabled={filteredProjects.length === 0}>
                    Next
                  </Button>
                </div>
              </div>
            </div>

            {modalOpen ? (
              <ProjectModal
                editing={!!editingId}
                form={form}
                setForm={setForm}
                errors={fieldErrors}
                formError={formError}
                saving={creating || updating}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
              />
            ) : null}

            {deactivateCandidate ? (
              <ConfirmProjectModal
                title="Deactivate Project"
                message={`Are you sure you want to deactivate ${deactivateCandidate.name}?`}
                confirmLabel="Deactivate"
                confirmClassName="danger"
                loadingText="Deactivating..."
                loading={actionProjectId === deactivateCandidate.id}
                onClose={() => {
                  if (!actionProjectId) setDeactivateCandidate(null);
                }}
                onConfirm={() => handleDeactivate(deactivateCandidate.id)}
              />
            ) : null}

            {activateCandidate ? (
              <ConfirmProjectModal
                title="Activate Project"
                message={`Are you sure you want to activate ${activateCandidate.name}?`}
                confirmLabel="Activate"
                loadingText="Activating..."
                loading={actionProjectId === activateCandidate.id}
                onClose={() => {
                  if (!actionProjectId) setActivateCandidate(null);
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
