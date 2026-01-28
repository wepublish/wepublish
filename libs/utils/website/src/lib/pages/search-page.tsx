import styled from '@emotion/styled';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircularProgress } from '@mui/material';
import { articleToTeaser } from '@wepublish/article/website';
import {
  addClientCacheToV1Props,
  Article,
  getV1ApiClient,
  NavigationListDocument,
  Page,
  PageTeaser,
  PeerProfileDocument,
  PhraseDocument,
  PhraseQuery,
  TeaserType,
  usePhraseQuery,
} from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { MdSearch } from 'react-icons/md';
import { z } from 'zod';
import { PageWrapper } from '@wepublish/page/website';

const SearchForm = styled('form')`
  display: grid;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  grid-template-columns: 1fr max-content;
`;

const SearchPageWrapper = styled(PageWrapper)``;

const pageToTeaser = (page: Page): PageTeaser => ({
  __typename: 'PageTeaser',
  type: TeaserType.Page,
  page,
  image: null,
  lead: null,
  preTitle: null,
  title: null,
});

const ITEMS_PER_PAGE = 12;

const searchPageSchema = z.object({
  page: z.coerce.number().gte(1).default(1),
  q: z.coerce.string().nullish(),
});

export const SearchPage = ({
  query,
  className,
}: InferGetServerSidePropsType<typeof SearchPageGetServerSideProps> & {
  className: string;
}) => {
  const {
    blocks: { TeaserGrid },
    elements: { IconButton, TextField, Pagination, Alert, H3, H4 },
  } = useWebsiteBuilder();

  const router = useRouter();
  const { page, q: phraseQuery } = searchPageSchema.parse(
    router.isReady ? router.query : query
  );

  const { control, handleSubmit, setFocus } = useForm<
    z.infer<typeof searchPageSchema>
  >({
    resolver: zodResolver(searchPageSchema),
  });

  useEffect(() => {
    setFocus('q');
  }, [setFocus]);

  const {
    data: phraseData,
    loading,
    error,
  } = usePhraseQuery({
    skip: !phraseQuery,
    variables: {
      query: phraseQuery!,
      take: ITEMS_PER_PAGE,
      skip: (page - 1) * ITEMS_PER_PAGE,
    },
  });

  const totalArticlesCount = phraseData?.phrase?.articles?.totalCount ?? 0;
  const totalPagesCount = phraseData?.phrase?.pages?.totalCount ?? 0;

  const pageCount = Math.ceil(
    Math.max(totalArticlesCount, totalPagesCount) / ITEMS_PER_PAGE
  );
  const teasers = useMemo(() => {
    if (!phraseData?.phrase) {
      return [];
    }

    const articleTeasers = phraseData.phrase.articles.nodes.map(node =>
      articleToTeaser(node as Article)
    );
    const pageTeasers = phraseData.phrase.pages.nodes.map(node =>
      pageToTeaser(node as Page)
    );

    return [...articleTeasers, ...pageTeasers];
  }, [phraseData?.phrase]);

  const noResultsFound = !teasers.length && !loading && !error && phraseQuery;

  return (
    <SearchPageWrapper
      fullWidth
      className={className}
    >
      <H3 component="h1">Suche</H3>

      <SearchForm
        onSubmit={handleSubmit(({ q }) =>
          router.push({
            query: { q },
          })
        )}
      >
        <Controller
          name={'q'}
          control={control}
          defaultValue={phraseQuery}
          render={({ field }) => (
            <TextField
              type="search"
              autoComplete="search"
              fullWidth
              placeholder="Suche nach Artikeln und Seiten"
              {...field}
            />
          )}
        />

        <IconButton
          type="submit"
          aria-label="Suchen"
        >
          <MdSearch size={28} />
        </IconButton>
      </SearchForm>

      {phraseQuery && <H4 component="h2">Suchergebnisse</H4>}

      {loading && (
        <CircularProgress
          sx={{ justifySelf: 'center' }}
          size={48}
        />
      )}
      {error && <Alert severity="error">{error.message}</Alert>}
      {noResultsFound && (
        <Alert severity="info">Keine Suchergebnisse gefunden</Alert>
      )}

      <TeaserGrid
        numColumns={3}
        teasers={teasers}
      />

      {!!teasers.length && (
        <Pagination
          page={page}
          count={pageCount}
          onChange={(_, value) =>
            router.push({
              query: { page: value, q: phraseQuery },
            })
          }
        />
      )}
    </SearchPageWrapper>
  );
};

export const SearchPageGetServerSideProps = (async ({ query }) => {
  const { publicRuntimeConfig } = getConfig();

  const client = getV1ApiClient(publicRuntimeConfig.env.API_URL, []);
  const { page, q: phraseQuery } = searchPageSchema.parse(query);

  await Promise.all([
    phraseQuery ?
      client.query<PhraseQuery>({
        query: PhraseDocument,
        variables: {
          query: phraseQuery,
          take: ITEMS_PER_PAGE,
          skip: (page - 1) * ITEMS_PER_PAGE,
        },
      })
    : undefined,
    client.query({
      query: NavigationListDocument,
    }),
    client.query({
      query: PeerProfileDocument,
    }),
  ]);

  const props = addClientCacheToV1Props(client, {
    query,
  });

  return {
    props,
  };
}) satisfies GetServerSideProps;
