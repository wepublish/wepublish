import { ApolloClient } from '@apollo/client';
import {
  LoginWithCodeDocument,
  LoginWithCodeMutation,
} from '@wepublish/website/api';

export type LoginCodeRedemption =
  | { kind: 'ok'; session: LoginWithCodeMutation['createSessionWithLoginCode'] }
  | { kind: 'totpRequired' }
  | { kind: 'challengeRequired' }
  | { kind: 'failed'; message: string };

export const redeemLoginCode = async (
  client: ApolloClient,
  code: string,
  totpToken?: string
): Promise<LoginCodeRedemption> => {
  const { data, error } = await client.mutate({
    mutation: LoginWithCodeDocument,
    variables: { code, totpToken },
    errorPolicy: 'all',
  });

  if (error || !data?.createSessionWithLoginCode) {
    const message = error?.message ?? '';

    if (message.includes('TOTP_REQUIRED')) {
      return { kind: 'totpRequired' };
    }

    if (message.includes('CHALLENGE_REQUIRED')) {
      return { kind: 'challengeRequired' };
    }

    return { kind: 'failed', message: message || 'LOGIN_CODE_INVALID' };
  }

  return { kind: 'ok', session: data.createSessionWithLoginCode };
};
