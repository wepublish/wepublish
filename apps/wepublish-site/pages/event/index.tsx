import styled from '@emotion/styled';
import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { EventListContainer } from '@wepublish/event/website';
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
import { z } from 'zod';

const Filter = styled('div')`
  display: grid;
  grid-template-columns: repeat(auto-fit, 250px);
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  margin-bottom: ${({ theme }) => theme.spacing(3)};
`;

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

export default function EventList() {
  const { query, replace } = useRouter();
  const { page, upcomingOnly, from, to } = pageSchema.parse(query);

  const {
    elements: { Pagination },
  } = useWebsiteBuilder();

  const variables = useMemo(
    () =>
      ({
        take,
        skip: ((page ?? 1) - 1) * take,
        filter: {
          from: from?.toISOString(),
          to: to?.toISOString(),
          upcomingOnly,
        },
        sort: EventSort.StartsAt,
        order: SortOrder.Ascending,
      }) satisfies Partial<EventListQueryVariables>,
    [from, page, to, upcomingOnly]
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
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Filter>
        <DateTimePicker
          label="Von"
          value={from ?? null}
          onChange={value => {
            replace(
              {
                query: { ...query, from: value?.toISOString() },
              },
              undefined,
              { shallow: true, scroll: true }
            );
          }}
        />

        <DateTimePicker
          label="Bis"
          value={to ?? null}
          onChange={value => {
            replace(
              {
                query: { ...query, to: value?.toISOString() },
              },
              undefined,
              { shallow: true, scroll: true }
            );
          }}
        />

        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={upcomingOnly ?? false}
                onChange={(_, checked) => {
                  replace(
                    {
                      query: { ...query, upcomingOnly: checked },
                    },
                    undefined,
                    { shallow: true, scroll: true }
                  );
                }}
              />
            }
            label="Nur bevorstehende"
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
    </LocalizationProvider>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const { publicRuntimeConfig } = getConfig();

  if (!publicRuntimeConfig.env.API_URL) {
    return { props: {}, revalidate: 1 };
  }

  const client = getV1ApiClient(publicRuntimeConfig.env.API_URL, []);
  await Promise.all([
    client.query({
      query: EventListDocument,
      variables: {
        take,
        skip: 0,
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
