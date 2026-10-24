import { z } from 'zod';

import { mergeApolloCache } from '../apollo';
import {
  DeactivatedSubscriptionsPage,
  loadDeactivatedSubscriptions,
} from '../pages/deactivated-subscriptions-page';
import { FourOhFourPage } from '../pages/404-page';
import { loadLogin } from '../pages/login-page';
import { loadProfile, ProfilePage } from '../pages/profile-page';
import { loadSubscribe } from '../pages/subscribe-page';
import { loadSubscription, SubscriptionPage } from '../pages/subscription-page';
import {
  ApolloRouterContext,
  bailOutNotFound,
  jwtSearchSchema,
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
    confirmEmailChange: z.string().optional(),
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

/** Search params a login page must accept. */
export const loginSearchSchema = jwtSearchSchema.extend({
  intended: z.string().optional(),
  mail: z.string().optional(),
  requirePassword: z.coerce.boolean().optional(),
  error: z.string().optional(),
});
