import type { ErrorLike } from '@apollo/client';

/**
 * Stand-in for the `X{Query,Mutation}Result` aliases the old
 * `typescript-react-apollo` codegen emitted. The decorators only ever supply
 * `data`/`error`, so this avoids depending on Apollo Client 4's `dataState`
 * unions, which differ between `useQuery` and `useLazyQuery`.
 */
export type MockedResult<TData> = {
  data?: TData | null;
  error?: ErrorLike;
};
