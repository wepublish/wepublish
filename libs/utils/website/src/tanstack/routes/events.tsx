import { EventContainer } from '@wepublish/event/website';
import { z } from 'zod';

import { mergeApolloCache } from '../apollo';
import { FourOhFourPage } from '../pages/404-page';
import {
  DEFAULT_EVENT_LIST_TAKE,
  EventListPage,
  eventListSearchSchema,
  loadEvent,
  loadEventList,
} from '../pages/event-list-page';
import { ApolloRouterContext, bailOutNotFound, useRouteParams } from './shared';

/** `pages/event/index.tsx` */
export const eventListRoute = ({
  take = DEFAULT_EVENT_LIST_TAKE,
  canonicalUrl = '/event',
}: { take?: number; canonicalUrl?: string } = {}) => ({
  validateSearch: eventListSearchSchema,
  loaderDeps: ({ search }: { search: z.infer<typeof eventListSearchSchema> }) =>
    search,
  loader: async ({
    context: { apolloClient },
    deps,
  }: {
    context: ApolloRouterContext;
    deps: z.infer<typeof eventListSearchSchema>;
  }) => {
    const { apollo } = await loadEventList({ data: { search: deps, take } });

    mergeApolloCache(apolloClient, apollo);
  },
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
    const { apollo, notFound } = await loadEvent({ data: { id } });

    mergeApolloCache(context.apolloClient, apollo);

    if (notFound) {
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
