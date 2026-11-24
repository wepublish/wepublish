import { redirect } from '@tanstack/react-router';
import { z } from 'zod';

import { mergeApolloCache } from '../apollo';
import {
  DeactivatedSubscriptionsPage,
  loadDeactivatedSubscriptions,
} from '../pages/deactivated-subscriptions-page';
import { FourOhFourPage } from '../pages/404-page';
import {
  ConfirmEmailPageOptions,
  createConfirmEmailPage,
} from '../pages/confirm-email-page';
import { loginCodeStepHref } from '../../lib/components/login-code/login-code';
import {
  createLoginCodePage,
  loadLoginCode,
  LoginCodeLoaderData,
  LoginCodePageOptions,
} from '../pages/login-code-page';
import { loadLogin } from '../pages/login-page';
import { loadProfile, ProfilePage } from '../pages/profile-page';
import { loadSubscribe } from '../pages/subscribe-page';
import { loadSubscription, SubscriptionPage } from '../pages/subscription-page';
import {
  createWelcomePage,
  loadWelcome,
  WelcomePageOptions,
} from '../pages/welcome-page';
import {
  ApolloRouterContext,
  bailOutNotFound,
  jwtSearchSchema,
  searchValueSchema,
} from './shared';

/**
 * Everything behind the auth guard.
 *
 * These loaders go through `createServerFn` rather than querying the router's
 * Apollo client directly, because they need the auth cookie and may mint a
 * session from `?jwt=`. The router's client stays anonymous so the SSR HTML
 * for public pages remains CDN cacheable; the per-request authenticated cache
 * is merged in with `mergeApolloCache`.
 *
 * All of these must be `no-store` — see the `/profile` and `/login` rules in
 * the app's `src/start.ts`.
 */

/** `pages/profile/index.tsx` */
export const profileRoute = () => ({
  validateSearch: jwtSearchSchema.extend({
    // Set by the confirm-email page once the new address is in place.
    emailConfirmed: searchValueSchema.optional(),
  }),
  loaderDeps: ({ search: { jwt } }: { search: { jwt?: string } }) => ({ jwt }),
  loader: async ({
    context: { apolloClient },
    deps: { jwt },
  }: {
    context: ApolloRouterContext;
    deps: { jwt?: string };
  }) => {
    const { sessionToken, apollo } = await loadProfile({ data: { jwt } });

    mergeApolloCache(apolloClient, apollo);

    return { sessionToken };
  },
  component: ProfilePage,
});

/**
 * `pages/confirm-email.tsx`: the link in the email-change confirmation mail.
 * Confirmed from the browser, so it renders nothing user-specific on the
 * server — but its address carries the token: keep it `no-store`.
 */
export const confirmEmailRoute = (options: ConfirmEmailPageOptions = {}) => {
  const loginPath = options.loginPath ?? '/login';

  return {
    validateSearch: z.object({ token: searchValueSchema.optional() }),
    beforeLoad: ({ search }: { search: { token?: string | number | boolean } }) => {
      if (search.token == null || search.token === '') {
        throw redirect({ href: loginPath });
      }
    },
    component: createConfirmEmailPage({ ...options, loginPath }),
  };
};

/** `pages/profile/subscription/[id].tsx` */
export const subscriptionRoute = () => ({
  validateSearch: jwtSearchSchema,
  loaderDeps: ({ search: { jwt } }: { search: { jwt?: string } }) => ({ jwt }),
  loader: async ({
    context,
    deps: { jwt },
    params: { id },
  }: {
    context: ApolloRouterContext;
    deps: { jwt?: string };
    params: { id: string };
  }) => {
    const { sessionToken, subscriptionMissing, apollo } =
      await loadSubscription({ data: { id, jwt } });

    mergeApolloCache(context.apolloClient, apollo);

    if (subscriptionMissing) {
      await bailOutNotFound(context);
    }

    return { sessionToken };
  },
  component: SubscriptionPage,
  notFoundComponent: FourOhFourPage,
});

