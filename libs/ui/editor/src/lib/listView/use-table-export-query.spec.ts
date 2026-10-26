import { gql, TypedDocumentNode } from '@apollo/client';
import { renderHook } from '@testing-library/react';

import { useTableExportQuery } from './use-table-export-query';

const query = vi.fn();

vi.mock('@apollo/client/react', () => ({
  useApolloClient: () => ({ query }),
}));

type Data = { users: { nodes: { id: number }[]; totalCount: number } };
type Variables = {
  filter?: { text?: string };
  take?: number;
  skip?: number;
};

const UsersDocument: TypedDocumentNode<Data, Variables> = gql`
  query Users($filter: UserFilter, $take: Int, $skip: Int) {
    users(filter: $filter, take: $take, skip: $skip) {
      nodes {
        id
      }
      totalCount
    }
  }
`;

describe('useTableExportQuery', () => {
  beforeEach(() => {
    query.mockReset();
  });

  it('loads every page of the list with its current filter', async () => {
    const all = Array.from({ length: 150 }, (_, id) => ({ id }));
    query.mockImplementation(
      async ({ variables }: { variables: Required<Variables> }) => ({
        data: {
          users: {
            nodes: all.slice(variables.skip, variables.skip + variables.take),
            totalCount: all.length,
          },
        },
      })
    );

    const { result } = renderHook(() =>
      useTableExportQuery(
        UsersDocument,
        { filter: { text: 'ada' }, take: 10, skip: 20 },
        data => data.users
      )
    );

    await expect(result.current()).resolves.toEqual(all);
    expect(query).toHaveBeenCalledWith({
      query: UsersDocument,
      variables: { filter: { text: 'ada' }, take: 100, skip: 0 },
      fetchPolicy: 'network-only',
    });
    expect(query).toHaveBeenLastCalledWith(
      expect.objectContaining({
        variables: { filter: { text: 'ada' }, take: 100, skip: 100 },
      })
    );
  });

  it('treats a missing result as an empty list', async () => {
    query.mockResolvedValue({ data: undefined });

    const { result } = renderHook(() =>
      useTableExportQuery(UsersDocument, {}, data => data.users)
    );

    await expect(result.current()).resolves.toEqual([]);
  });
});
