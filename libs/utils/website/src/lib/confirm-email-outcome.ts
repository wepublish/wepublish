import { ApolloClient } from '@apollo/client';
import { SessionInfoDocument } from '@wepublish/website/api';

/**
 * Whether the browser's session is still there, and a full one, after an
 * email address was confirmed. The confirmation frees only the session that
 * asked for it and ends the account's other login-code sessions, so a page
 * that just confirmed asks before it carries on as the signed-in reader.
 */
export const sessionSurvivedConfirmation = async (
  client: Pick<ApolloClient, 'query'>
): Promise<boolean> => {
  try {
    const { data, error } = await client.query({
      query: SessionInfoDocument,
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    });

    return !error && !!data?.sessionInfo && !data.sessionInfo.restricted;
  } catch {
    return false;
  }
};
