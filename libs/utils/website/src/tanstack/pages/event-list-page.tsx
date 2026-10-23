import { ApolloClient } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import {
  EventListDocument,
  EventListQueryVariables,
  EventSort,
  SortOrder,
} from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { EventListContainer } from '@wepublish/event/website';
import { useMemo } from 'react';
import { z } from 'zod';

import { useQueryParams, useReplaceSearch } from '../router-hooks';

const Filter = styled('div')`
  display: grid;
  grid-template-columns: repeat(auto-fit, 250px);
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  margin-bottom: ${({ theme }) => theme.spacing(3)};
`;

export const DEFAULT_EVENT_LIST_TAKE = 25;

/**
 * Search params for the event index.
 *
 * **No `.default()` anywhere.** TanStack canonicalises the URL against
 * `validateSearch` output and 307-redirects whenever the parsed value differs
 * from the query string, so a default would rewrite `/event` to
 * `/event?upcomingOnly=true` on every cold load. Defaults are applied when
 * reading instead (`upcomingOnly ?? true`).
 *
 * The string/boolean union is required because search params arrive as strings
 * on a cold load but as real booleans after a client-side navigation.
 */
export const eventListSearchSchema = z.object({
  page: z.coerce.number().gte(1).optional(),
  upcomingOnly: z
    .union([z.boolean(), z.string()])
    .transform(value =>
      typeof value === 'boolean' ? value : JSON.parse(value.toLowerCase())
    )
    .pipe(z.boolean())
    .optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type EventListSearch = z.infer<typeof eventListSearchSchema>;

const listVariables = (
  { page, upcomingOnly, from, to }: EventListSearch,
  take: number
) =>
  ({
    take,
    skip: ((page ?? 1) - 1) * take,
    filter: {
      from: from?.toISOString(),
      to: to?.toISOString(),
      upcomingOnly: upcomingOnly ?? true,
    },
    sort: EventSort.StartsAt,
    order: SortOrder.Ascending,
  }) satisfies Partial<EventListQueryVariables>;

export const prefetchEventList = (
  client: ApolloClient,
  search: EventListSearch,
  { take = DEFAULT_EVENT_LIST_TAKE } = {}
) =>
  client.query({
    query: EventListDocument,
    variables: listVariables(search, take),
  });

/** `pages/event/index.tsx` */
export function EventListPage({
  take = DEFAULT_EVENT_LIST_TAKE,
  canonicalUrl = '/event',
  labels = { from: 'Von', to: 'Bis', upcomingOnly: 'Nur bevorstehende' },
}: {
  take?: number;
  canonicalUrl?: string;
  labels?: { from: string; to: string; upcomingOnly: string };
}) {
  const search = eventListSearchSchema.parse(useQueryParams());
  const { page, upcomingOnly, from, to } = search;
  const replaceSearch = useReplaceSearch();

  const {
    Head,
    elements: { Pagination },
  } = useWebsiteBuilder();

  const variables = useMemo(() => listVariables(search, take), [search, take]);

  const { data } = useQuery(EventListDocument, {
    fetchPolicy: 'cache-only',
    variables,
  });

  const pageCount = useMemo(() => {
    if (data?.events?.totalCount && data?.events?.totalCount > take) {
      return Math.ceil(data.events.totalCount / take);
    }

    return 1;
  }, [data?.events?.totalCount, take]);

  return (
    <>
      <Filter>
        <DateTimePicker
          label={labels.from}
          value={from ?? null}
          onChange={value =>
            replaceSearch(previous => ({
              ...previous,
              from: value?.toISOString(),
            }))
          }
        />

        <DateTimePicker
          label={labels.to}
          value={to ?? null}
          onChange={value =>
            replaceSearch(previous => ({
              ...previous,
              to: value?.toISOString(),
            }))
          }
        />

        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={upcomingOnly ?? true}
                onChange={(_, checked) =>
                  replaceSearch(previous => ({
                    ...previous,
                    upcomingOnly: checked,
                  }))
                }
              />
            }
            label={labels.upcomingOnly}
          />
        </FormGroup>
      </Filter>

      <EventListContainer variables={variables} />

      {pageCount > 1 && (
        <>
          <Head>
            <link
              rel="canonical"
              key="canonical"
              href={canonicalUrl}
            />
          </Head>

          <Pagination
            page={page ?? 1}
            count={pageCount}
            onChange={(_, value) =>
              replaceSearch(previous => ({ ...previous, page: value }))
            }
          />
        </>
      )}
    </>
  );
}
