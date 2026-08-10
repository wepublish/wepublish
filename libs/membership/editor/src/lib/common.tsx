import { ApolloError } from '@apollo/client';
import { TFunction } from 'i18next';
import { Message, toaster } from 'rsuite';

const showErrors = (error: ApolloError): void => {
  toaster.push(
    <Message
      type="error"
      showIcon
      closable
      duration={3000}
    >
      {error.message}
    </Message>
  );
};

const showSuccessToast = (message: string): void => {
  toaster.push(
    <Message
      type="success"
      showIcon
      closable
      duration={3000}
    >
      {message}
    </Message>
  );
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
    ...DEFAULT_QUERY_OPTIONS(),
    onCompleted: () => showSuccessToast(message),
  };
};

/**
 * Default options for the GraphQL client. Displays errors.
 * @param client the graphql client to make the request with
 * @returns QueryHookOptions for the GraphQL client
 */
export const DEFAULT_QUERY_OPTIONS = () => {
  return {
    onError: showErrors,
  };
};
