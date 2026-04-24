'use client';

import { useApolloClient, useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LOGOUT_MUTATION } from '@/lib/graphql/documents';
import { getErrorMessage } from '@/lib/utils/errors';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useFeedback } from '../ui/FeedbackProvider';

export function Topbar({
  user,
  title = 'LOE Tracker',
}: {
  user?: { id?: string; name?: string; role?: string } | null;
  title?: string;
}) {
  const apolloClient = useApolloClient();
  const [logout, { loading }] = useMutation(LOGOUT_MUTATION);
  const router = useRouter();
  const { showError, showSuccess } = useFeedback();
  const [logoutError, setLogoutError] = useState('');

  const initials = (user?.name || 'ET')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
        <div className="topbar-title">{title}</div>
      </div>

      <div className="topbar-actions">
        <div style={{ width: 1, height: 28, background: '#e2e8f0' }} />
        <div className="profile-block">
          <div style={{ textAlign: 'right' }}>
            {user?.role ? (
              <Badge tone={user.role === 'ADMIN' ? 'approved' : 'submitted'}>
                {user.role === 'ADMIN' ? 'Admin Role' : user.role}
              </Badge>
            ) : null}
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
              {user?.name || 'PixelEDGE User'}
            </div>
          </div>
          <div className="profile-avatar">{initials}</div>
          <Button
            className="ghost"
            loading={loading}
            loadingText="Logging out..."
            onClick={async () => {
              try {
                setLogoutError('');
                await logout();
                await apolloClient.clearStore();
                showSuccess('Signed out successfully.');
                router.push('/login');
              } catch (error) {
                const message = getErrorMessage(error, 'Unable to log out right now.');
                setLogoutError(message);
                showError(message);
              }
            }}
          >
            Logout
          </Button>
        </div>
      </div>
      {logoutError ? <div className="topbar-inline-error">{logoutError}</div> : null}
    </header>
  );
}
