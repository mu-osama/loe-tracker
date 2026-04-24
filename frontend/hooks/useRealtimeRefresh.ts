'use client';

import { useSubscription } from '@apollo/client';
import { REALTIME_EVENT_SUBSCRIPTION } from '@/lib/graphql/documents';

type Variables = {
  topics?: string[];
  userId?: string;
  reviewerId?: string;
  year?: number;
  month?: number;
};

export function useRealtimeRefresh(
  variables: Variables,
  refresh: () => void | Promise<unknown>,
  skip = false,
) {
  useSubscription(REALTIME_EVENT_SUBSCRIPTION, {
    variables,
    skip,
    onData: () => {
      void refresh();
    },
  });
}
