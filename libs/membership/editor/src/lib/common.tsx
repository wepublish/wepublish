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

const showSavedToast = (t: TFunction): void => {
  toaster.push(
    <Message
      type="success"
      showIcon
      closable
      duration={3000}
    >
      {t('subscriptionFlow.savedChange').toString()}
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
  return {
    ...DEFAULT_QUERY_OPTIONS(),
    onCompleted: () => showSavedToast(t),
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
