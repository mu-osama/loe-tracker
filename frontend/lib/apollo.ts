'use client';

import { ApolloClient, HttpLink, InMemoryCache, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql',
  credentials: 'include',
});

export function createApolloClient() {
  const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';
  const wsUrl = graphqlUrl.replace(/^http/, 'ws');
  const wsLink =
    typeof window === 'undefined'
      ? null
      : new GraphQLWsLink(
          createClient({
            url: wsUrl,
            lazy: true,
            retryAttempts: 5,
            shouldRetry: () => true,
          }) as any,
        );

  const link = wsLink
    ? split(
        ({ query }) => {
          const definition = getMainDefinition(query);
          return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
        },
        wsLink,
        httpLink,
      )
    : httpLink;

  return new ApolloClient({
    link,
    cache: new InMemoryCache(),
  });
}
