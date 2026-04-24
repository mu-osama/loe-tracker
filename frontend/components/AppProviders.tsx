'use client';

import { ApolloProvider } from '@apollo/client';
import { createApolloClient } from '@/lib/apollo';
import { FeedbackProvider } from '@/components/ui/FeedbackProvider';

const client = createApolloClient();

export function AppProviders({ children }: { children?: any }) {
  return (
    <ApolloProvider client={client}>
      <FeedbackProvider>{children}</FeedbackProvider>
    </ApolloProvider>
  );
}
