import styled from '@emotion/styled';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { EventListContainer } from '@wepublish/event/website';
import { getApiUrl } from '@wepublish/utils/website';
import { EventSort, SortOrder } from '@wepublish/website/api';
import {
  addClientCacheToV1Props,
  EventListDocument,
  EventListQueryVariables,
  getV1ApiClient,
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
  text-align: center;
  margin: ${({ theme }) => theme.spacing(4)} 0;
  color: ${({ theme }) => theme.palette.text.secondary};
`;

const VISIBLE_RANGES = [
  'today',
  'tomorrow',
  'next7',
  'next30',
  'upcoming',
] as const;
const RANGES = [...VISIBLE_RANGES, 'all'] as const;
type Range = (typeof RANGES)[number];

const RANGE_LABELS: Record<(typeof VISIBLE_RANGES)[number], string> = {
  today: 'Heute',
  tomorrow: 'Morgen',
  next7: 'Nächste 7 Tage',
  next30: 'Nächste 30 Tage',
  upcoming: 'Alle bevorstehenden',
};

const EMPTY_MESSAGES: Record<Range, string> = {
  today: 'Heute gibt es keine Veranstaltungen zum Anzeigen.',
  tomorrow: 'Morgen gibt es keine Veranstaltungen zum Anzeigen.',
  next7: 'In den nächsten 7 Tagen gibt es keine Veranstaltungen zum Anzeigen.',
  next30:
    'In den nächsten 30 Tagen gibt es keine Veranstaltungen zum Anzeigen.',
  upcoming: 'Es gibt keine bevorstehenden Veranstaltungen zum Anzeigen.',
  all: 'Es gibt keine Veranstaltungen zum Anzeigen.',
};

const pageSchema = z.object({
  page: z.preprocess(
    v => (v === '' || v == null ? undefined : v),
    z.coerce.number().gte(1).optional()
  ),
  range: z.enum(RANGES).optional().default('upcoming'),
});

const take = 25;

function getFilter(range: Range): {
  from?: string;
  to?: string;
  upcomingOnly?: boolean;
} {
  if (range === 'all') {
    return {};
  }

  if (range === 'upcoming') {
    return { upcomingOnly: true };
  }

  const dayOffsets: Record<
    Exclude<Range, 'upcoming' | 'all'>,
    { from: number; to: number }
  > = {
    today: { from: 0, to: 0 },
    tomorrow: { from: 1, to: 1 },
    next7: { from: 0, to: 6 },
    next30: { from: 0, to: 29 },
  };

  const { from, to } = dayOffsets[range];

  const fromDate = new Date();
  fromDate.setHours(0, 0, 0, 0);
  fromDate.setDate(fromDate.getDate() + from);

  const toDate = new Date();
  toDate.setHours(23, 59, 59, 999);
  toDate.setDate(toDate.getDate() + to);

  return { from: fromDate.toISOString(), to: toDate.toISOString() };
}

export default function EventList() {
  const { query, replace } = useRouter();
  const { page, range } = pageSchema.parse(query);

  const {
    elements: { Pagination },
  } = useWebsiteBuilder();

  const variables = useMemo(
    () =>
      ({
        take,
        skip: ((page ?? 1) - 1) * take,
        filter: getFilter(range),
        sort: EventSort.StartsAt,
        order: SortOrder.Ascending,
      }) satisfies Partial<EventListQueryVariables>,
    [page, range]
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
          value={range}
          exclusive
          onChange={(_, value: Range | null) => {
            if (value === null) {
              return;
            }
            const { page: _page, ...rest } = query;
            void _page;
            replace(
              {
                query: { ...rest, range: value },
              },
              undefined,
              { shallow: true, scroll: true }
            );
          }}
        >
          {VISIBLE_RANGES.map(r => (
            <ToggleButton
              key={r}
              value={r}
            >
              {RANGE_LABELS[r]}
            </ToggleButton>
          ))}
          <ToggleButton
            value="all"
            aria-label="Filter zurücksetzen"
            disabled={range === 'all'}
          >
            <MdClose />
          </ToggleButton>
        </FilterGroup>
      </Filter>

      {data?.events && data.events.totalCount === 0 ?
        <EmptyMessage>{EMPTY_MESSAGES[range]}</EmptyMessage>
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

  const client = getV1ApiClient(getApiUrl(), []);
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

  const props = addClientCacheToV1Props(client, {});

  return {
    props,
    revalidate: 60, // every 60 seconds
  };
};
