import { ApolloClient, InMemoryCache } from '@apollo/client';
import { ApolloLink, execute } from '@apollo/client/link';
import { gql } from 'graphql-tag';
import { Observable } from 'rxjs';

import { queryErrorLink, setQueryErrorHandler } from './query-errors';

const failing = new ApolloLink(
  () => new Observable(subscriber => subscriber.error(new Error('kaputt')))
);

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: ApolloLink.empty(),
});

const run = (document: ReturnType<typeof gql>) =>
  new Promise<void>(resolve => {
    execute(
      ApolloLink.from([queryErrorLink, failing]),
      { query: document },
      { client }
    ).subscribe({
      error: () => resolve(),
      complete: () => resolve(),
    });
  });

const aQuery = gql`
  query Users {
    users {
      id
    }
  }
`;

const aMutation = gql`
  mutation CreateUser {
    createUser {
      id
    }
  }
`;

const handler = vi.fn();

beforeEach(() => {
  handler.mockReset();
  setQueryErrorHandler(handler);
});

afterEach(() => setQueryErrorHandler(undefined));

describe('queryErrorLink', () => {
  it('reports what a query failed with', async () => {
    await run(aQuery);

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'kaputt' })
    );
  });

  it('leaves mutations to their own error handling', async () => {
    await run(aMutation);

    expect(handler).not.toHaveBeenCalled();
  });

  it('does nothing until somebody is listening', async () => {
    setQueryErrorHandler(undefined);

    await expect(run(aQuery)).resolves.toBeUndefined();
  });
});
