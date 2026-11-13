import type {
  ApolloClient,
  OperationVariables,
  TypedDocumentNode,
} from '@apollo/client';
import { useApolloClient } from '@apollo/client/react';

export function useQueryLoader<TData, TVariables extends OperationVariables, R>(
  query: TypedDocumentNode<TData, TVariables>,
  variables: NoInfer<TVariables>,
  select: (data: TData) => R
): () => Promise<R> {
  const client = useApolloClient();

  return async () => {
    const options = {
      query,
      variables,
      fetchPolicy: 'network-only',
    } as ApolloClient.QueryOptions<TData, TVariables>;
    const { data } = await client.query(options);

    if (data === undefined || data === null) {
      throw new Error('');
    }

    return select(data as TData);
  };
}
