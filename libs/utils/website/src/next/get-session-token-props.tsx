import { ApolloClient } from '@apollo/client';
import { AuthTokenStorageKey } from '@wepublish/authentication/website';
import {
  FullSessionWithTokenWithoutUserFragment,
  MeDocument,
} from '@wepublish/website/api';
import { deleteCookie, getCookie } from 'cookies-next';
import { GetServerSidePropsContext, NextPageContext } from 'next';

export const getSessionTokenProps = async (
  ctx: GetServerSidePropsContext | NextPageContext
): Promise<{
  sessionToken: FullSessionWithTokenWithoutUserFragment | null;
}> => {
  try {
    const token = await getCookie(AuthTokenStorageKey, { req: ctx.req });
    const sessionToken =
      token ?
        (JSON.parse(
          token.toString()
        ) as FullSessionWithTokenWithoutUserFragment)
      : null;

    return {
      sessionToken,
    };
  } catch (e) {
    console.error(e);
    deleteCookie(AuthTokenStorageKey, { req: ctx.req });

    return { sessionToken: null };
  }
};

export const withAcceptedSessionProps = (
  ctx: GetServerSidePropsContext | NextPageContext,
  client: ApolloClient,
  sessionProps: { sessionToken: FullSessionWithTokenWithoutUserFragment | null }
): { sessionToken: FullSessionWithTokenWithoutUserFragment | null } => {
  if (!sessionProps.sessionToken) {
    return sessionProps;
  }

  const cached = client.readQuery({ query: MeDocument });

  if (cached && !cached.me) {
    deleteCookie(AuthTokenStorageKey, { req: ctx.req, res: ctx.res });

    return { sessionToken: null };
  }

  return sessionProps;
};
