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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: ApolloClient<any>,
  code: string,
  totpToken?: string
): Promise<LoginCodeRedemption> => {
  const { data, errors } = await client.mutate<LoginWithCodeMutation>({
    mutation: LoginWithCodeDocument,
    variables: { code, totpToken },
    errorPolicy: 'all',
  });

  if (errors?.length || !data?.createSessionWithLoginCode) {
    const message = errors?.[0]?.message ?? '';

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
