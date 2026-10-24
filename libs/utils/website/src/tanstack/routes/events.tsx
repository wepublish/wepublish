import { EventContainer } from '@wepublish/event/website';
import { EventDocument } from '@wepublish/website/api';
import { z } from 'zod';

import { FourOhFourPage } from '../pages/404-page';
import {
  DEFAULT_EVENT_LIST_TAKE,
  EventListPage,
  eventListSearchSchema,
  prefetchEventList,
} from '../pages/event-list-page';
import { isNotFoundError } from '../prefetch';
import { ApolloRouterContext, bailOutNotFound, useRouteParams } from './shared';

/** `pages/event/index.tsx` */
export const eventListRoute = ({
  take = DEFAULT_EVENT_LIST_TAKE,
  canonicalUrl = '/event',
}: { take?: number; canonicalUrl?: string } = {}) => ({
  validateSearch: eventListSearchSchema,
  loaderDeps: ({ search }: { search: z.infer<typeof eventListSearchSchema> }) =>
    search,
  loader: ({
    context: { apolloClient },
    deps,
  }: {
    context: ApolloRouterContext;
    deps: z.infer<typeof eventListSearchSchema>;
  }) => prefetchEventList(apolloClient, deps, { take }),
  component: () => (
    <EventListPage
      take={take}
      canonicalUrl={canonicalUrl}
    />
  ),
});

/** `pages/event/[id].tsx` */
export const eventRoute = () => ({
  loader: async ({
    context,
    params: { id },
  }: {
    context: ApolloRouterContext;
    params: { id: string };
  }) => {
    const event = await context.apolloClient.query({
      query: EventDocument,
      variables: { id },
    });

    if (isNotFoundError(event.error)) {
      await bailOutNotFound(context);
    }
  },
  component: EventById,
  notFoundComponent: FourOhFourPage,
});

function EventById() {
  const { id } = useRouteParams<{ id: string }>();

  return <EventContainer id={id} />;
}
