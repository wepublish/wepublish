import styled from '@emotion/styled';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { EventListContainer } from '@wepublish/event/website';
import { getApiUrl } from '@wepublish/utils/website';
import { EventSort, SortOrder } from '@wepublish/website/api';
import {
  addClientCacheToProps,
  EventListDocument,
  EventListQueryVariables,
  getApiClient,
  NavigationListDocument,
  PeerProfileDocument,
  useEventListQuery,
} from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { GetStaticProps } from 'next';
import getConfig from 'next/config';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MdClose } from 'react-icons/md';
import { z } from 'zod';

const Filter = styled('div')`
  margin-bottom: ${({ theme }) => theme.spacing(3)};
`;

const FilterGroup = styled(ToggleButtonGroup)`
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(1)};

  && .MuiToggleButtonGroup-grouped {
    margin: 0;
    border-radius: 999px;
    border: 1px solid ${({ theme }) => theme.palette.divider};
  }
`;

const EmptyMessage = styled('p')`
  text-align: left;
  margin: ${({ theme }) => theme.spacing(4, 0, 4, 2)};
  color: ${({ theme }) => theme.palette.text.secondary};
`;

const DATE_RANGES = ['today', 'tomorrow', 'next7', 'next30'] as const;
type DateRange = (typeof DATE_RANGES)[number];
type ActiveButton = DateRange | 'upcoming' | 'all' | null;

function useDateRangeLabels(): Record<DateRange, string> {
  const { t } = useTranslation();
  return useMemo(
    () => ({
      today: t('event.filter.today'),
      tomorrow: t('event.filter.tomorrow'),
      next7: t('event.filter.next7'),
      next30: t('event.filter.next30'),
    }),
    [t]
  );
}

function useEmptyMessages(): Record<
  Exclude<ActiveButton, null> | 'custom',
  string
> {
  const { t } = useTranslation();
  return useMemo(
    () => ({
      today: t('event.empty.today'),
      tomorrow: t('event.empty.tomorrow'),
      next7: t('event.empty.next7'),
      next30: t('event.empty.next30'),
      upcoming: t('event.empty.upcoming'),
      all: t('event.empty.all'),
      custom: t('event.empty.custom'),
    }),
    [t]
  );
}

const DAY_OFFSETS: Record<DateRange, { from: number; to: number }> = {
  today: { from: 0, to: 0 },
  tomorrow: { from: 1, to: 1 },
  next7: { from: 0, to: 6 },
  next30: { from: 0, to: 29 },
};