/** `pages/profile/subscription/deactivated.tsx` */
export const deactivatedSubscriptionsRoute = () => ({
  validateSearch: jwtSearchSchema,
  loaderDeps: ({ search: { jwt } }: { search: { jwt?: string } }) => ({ jwt }),
  loader: async ({
    context: { apolloClient },
    deps: { jwt },
  }: {
    context: ApolloRouterContext;
    deps: { jwt?: string };
  }) => {
    const { sessionToken, apollo } = await loadDeactivatedSubscriptions({
      data: { jwt },
    });

    mergeApolloCache(apolloClient, apollo);

    return { sessionToken };
  },
  component: DeactivatedSubscriptionsPage,
});

/**
 * `pages/mitmachen.tsx` — the subscribe flow. Tenants differ in which member
 * plans they offer, so only the loader is shared; the component stays in the
 * app.
 */
export const subscribeRouteLoader = async ({
  context: { apolloClient },
  deps: { jwt },
}: {
  context: ApolloRouterContext;
  deps: { jwt?: string };
}) => {
  const { sessionToken, apollo } = await loadSubscribe({ data: { jwt } });

  mergeApolloCache(apolloClient, apollo);

  return { sessionToken };
};

/**
 * `pages/login.tsx`. The Next page's `getInitialProps` did exactly one thing:
 * exchange a `?jwt=` for a session cookie. The component stays in the app
 * because the copy around the form is tenant specific.
 */
export const loginRouteLoader = async ({
  context: { apolloClient },
  deps: { jwt },
}: {
  context: ApolloRouterContext;
  deps: { jwt?: string };
}) => {
  const { sessionToken, apollo } = await loadLogin({ data: { jwt } });

  mergeApolloCache(apolloClient, apollo);

  return { sessionToken };
};

/**
 * `pages/l/[code].tsx`: the personal login link from a letter or a mail. The
 * code is redeemed on the server, which sets the session cookie; the page
 * then takes the session over and moves on to `next`. A code that needs
 * another step (TOTP, challenge) is finished on the login page; a refused one
 * stays here with the reason.
 *
 * The session is part of the loader data and the address carries the code:
 * keep `/l/` `no-store` and `no-referrer`.
 */
export const loginCodeRoute = ({
  next = '/welcome?src=purl',
  loginPath = '/login',
}: LoginCodePageOptions = {}) => ({
  loader: async ({
    params: { code },
  }: {
    params: { code: string };
  }): Promise<LoginCodeLoaderData> => {
    const outcome = await loadLoginCode({ data: { code } });

    if (
      outcome.kind === 'totpRequired' ||
      outcome.kind === 'challengeRequired'
    ) {
      throw redirect({ href: loginCodeStepHref(loginPath, code, outcome.kind) });
    }

    if (outcome.kind === 'failed') {
      return { sessionToken: null, failure: outcome.failure };
    }

    return { sessionToken: outcome.sessionToken, next };
  },
  component: createLoginCodePage({ loginPath }),
});

/**
 * `pages/welcome.tsx`: the steps after a personal login link (confirm the
 * email address, set a password). Behind the auth guard and the reader's own:
 * keep `/welcome` `no-store`.
 */
export const welcomeRoute = (options: WelcomePageOptions = {}) => ({
  validateSearch: z.object({
    // Set by the confirm-email page once the address is in place.
    emailConfirmed: searchValueSchema.optional(),
    // Where the reader came from (`purl` for the personal login link).
    src: z.string().optional(),
  }),
  loader: async ({
    context: { apolloClient },
  }: {
    context: ApolloRouterContext;
  }) => {
    const { sessionToken, apollo } = await loadWelcome();

    mergeApolloCache(apolloClient, apollo);

    return { sessionToken };
  },
  component: createWelcomePage(options),
});

/** Search params a login page must accept. */
export const loginSearchSchema = jwtSearchSchema.extend({
  intended: z.string().optional(),
  mail: z.string().optional(),
  requirePassword: z.coerce.boolean().optional(),
  error: z.string().optional(),
  // Set by the personal login link (`loginCodeRoute`) when the code alone is
  // not enough: the form asks for the second step and redeems the code.
  // Taken as the router reads them, see `searchValueSchema`: the login form
  // looks for exactly `totpRequired=1` in the address.
  loginCode: searchValueSchema.optional(),
  totpRequired: searchValueSchema.optional(),
  challenge: searchValueSchema.optional(),
});
