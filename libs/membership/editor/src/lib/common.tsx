import { TFunction } from 'i18next';
import { useEffect } from 'react';
import { humanizeError, enqueueSnackbar } from '@wepublish/ui/editor';

export const showErrors = (error: Error): void => {
  enqueueSnackbar(humanizeError(error), {
    variant: 'error',
    autoHideDuration: 8000,
  });
};

const showSuccessToast = (message: string): void => {
  enqueueSnackbar(message, { variant: 'success', autoHideDuration: 3000 });
};

/**
 * Default options for the GraphQL client. Displays errors and a completion message.
 * @param client the graphql client to make the request with
 * @param t the translation instance
 * @returns QueryHookOptions for the GraphQL client
 */
export const DEFAULT_MUTATION_OPTIONS = (t: TFunction) => {
  return MUTATION_OPTIONS_WITH_SUCCESS_MESSAGE(
    t('subscriptionFlow.savedChange').toString()
  );
};

/**
 * Like DEFAULT_MUTATION_OPTIONS, but confirms with a message that fits the
 * mutation instead of the generic «change saved».
 */
export const MUTATION_OPTIONS_WITH_SUCCESS_MESSAGE = (message: string) => {
  return {
    onError: showErrors,
    onCompleted: () => showSuccessToast(message),
  };
};

/**
 * Toasts query errors. Apollo Client 4 removed `onError` from the query
 * hooks, so pass the hook result's `error` here instead.
 */
export const useShowErrors = (error: Error | undefined): void => {
  useEffect(() => {
    if (error) {
      showErrors(error);
    }
  }, [error]);
};
