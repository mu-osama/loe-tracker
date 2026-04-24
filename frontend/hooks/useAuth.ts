'use client';

import { useQuery } from '@apollo/client';
import { ME_QUERY } from '@/lib/graphql/documents';

export function useAuth() {
  const { data, loading, error, refetch } = useQuery(ME_QUERY, {
    fetchPolicy: 'cache-and-network',
  });

  return {
    user: data?.me,
    loading,
    error,
    refetch,
  };
}

