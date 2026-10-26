import type { OperationVariables, TypedDocumentNode } from '@apollo/client';
import { useApolloClient } from '@apollo/client/react';
import { useCallback } from 'react';

import { fetchAllPages } from './table-export';

type Page<Node> = { nodes: Node[]; totalCount: number };

export function useTableExportQuery<
  Data,
  Variables extends OperationVariables,
  Node,
>(
  document: TypedDocumentNode<Data, Variables>,
  variables: Omit<Variables, 'skip' | 'take'>,
  select: (data: Data) => Page<Node> | null | undefined
) {
  const client = useApolloClient();

  return useCallback(
    () =>
      fetchAllPages<Node>(async (skip, take) => {
        const { data } = await client.query({
          query: document,
          variables: { ...variables, take, skip } as unknown as Variables,
          fetchPolicy: 'network-only',
        });

        return (data && select(data as Data)) || { nodes: [], totalCount: 0 };
      }),
    [client, document, variables, select]
  );
}
