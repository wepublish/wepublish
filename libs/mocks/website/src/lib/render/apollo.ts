import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client';
import { MockLink } from '@apollo/client/testing';
import { possibleTypes } from '@wepublish/website/api';
import { tap } from 'rxjs';

export type TestApolloOptions = {
  mocks?: ReadonlyArray<MockLink.MockedResponse>;
  defaultOptions?: ApolloClient.DefaultOptions;
};

export const testApolloDefaultOptions = {
  query: { errorPolicy: 'all' },
  watchQuery: { errorPolicy: 'all' },
} as unknown as ApolloClient.DefaultOptions;

class StrictMockLink extends MockLink {
  readonly unmatched: string[] = [];

  override request(operation: ApolloLink.Operation) {
    return super.request(operation).pipe(
      tap({
        error: (error: unknown) => {
          if (
            error instanceof Error &&
            error.message.startsWith('No more mocked responses')
          ) {
            this.unmatched.push(
              `${operation.operationName ?? 'Unnamed operation'}: ${error.message}`
            );
          }
        },
      })
    );
  }
}

export const createTestApolloClient = ({
  mocks = [],
  defaultOptions = testApolloDefaultOptions,
}: TestApolloOptions = {}) => {
  const link = new StrictMockLink(mocks, {
    showWarnings: false,
    defaultOptions: { delay: 0 },
  });
  const client = new ApolloClient({
    cache: new InMemoryCache({ possibleTypes: possibleTypes.possibleTypes }),
    defaultOptions,
    link,
  });

  const assertAllOperationsMocked = async () => {
    await new Promise(resolve => setTimeout(resolve, 0));

    const unmatched = link.unmatched.splice(0);

    if (unmatched.length) {
      throw new Error(
        [
          `The test sent ${unmatched.length} GraphQL operation(s) without a matching mock. Add them to the \`mocks\` option of renderWithProviders, with the exact variables.`,
          ...unmatched,
        ].join('\n\n')
      );
    }
  };

  return { client, assertAllOperationsMocked };
};
