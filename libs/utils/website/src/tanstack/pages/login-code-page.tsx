import { useLoaderData, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { SessionWithTokenWithoutUser } from '@wepublish/website/api';

import {
  LoginCodeFailed,
  LoginCodeFailure,
  loginCodeOutcome,
  LoginCodeRedeemed,
} from '../../lib/components/login-code/login-code';
import { redeemLoginCode } from '../../lib/handle-login-code';
import { createSsrClient, setSessionCookie } from '../ssr';

export type LoginCodePageOptions = {
  next?: string;
  loginPath?: string;
};

/** What `loginCodeRoute`'s loader hands the page. */
export type LoginCodeLoaderData =
  | { sessionToken: SessionWithTokenWithoutUser; next: string }
  | { sessionToken: null; failure: LoginCodeFailure };

/**
 * Server half of the personal login link: redeem the code and set the session
 * cookie. A `POST`, because it uses the code up — nothing may fetch it ahead
 * of the reader. The session it returns ends up in the page: the route has to
 * be `no-store`.
 */
export const loadLoginCode = createServerFn({ method: 'POST' })
  .validator((data: { code: string }) => data)
  .handler(async ({ data }) => {
    const outcome = loginCodeOutcome(
      await redeemLoginCode(createSsrClient(), data.code)
    );

    if (outcome.kind === 'ok') {
      setSessionCookie(outcome.sessionToken);
    }

    return outcome;
  });

/**
 * `next/pages/login-code-page.tsx` for TanStack Start. Mounted by
 * `loginCodeRoute`, whose loader redeemed the code.
 */
export const createLoginCodePage = ({
  loginPath = '/login',
}: Pick<LoginCodePageOptions, 'loginPath'> = {}) =>
  function LoginCodePage() {
    const data = useLoaderData({ strict: false }) as LoginCodeLoaderData;
    const navigate = useNavigate();

    if (!data.sessionToken) {
      return (
        <LoginCodeFailed
          failure={data.failure}
          loginPath={loginPath}
        />
      );
    }

    const { next } = data;

    return (
      <LoginCodeRedeemed
        sessionToken={data.sessionToken}
        onRedeemed={() => navigate({ href: next, replace: true })}
      />
    );
  };
