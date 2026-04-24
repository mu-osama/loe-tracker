'use client';

import { useApolloClient, useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useFeedback } from '@/components/ui/FeedbackProvider';
import { LOGIN_MUTATION } from '@/lib/graphql/documents';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getErrorMessage } from '@/lib/utils/errors';

export default function LoginPage() {
  const apolloClient = useApolloClient();
  const router = useRouter();
  const { showError, showSuccess } = useFeedback();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState('');
  const [login, { loading }] = useMutation(LOGIN_MUTATION);

  function validate() {
    const nextErrors: { email?: string; password?: string } = {};

    if (!form.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!form.password) {
      nextErrors.password = 'Password is required.';
    } else if (form.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setError('');
      await login({ variables: form });
      await apolloClient.resetStore();
      showSuccess('Signed in successfully.');
      router.push('/dashboard');
    } catch (err) {
      const message = getErrorMessage(err, 'Invalid credentials.');
      setError(message);
      showError(message);
    }
  }

  return (
    <main className="login-shell">
      <div className="login-backdrop" />
      <section className="login-layout">
        <div className="login-story">
          <div className="login-brand-block">
            <div className="login-eyebrow">Enterprise LOE Operations</div>
            <div className="login-brand-row">
              <div className="login-brand-mark">PE</div>
              <div>
                <div className="login-brand-title">PixelEDGE</div>
                <div className="login-brand-subtitle">Level of Effort Control Center</div>
              </div>
            </div>
            <h1 className="login-title">Professional monthly effort tracking for users and admins.</h1>
            <p className="login-copy">
              Track project hours, manage shared categories, monitor utilization, and complete month-end review actions
              in one workspace built for operational accuracy.
            </p>
          </div>

          <div className="login-highlight-grid">
            <div className="login-highlight-card emphasis">
              <span className="login-highlight-metric">120%+</span>
              <span className="login-highlight-label">Over-utilization visibility</span>
              <p>Surface employees who exceed expected monthly capacity before reporting and approvals drift.</p>
            </div>
            <div className="login-highlight-card">
              <span className="login-highlight-metric">2 Roles</span>
              <span className="login-highlight-label">One connected workflow</span>
              <p>Users manage monthly sheets and review actions, while admins monitor compliance across the organization.</p>
            </div>
            <div className="login-highlight-card">
              <span className="login-highlight-metric">Daily</span>
              <span className="login-highlight-label">Entry-level accuracy</span>
              <p>Capture hours by working day with project allocations, time-off entries, and monthly completeness checks.</p>
            </div>
          </div>

          <div className="login-info-grid">
            <div className="login-panel">
              <div className="login-panel-title">What The Application Covers</div>
              <ul className="login-feature-list">
                <li>Monthly LOE sheets with working-day coverage validation before submission.</li>
                <li>Project allocations and fixed categories such as Time-Off and Open to New Projects.</li>
                <li>Review actions for submitted sheets, including approval and reopen comments.</li>
                <li>Admin oversight for delayed months, utilization levels, and organization-wide compliance.</li>
              </ul>
            </div>

            <div className="login-panel">
              <div className="login-panel-title">Typical Monthly Flow</div>
              <div className="login-flow-list">
                <div className="login-flow-step">
                  <span>1</span>
                  <div>
                    <strong>Log effort daily</strong>
                    <p>Users enter hours across allocated projects and shared categories during the month.</p>
                  </div>
                </div>
                <div className="login-flow-step">
                  <span>2</span>
                  <div>
                    <strong>Submit for review</strong>
                    <p>Sheets move into review once all working days are covered and the month is ready.</p>
                  </div>
                </div>
                <div className="login-flow-step">
                  <span>3</span>
                  <div>
                    <strong>Approve or reopen</strong>
                    <p>Any authorized user can approve the sheet or reopen it with a clear corrective comment.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form className="login-form-card" onSubmit={handleSubmit}>
          <div className="login-form-header">
            <div className="login-form-kicker">Secure Access</div>
            <h2>Sign in to continue</h2>
            <p>Use your organization credentials to access dashboards, monthly sheets, review actions, and admin reporting.</p>
          </div>

          <div className="login-role-strip">
            <div className="login-role-card">
              <strong>User</strong>
              <span>Log effort, submit sheets, and complete allowed review actions</span>
            </div>
            <div className="login-role-card">
              <strong>Admin</strong>
              <span>Track delayed, approved, and over-utilized cases</span>
            </div>
          </div>

          <div className="field">
            <label>Email</label>
            <Input
              className={fieldErrors.email ? 'error' : ''}
              type="email"
              placeholder="name@company.com"
              value={form.email}
              onChange={(event) => {
                setForm({ ...form, email: event.target.value });
                setFieldErrors((current) => ({ ...current, email: undefined }));
              }}
            />
            {fieldErrors.email ? <div className="field-error">{fieldErrors.email}</div> : null}
          </div>
          <div className="field">
            <label>Password</label>
            <Input
              className={fieldErrors.password ? 'error' : ''}
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={form.password}
              onChange={(event) => {
                setForm({ ...form, password: event.target.value });
                setFieldErrors((current) => ({ ...current, password: undefined }));
              }}
            />
            {fieldErrors.password ? <div className="field-error">{fieldErrors.password}</div> : null}
          </div>

          <div className="login-form-meta">
            <label className="login-checkbox">
              <input type="checkbox" checked={showPassword} onChange={() => setShowPassword((current) => !current)} />
              <span>Show password</span>
            </label>
            <span className="login-meta-note">Protected organization workspace</span>
          </div>

          {error ? <div className="banner error">{error}</div> : null}

          <Button type="submit" disabled={loading} loading={loading} loadingText="Signing in...">
            Sign In
          </Button>

          <div className="login-credential-panel">
            <div className="login-panel-title">Seeded Access</div>
            <div className="login-credential-list">
              <div>
                <strong>Admin</strong>
                <span>admin@company.com / Admin@1234</span>
              </div>
              <div>
                <strong>User</strong>
                <span>user@company.com / User@1234</span>
              </div>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}
