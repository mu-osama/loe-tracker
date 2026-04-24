export function getErrorMessage(error: unknown, fallback = 'Something went wrong.') {
  if (!error) {
    return fallback;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'object') {
    const maybeApollo = error as {
      message?: string;
      graphQLErrors?: Array<{ message?: string }>;
      networkError?: { message?: string };
    };

    const graphQlMessage = maybeApollo.graphQLErrors?.find((entry) => entry?.message)?.message;
    if (graphQlMessage) {
      return graphQlMessage;
    }

    if (maybeApollo.networkError?.message) {
      return maybeApollo.networkError.message;
    }

    if (maybeApollo.message) {
      return maybeApollo.message;
    }
  }

  return fallback;
}
