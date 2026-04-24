'use client';

import { useQuery } from '@apollo/client';
import { LOE_SHEET_QUERY } from '@/lib/graphql/documents';

export function useLoeSheet(year: number, month: number, userId?: string) {
  const query = useQuery(LOE_SHEET_QUERY, {
    variables: { year, month, userId },
    skip: !year || !month,
  });

  return {
    ...query,
    sheet: query.data?.loeSheet,
  };
}

