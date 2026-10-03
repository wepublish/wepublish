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
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MdClose } from 'react-icons/md';

import {
  ActiveEventFilter,
  DATE_RANGES,
  DateRange,
  detectActiveEventFilter,
  eventListPageSchema,
  getDateBounds,
  getEventListFilter,
} from '../../src/components/event-list-filter';

const Filter = styled('div')`
  margin-top: ${({ theme }) => theme.spacing(6)};
`;

const TsriEventList = styled(EventListContainer)`
  justify-items: stretch;
  margin-top: ${({ theme }) => theme.spacing(-2)};
  background: linear-gradient(
    to bottom,
    ${({ theme }) => theme.palette.primary.dark} 0px,
    color-mix(
        in srgb,
        ${({ theme }) => theme.palette.common.white} 60%,
        ${({ theme }) => theme.palette.primary.dark}
      )
      800px
  );
  border-radius: 1rem;
  padding: 2cqw;

  ${({ theme }) => theme.breakpoints.up('md')} {
    border-radius: 1cqw;
    padding: 1.5cqw;
  }
`;

const FilterGroup = styled(ToggleButtonGroup)`
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(1)};

  && .MuiToggleButtonGroup-grouped {
    margin: 0;
    padding: ${({ theme }) => theme.spacing(0.75, 2)};
    border-radius: 999px;
    border: 1px solid ${({ theme }) => theme.palette.common.black};
    color: ${({ theme }) => theme.palette.common.black};
    font-weight: 700;
    text-transform: none;

    &:hover {
      background-color: ${({ theme }) => theme.palette.primary.light};
      border-color: ${({ theme }) => theme.palette.primary.light};
    }

    &.Mui-selected {
      background-color: ${({ theme }) => theme.palette.common.black};
      color: ${({ theme }) => theme.palette.common.white};

      &:hover {
        background-color: ${({ theme }) => theme.palette.primary.light};
        border-color: ${({ theme }) => theme.palette.primary.light};
        color: ${({ theme }) => theme.palette.common.black};
      }
    }

    &.Mui-disabled {
      border: 1px solid ${({ theme }) => theme.palette.common.black};
      background-color: ${({ theme }) => theme.palette.common.black};
      color: ${({ theme }) => theme.palette.common.white};
      font-weight: 800;

      & svg {
        font-size: 1.25em;
      }
    }
  }
`;

const EmptyMessage = styled('p')`
  text-align: left;
  margin: ${({ theme }) => theme.spacing(4, 0, 4, 2)};
  color: ${({ theme }) => theme.palette.text.secondary};
`;

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
  Exclude<ActiveEventFilter, null> | 'custom',
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

const take = 25;

export default function EventList() {
  const { query, replace } = useRouter();
  const { t } = useTranslation();
  const dateRangeLabels = useDateRangeLabels();
  const emptyMessages = useEmptyMessages();
  const { page, from, to, upcomingOnly } = eventListPageSchema.parse(query);

  const active = useMemo(
    () => detectActiveEventFilter({ from, to, upcomingOnly }),
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
        filter: getEventListFilter({ from, to, upcomingOnly }),
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
          onChange={(_, value: ActiveEventFilter) => {
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
          {DATE_RANGES.map(range => (
            <ToggleButton
              key={range}
              value={range}
            >
              {dateRangeLabels[range]}
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
      : <TsriEventList variables={variables} />}

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
  if (!getApiUrl()) {
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
