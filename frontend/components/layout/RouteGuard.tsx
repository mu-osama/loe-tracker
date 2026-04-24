'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { StateCard } from '@/components/ui/StateCard';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/utils/errors';

export function RouteGuard({ children }: { children?: any }) {
  const { user, loading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, router, user]);

  if (loading) {
    return (
      <div className="page state-page">
        <StateCard
          title="Loading workspace"
          message="Checking your session and preparing the application."
        />
      </div>
    );
  }

  if (error && user) {
    return (
      <div className="page state-page">
        <StateCard
          title="Unable to load your session"
          message={getErrorMessage(error, 'Refresh the page and try again.')}
          tone="error"
        />
      </div>
    );
  }

  return <>{children}</>;
}
