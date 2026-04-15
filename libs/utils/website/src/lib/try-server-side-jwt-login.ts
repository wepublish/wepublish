import { AuthTokenStorageKey } from '@wepublish/authentication/website';
import {
  getV1ApiClient,
  LoginWithJwtDocument,
  SessionWithTokenWithoutUser,
} from '@wepublish/website/api';
import { setCookie } from 'cookies-next';
import { NextPageContext } from 'next';

export async function tryServerSideJwtLogin(
  ctx: NextPageContext,
  client: ReturnType<typeof getV1ApiClient>,
  options?: { httpOnly?: boolean }
): Promise<boolean> {
  try {
    const data = await client.mutate({
      mutation: LoginWithJwtDocument,
      variables: {
        jwt: ctx.query.jwt,
      },
    });

    if (data.data?.createSessionWithJWT) {
      setCookie(
        AuthTokenStorageKey,
        JSON.stringify(
          data.data.createSessionWithJWT as SessionWithTokenWithoutUser
        ),
        {
          req: ctx.req,
          res: ctx.res,
          expires: new Date(data.data.createSessionWithJWT.expiresAt),
          sameSite: 'strict',
          ...(options?.httpOnly ? { httpOnly: true } : {}),
        }
      );
      return true;
    }
  } catch {
    // JWT expired or invalid
  }

  return false;
}

export const EXPIRED_JWT_MESSAGE =
  'Dieser Link ist nicht mehr gültig. Bitte hier einen neuen Link anfordern oder mit Benutzernamen und Passwort anmelden.';

export function redirectToLoginWithError(ctx: NextPageContext) {
  if (ctx.res && !ctx.res.headersSent) {
    const url = `/login?error=${encodeURIComponent(EXPIRED_JWT_MESSAGE)}`;
    ctx.res.writeHead(302, { Location: url });
    ctx.res.end();
  }
}