const pageSchema = z.object({
  page: z.coerce.number().gte(1).optional(),
  upcomingOnly: z
    .string()
    .toLowerCase()
    .transform(string => JSON.parse(string))
    .pipe(z.boolean())
    .optional()
    .default('true'),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

const take = 25;

function getDateBounds(range: DateRange): { from: string; to: string } {
  const { from, to } = DAY_OFFSETS[range];
  const fromDate = new Date();
  fromDate.setHours(0, 0, 0, 0);
  fromDate.setDate(fromDate.getDate() + from);
  const toDate = new Date();
  toDate.setHours(23, 59, 59, 999);
  toDate.setDate(toDate.getDate() + to);
  return { from: fromDate.toISOString(), to: toDate.toISOString() };
}

function detectActive(params: {
  from?: Date;
  to?: Date;
  upcomingOnly?: boolean;
}): ActiveButton {
  if (params.from && params.to) {
    const fromIso = params.from.toISOString();
    const toIso = params.to.toISOString();
    for (const range of DATE_RANGES) {
      const bounds = getDateBounds(range);
      if (bounds.from === fromIso && bounds.to === toIso) {
        return range;
      }
    }
    return null;
  }
  if (params.upcomingOnly === false) {
    return 'all';
  }
  return 'upcoming';
}

function getFilter(params: {
  from?: Date;
  to?: Date;
  upcomingOnly?: boolean;
}): { from?: string; to?: string; upcomingOnly?: boolean } {
  if (params.from && params.to) {
    return { from: params.from.toISOString(), to: params.to.toISOString() };
  }
  if (params.upcomingOnly === false) {
    return {};
  }
  return { upcomingOnly: true };
}

export default function EventList() {
  const { query, replace } = useRouter();
  const { t } = useTranslation();
  const dateRangeLabels = useDateRangeLabels();
  const emptyMessages = useEmptyMessages();
  const { page, from, to, upcomingOnly } = pageSchema.parse(query);

  const active = useMemo(
    () => detectActive({ from, to, upcomingOnly }),
    [from, to, upcomingOnly]
  );

  const {
    elements: { Pagination },
  } = useWebsiteBuilder();

  const variables = useMemo(
    () =>
      ({
        take,
        skip: ((page ?? 1) - 1) * take,
        filter: getFilter({ from, to, upcomingOnly }),
        sort: EventSort.StartsAt,
        order: SortOrder.Ascending,
      }) satisfies Partial<EventListQueryVariables>,
    [page, from, to, upcomingOnly]
  );

  const { data } = useEventListQuery({
    fetchPolicy: 'cache-only',
    variables,
  });

  const pageCount = useMemo(() => {
    if (data?.events?.totalCount && data?.events?.totalCount > take) {
      return Math.ceil(data.events.totalCount / take);
    }

    return 1;
  }, [data?.events?.totalCount]);

  const canonicalUrl = '/event';

  return (
    <>
      <Filter>
        <FilterGroup
          value={active}
          exclusive
          onChange={(_, value: ActiveButton) => {
            if (value === null) {
              return;
            }
            const {
              page: _page,
              from: _from,
              to: _to,
              upcomingOnly: _upcomingOnly,
              ...rest
            } = query;
            void _page;
            void _from;
            void _to;
            void _upcomingOnly;
            const nextQuery: Record<string, string | string[] | undefined> = {
              ...rest,
            };
            if (value === 'all') {
              nextQuery.upcomingOnly = 'false';
            } else if (value !== 'upcoming') {
              const bounds = getDateBounds(value);
              nextQuery.from = bounds.from;
              nextQuery.to = bounds.to;
            }
            replace(
              {
                query: nextQuery,
              },
              undefined,
              { shallow: true, scroll: true }
            );
          }}
        >
          {DATE_RANGES.map(r => (
            <ToggleButton
              key={r}
              value={r}
            >
              {dateRangeLabels[r]}
            </ToggleButton>
          ))}
          <ToggleButton value="upcoming">
            {t('event.filter.upcoming')}
          </ToggleButton>
          <ToggleButton
            value="all"
            aria-label={t('event.filter.reset')}
            disabled={active === 'all'}
          >
            <MdClose />
          </ToggleButton>
        </FilterGroup>
      </Filter>

      {data?.events && data.events.totalCount === 0 ?
        <EmptyMessage>{emptyMessages[active ?? 'custom']}</EmptyMessage>
      : <EventListContainer variables={variables} />}

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
              replace(
                {
                  query: { ...query, page: value },
                },
                undefined,
                { shallow: true, scroll: true }
              )
            }
          />
        </>
      )}
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const { publicRuntimeConfig } = getConfig();

  if (!publicRuntimeConfig.env.API_URL) {
    return { props: {}, revalidate: 1 };
  }

  const client = getApiClient(getApiUrl(), []);
  await Promise.all([
    client.query({
      query: EventListDocument,
      variables: {
        take,
        skip: 0,
        filter: { upcomingOnly: true },
        sort: EventSort.StartsAt,
        order: SortOrder.Ascending,
      },
    }),
    client.query({
      query: NavigationListDocument,
    }),
    client.query({
      query: PeerProfileDocument,
    }),
  ]);

  const props = addClientCacheToProps(client, {});

  return {
    props,
    revalidate: 60, // every 60 seconds
  };
};
