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
import { LOCATION_MAP } from '@/lib/config/location';
import { getErrorMessage } from '@/lib/utils/errors';
import {
  CREATE_USER_MUTATION,
  DEACTIVATE_USER_MUTATION,
  UPDATE_USER_MUTATION,
  USERS_QUERY,
} from '@/lib/graphql/documents';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: '',
  position: '',
  department: '',
  reviewerId: '',
  country: '',
  city: '',
  isActive: true,
};

type UserFieldErrors = Partial<Record<keyof typeof emptyForm, string>>;

function UserModal({
  mode,
  form,
  setForm,
  errors,
  formError,
  reviewers,
  saving,
  onClose,
  onSubmit,
}: {
  mode: 'create' | 'edit';
  form: typeof emptyForm;
  setForm: (value: typeof emptyForm) => void;
  errors: UserFieldErrors;
  formError: string;
  reviewers: any[];
  saving: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
}) {
  const cityOptions = form.country ? LOCATION_MAP[form.country] || [] : [];

  return (
    <Modal onClose={onClose}>
      <div className="modal-header">
        <div className="page-title">
          <h2>{mode === 'create' ? 'Create User' : 'Edit User'}</h2>
          <p>Manage platform access, roles, and organizational reporting lines.</p>
        </div>
        <Button className="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
      <div className="modal-body">
        {formError ? <div className="banner error">{formError}</div> : null}
        <div className="form-grid">
          <div className="field">
            <label>Full Name</label>
            <Input
              className={errors.name ? 'error' : ''}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
            {errors.name ? <div className="field-error">{errors.name}</div> : null}
          </div>
          <div className="field">
            <label>Email Address</label>
            <Input
              className={errors.email ? 'error' : ''}
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
            {errors.email ? <div className="field-error">{errors.email}</div> : null}
          </div>
          <div className="field">
            <label>{mode === 'create' ? 'Password' : 'Password (optional)'}</label>
            <Input
              className={errors.password ? 'error' : ''}
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
            {errors.password ? <div className="field-error">{errors.password}</div> : null}
          </div>
          <div className="field">
            <label>Role</label>
            <Select
              className={errors.role ? 'error' : ''}
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value })}
            >
              <option value="">Select role</option>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </Select>
            {errors.role ? <div className="field-error">{errors.role}</div> : null}
          </div>
          <div className="field">
            <label>Position</label>
            <Input
              className={errors.position ? 'error' : ''}
              value={form.position}
              onChange={(event) => setForm({ ...form, position: event.target.value })}
            />
            {errors.position ? <div className="field-error">{errors.position}</div> : null}
          </div>
          <div className="field">
            <label>Department</label>
            <Select
              className={errors.department ? 'error' : ''}
              value={form.department}
              onChange={(event) => setForm({ ...form, department: event.target.value })}
            >
              <option value="">Select department</option>
              <option value="ENGINEERING">Engineering</option>
              <option value="EXPERIENCE">Experience</option>
            </Select>
            {errors.department ? <div className="field-error">{errors.department}</div> : null}
          </div>
          <div className="field">
            <label>Reviewer</label>
            <Select
              className={errors.reviewerId ? 'error' : ''}
              value={form.reviewerId}
              onChange={(event) => setForm({ ...form, reviewerId: event.target.value })}
            >
              <option value="">Select reviewer</option>
              {reviewers.map((reviewer) => (
                <option key={reviewer.id} value={reviewer.id}>
                  {reviewer.name}
                </option>
              ))}
            </Select>
            {errors.reviewerId ? <div className="field-error">{errors.reviewerId}</div> : null}
          </div>
          <div className="field">
            <label>Country</label>
            <Select
              className={errors.country ? 'error' : ''}
              value={form.country}
              onChange={(event) =>
                setForm({
                  ...form,
                  country: event.target.value,
                  city: '',
                })
              }
            >
              <option value="">Select country</option>
              {Object.keys(LOCATION_MAP).map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </Select>
            {errors.country ? <div className="field-error">{errors.country}</div> : null}
          </div>
          <div className="field">
            <label>City</label>
            <Select
              className={errors.city ? 'error' : ''}
              value={form.city}
              onChange={(event) => setForm({ ...form, city: event.target.value })}
            >
              <option value="">Select city</option>
              {cityOptions.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </Select>
            {errors.city ? <div className="field-error">{errors.city}</div> : null}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            padding: 16,
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            background: '#f8fafc',
          }}
        >
          <div>
            <div style={{ fontWeight: 700 }}>User Status</div>
            <div className="helper-text">Active users can log in and log time entries.</div>
          </div>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
            />
            <span>{form.isActive ? 'Active' : 'Inactive'}</span>
          </label>
        </div>
      </div>
      <div className="modal-footer">
        <Button className="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={saving}>
          {saving ? 'Saving...' : mode === 'create' ? 'Create User' : 'Save Changes'}
        </Button>
      </div>
    </Modal>
  );
}

