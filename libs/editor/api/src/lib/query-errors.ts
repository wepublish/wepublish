import type { ErrorLike } from '@apollo/client';
import { ErrorLink } from '@apollo/client/link/error';
import { getMainDefinition } from '@apollo/client/utilities';

export type QueryErrorHandler = (error: ErrorLike) => void;

let handleQueryError: QueryErrorHandler | undefined;

export const setQueryErrorHandler = (handler?: QueryErrorHandler) => {
  handleQueryError = handler;
};

export const queryErrorLink = new ErrorLink(({ error, operation }) => {
  const definition = getMainDefinition(operation.query);

  if (
    handleQueryError &&
    definition.kind === 'OperationDefinition' &&
    definition.operation === 'query'
  ) {
    handleQueryError(error);
  }
});
