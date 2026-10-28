import type { ErrorLike, ObservableQuery } from '@apollo/client';

export type MockedResult<TData> = {
  data?: TData | null;
  error?: ErrorLike;
};

export const toApolloResult = <TData>(result?: MockedResult<TData>) => ({
  data: result?.data ?? undefined,
  ...(result?.error ? { error: result.error } : {}),
});

export const toResultPromise = <T>(value: T) => {
  const promise = Promise.resolve(value) as ObservableQuery.ResultPromise<T>;
  promise.retain = () => promise;

  return promise;
};