function DeactivateUserModal({
  userName,
  loading,
  onClose,
  onConfirm,
}: {
  userName: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  return (
    <Modal onClose={onClose}>
      <div className="modal-header">
        <div className="page-title">
          <h2>Deactivate User</h2>
          <p>This user will no longer be able to log in or submit time entries.</p>
        </div>
        <Button className="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
      <div className="modal-body">
        <div className="banner warn">
          Are you sure you want to deactivate <strong>{userName}</strong>?
        </div>
      </div>
      <div className="modal-footer">
        <Button className="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button className="danger" onClick={onConfirm} loading={loading} loadingText="Deactivating...">
          Deactivate
        </Button>
      </div>
    </Modal>
  );
}

function ActivateUserModal({
  userName,
  loading,
  onClose,
  onConfirm,
}: {
  userName: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  return (
    <Modal onClose={onClose}>
      <div className="modal-header">
        <div className="page-title">
          <h2>Activate User</h2>
          <p>This user will be able to log in and submit time entries again.</p>
        </div>
        <Button className="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
      <div className="modal-body">
        <div className="banner" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534' }}>
          Are you sure you want to activate <strong>{userName}</strong>?
        </div>
      </div>
      <div className="modal-footer">
        <Button className="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onConfirm} loading={loading} loadingText="Activating...">
          Activate
        </Button>
      </div>
    </Modal>
  );
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { data, loading, error, refetch } = useQuery(USERS_QUERY);
  const [createUser, { loading: creating }] = useMutation(CREATE_USER_MUTATION);
  const [updateUser, { loading: updating }] = useMutation(UPDATE_USER_MUTATION);
  const [deactivateUser] = useMutation(DEACTIVATE_USER_MUTATION);
  const { showError, showSuccess } = useFeedback();
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<UserFieldErrors>({});
  const [formError, setFormError] = useState('');
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [deactivateCandidate, setDeactivateCandidate] = useState<{ id: string; name: string } | null>(null);
  const [activateCandidate, setActivateCandidate] = useState<{ id: string; name: string } | null>(null);
  const [exporting, setExporting] = useState(false);

  const users = data?.users || [];
  useRealtimeRefresh({ topics: ['USER'] }, refetch);
  const reviewers = users.filter((row: any) => row.isActive);
  const countries = Array.from(
    new Set<string>(users.map((row: any) => row.country).filter(Boolean)),
  );
  const filteredUsers = useMemo(
    () =>
      users.filter((row: any) => {
        if (activeOnly && !row.isActive) return false;
        if (countryFilter && row.country !== countryFilter) return false;
        if (roleFilter && row.role !== roleFilter) return false;
        return [row.name, row.email, row.country, row.city, row.role, row.position, row.department]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase());
      }),
    [activeOnly, countryFilter, roleFilter, search, users],
  );

  function openCreate() {
    setModalMode('create');
    setEditingId(null);
    setForm(emptyForm);
    setFieldErrors({});
    setFormError('');
  }

  function openEdit(row: any) {
    setModalMode('edit');
    setEditingId(row.id);
    setFieldErrors({});
    setFormError('');
    setForm({
      name: row.name || '',
      email: row.email || '',
      password: '',
      role: row.role || '',
      position: row.position || '',
      department: row.department || '',
      reviewerId: row.reviewerId || '',
      country: row.country || '',
      city: row.city || '',
      isActive: row.isActive,
    });
  }

  function validateUserForm() {
    const nextErrors: UserFieldErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Name is required.';
    if (!form.email.trim()) nextErrors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (!editingId && !form.password) nextErrors.password = 'Password is required.';
    else if (form.password && form.password.length < 8) nextErrors.password = 'Password must be at least 8 characters.';
    if (!form.role) nextErrors.role = 'Role is required.';
    if (!form.position.trim()) nextErrors.position = 'Position is required.';
    if (!form.department) nextErrors.department = 'Department is required.';
    if (!form.reviewerId) nextErrors.reviewerId = 'Reviewer is required.';
    if (!form.country) nextErrors.country = 'Country is required.';
    if (!form.city) nextErrors.city = 'City is required.';
    if (form.country && form.city && !(LOCATION_MAP[form.country] || []).includes(form.city)) {
      nextErrors.city = 'Select a city from the chosen country list.';
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validateUserForm()) return;

    setFormError('');
    const baseInput = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      position: form.position.trim(),
      department: form.department,
      reviewerId: form.reviewerId,
      country: form.country,
      city: form.city,
      ...(form.password ? { password: form.password } : {}),
    };

    try {
      if (editingId) {
        await updateUser({
          variables: {
            id: editingId,
            input: {
              ...baseInput,
              isActive: form.isActive,
            },
          },
        });
      } else {
        await createUser({ variables: { input: baseInput } });
      }
      showSuccess(editingId ? 'User updated successfully.' : 'User created successfully.');
    } catch (error) {
      setFormError(getErrorMessage(error, 'Unable to save user.'));
      return;
    }

    setModalMode(null);
    setEditingId(null);
    setForm(emptyForm);
    await refetch();
  }

  async function handleDeactivate(id: string) {
    setActionUserId(id);
    try {
      await deactivateUser({ variables: { id } });
      await refetch();
      showSuccess('User deactivated successfully.');
      setDeactivateCandidate(null);
    } catch (error) {
      showError(getErrorMessage(error, 'Unable to deactivate user.'));
    } finally {
      setActionUserId(null);
    }
  }

  async function handleActivate(id: string) {
    setActionUserId(id);
    try {
      await updateUser({ variables: { id, input: { isActive: true } } });
      await refetch();
      showSuccess('User activated successfully.');
      setActivateCandidate(null);
    } catch (error) {
      showError(getErrorMessage(error, 'Unable to activate user.'));
    } finally {
      setActionUserId(null);
    }
  }

  async function handleExportCsv() {
    setExporting(true);

    try {
      const Papa = (await import('papaparse')).default;
      const csv = Papa.unparse(
        filteredUsers.map((row: any) => {
          const reviewer = users.find((candidate: any) => candidate.id === row.reviewerId);

          return {
            'User ID': row.id,
            Name: row.name || '—',
            Email: row.email || '—',
            Role: row.role || '—',
            Position: row.position || '—',
            Department:
              row.department === 'ENGINEERING'
                ? 'Engineering'
                : row.department === 'EXPERIENCE'
                  ? 'Experience'
                  : '—',
            Country: row.country || '—',
            City: row.city || '—',
            Status: row.isActive ? 'Active' : 'Inactive',
            Reviewer: reviewer?.name || '—',
            'Reviewer Email': reviewer?.email || '—',
          };
        }),
      );
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStamp = new Date().toISOString().slice(0, 10);

      link.href = url;
      link.setAttribute('download', `users-${dateStamp}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      showSuccess(`Exported ${filteredUsers.length} user row(s) to CSV.`);
    } catch (error) {
      showError(getErrorMessage(error, 'Unable to export users.'));
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
                <h1>User Management</h1>
                <p>Configure enterprise access, roles, and organizational hierarchies.</p>
              </div>
              <Button onClick={openCreate}>Create User</Button>
            </div>

            {error ? <div className="banner error">{getErrorMessage(error, 'Unable to load users.')}</div> : null}

            <div className="metric-grid">
              <div className="metric-card">
                <div className="section-caption">Total Employees</div>
                <div className="metric-card-value">{users.length}</div>
              </div>
              <div className="metric-card">
                <div className="section-caption">Global Locations</div>
                <div className="metric-card-value">{countries.length}</div>
              </div>
              <div className="metric-card">
                <div className="section-caption">Active Accounts</div>
                <div className="metric-card-value">{users.filter((row: any) => row.isActive).length}</div>
              </div>
              <div className="metric-card">
                <div className="section-caption">Inactive Accounts</div>
                <div className="metric-card-value">{users.filter((row: any) => !row.isActive).length}</div>
              </div>
            </div>

            <div className="content-grid">
              <aside className="card filter-panel stack">
                <div className="page-title">
                  <h3 style={{ margin: 0 }}>Filters</h3>
                </div>
                <div className="field">
                  <label>Country</label>
                  <Select value={countryFilter} onChange={(event) => setCountryFilter(event.target.value)}>
                    <option value="">All Countries</option>
                    {countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="field">
                  <label>Role</label>
                  <Select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                    <option value="">All Roles</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="USER">USER</option>
                  </Select>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={activeOnly} onChange={(event) => setActiveOnly(event.target.checked)} />
                  <span>Active only</span>
                </label>
                <Button
                  className="ghost"
                  onClick={() => {
                    setCountryFilter('');
                    setRoleFilter('');
                    setActiveOnly(false);
                  }}
                >
                  Clear All Filters
                </Button>
              </aside>

              <div className="card table-card">
                <div className="toolbar" style={{ padding: 20, borderBottom: '1px solid #f1f5f9' }}>
                  <div className="page-title">
                    <h3 style={{ margin: 0 }}>Users</h3>
                    <p>{loading ? 'Loading users...' : `${filteredUsers.length} records shown`}</p>
                  </div>
                  <div className="toolbar-group">
                    <Button className="secondary" onClick={handleExportCsv} loading={exporting} loadingText="Exporting...">
                      Download CSV
                    </Button>
                  </div>
                  <Input
                    className="search"
                    placeholder="Search employees, roles, or locations..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>

                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Reviewer</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((row: any) => {
                      const reviewer = users.find((candidate: any) => candidate.id === row.reviewerId);
                      return (
                        <tr key={row.id}>
                          <td>
                            <div style={{ fontWeight: 700 }}>{row.name}</div>
                            <div className="helper-text">{[row.email, row.position].filter(Boolean).join(' • ')}</div>
                          </td>
                          <td>
                            <Badge tone={row.role === 'ADMIN' ? 'approved' : 'submitted'}>
                              {row.role}
                            </Badge>
                            <div className="helper-text" style={{ marginTop: 6 }}>
                              {row.department === 'ENGINEERING'
                                ? 'Engineering'
                                : row.department === 'EXPERIENCE'
                                  ? 'Experience'
                                  : '—'}
                            </div>
                          </td>
                          <td>{[row.city, row.country].filter(Boolean).join(', ') || '—'}</td>
                          <td>
                            <Badge tone={row.isActive ? 'active' : 'inactive'}>
                              {row.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td>{reviewer?.name || '—'}</td>
                          <td>
                            <div className="table-row-action">
                          <Button className="secondary" onClick={() => openEdit(row)}>
                            Edit
                          </Button>
                          {row.isActive ? (
                            <Button
                              className="danger"
                              onClick={() => setDeactivateCandidate({ id: row.id, name: row.name })}
                              loading={actionUserId === row.id}
                              loadingText="Deactivating..."
                            >
                              Deactivate
                            </Button>
                          ) : (
                            <Button
                              className="secondary"
                              onClick={() => setActivateCandidate({ id: row.id, name: row.name })}
                              loading={actionUserId === row.id}
                              loadingText="Activating..."
                            >
                              Activate
                            </Button>
                          )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {modalMode ? (
              <UserModal
                mode={modalMode}
                form={form}
                setForm={setForm}
                errors={fieldErrors}
                formError={formError}
                reviewers={reviewers}
                saving={creating || updating}
                onClose={() => setModalMode(null)}
                onSubmit={handleSubmit}
              />
            ) : null}

            {deactivateCandidate ? (
              <DeactivateUserModal
                userName={deactivateCandidate.name}
                loading={actionUserId === deactivateCandidate.id}
                onClose={() => {
                  if (!actionUserId) {
                    setDeactivateCandidate(null);
                  }
                }}
                onConfirm={() => handleDeactivate(deactivateCandidate.id)}
              />
            ) : null}

            {activateCandidate ? (
              <ActivateUserModal
                userName={activateCandidate.name}
                loading={actionUserId === activateCandidate.id}
                onClose={() => {
                  if (!actionUserId) {
                    setActivateCandidate(null);
                  }
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
