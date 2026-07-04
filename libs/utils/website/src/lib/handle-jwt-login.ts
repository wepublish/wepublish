import { AuthTokenStorageKey } from '@wepublish/authentication/website';
import {
  LoginWithJwtDocument,
  SessionWithTokenWithoutUser,
} from '@wepublish/website/api';
import { ApolloClient } from '@apollo/client';
import { setCookie } from 'cookies-next';
import { NextPageContext } from 'next';
import { EXPIRED_JWT_MESSAGE } from './with-jwt-handler';

/**
 * Handles JWT login from query params in getInitialProps (server-side).
 * Gracefully handles 2FA users where JWT login requires a TOTP code.
 * When TOTP is required, it returns false and the client-side
 * withJwtHandler will pick it up and show a TOTP prompt.
 * For other failures, it redirects to /login with an error message.
 */
export async function handleJwtLogin(
  ctx: NextPageContext,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: ApolloClient<any>,
  httpOnlyCookie?: boolean
): Promise<boolean> {
  if (!ctx.query.jwt) {
    return false;
  }

  try {
    const { data, errors } = await client.mutate({
      mutation: LoginWithJwtDocument,
      variables: {
        jwt: ctx.query.jwt,
      },
      errorPolicy: 'all',
    });

    if (errors?.length || !data?.createSessionWithJWT) {
      const totpRequired = errors?.some(e =>
        e.message?.includes('TOTP_REQUIRED')
      );
      if (totpRequired) {
        // Let the client-side withJwtHandler show the TOTP prompt.
        return false;
      }
      redirectToLoginWithError(ctx);
      return false;
    }

    setCookie(
      AuthTokenStorageKey,
      JSON.stringify(data.createSessionWithJWT as SessionWithTokenWithoutUser),
      {
        req: ctx.req,
        res: ctx.res,
        expires: new Date(data.createSessionWithJWT.expiresAt),
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: !!httpOnlyCookie,
      }
    );

    return true;
  } catch {
    redirectToLoginWithError(ctx);
    return false;
  }
}

function redirectToLoginWithError(ctx: NextPageContext) {
  if (ctx.res && !ctx.res.headersSent) {
    ctx.res.writeHead(302, {
      Location: `/login?error=${encodeURIComponent(EXPIRED_JWT_MESSAGE)}`,
    });
    ctx.res.end();
  }
}
