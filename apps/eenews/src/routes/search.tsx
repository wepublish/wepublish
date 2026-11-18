import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { articleToTeaser } from '@wepublish/article/website';
import { EenewsTeaserGrid } from '@wepublish/tenant/eenews';
import {
  searchPageSchema,
  searchRoute,
  useQueryParams,
} from '@wepublish/utils/website/tanstack';
import {
  FullArticleTeaserFragment,
  FullPageTeaserFragment,
  PhraseDocument,
  TeaserType,
} from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { MdSearch } from 'react-icons/md';
import { z } from 'zod';

import { defaultHead } from '../integration/default-head';
import { withEenewsPageShell } from '../integration/with-page-shell';

/**
 * `pages/search.tsx` — ee-news's own search page (German copy, ee-news teaser
 * grid with skeletons, page shell). Loader and search validation are shared;
 * the shared `SearchPage` component is not.
 */
export const Route = createFileRoute('/search')({
  ...searchRoute(),
  component: withEenewsPageShell(EenewsSearch),
  head: defaultHead,
});

const ITEMS_PER_PAGE = 12;

const SearchForm = styled('form')`
  display: grid;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  grid-template-columns: 1fr max-content;
`;

const pageToTeaser = (
  page: FullPageTeaserFragment['page']
): FullPageTeaserFragment => ({
  __typename: 'PageTeaser',
  type: TeaserType.Page,
  page,
  image: null,
  lead: null,
  preTitle: null,
  title: null,
});

function EenewsSearch() {
  const {
    elements: { IconButton, TextField, Pagination, Alert, H3, H4 },
  } = useWebsiteBuilder();

  const navigate = useNavigate();
  const { page, q: phraseQuery } = searchPageSchema.parse(useQueryParams());

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
  } = useQuery(PhraseDocument, {
    skip: !phraseQuery,
    variables: {
      query: phraseQuery ?? '',
      take: ITEMS_PER_PAGE,
      skip: (page - 1) * ITEMS_PER_PAGE,
    },
  });

  const totalArticlesCount = phraseData?.phrase?.articles?.totalCount ?? 0;
  const totalPagesCount = phraseData?.phrase?.pages?.totalCount ?? 0;
  const pageCount = Math.ceil(
    Math.max(totalArticlesCount, totalPagesCount) / ITEMS_PER_PAGE
  );

  const phrase = phraseData?.phrase;
  const teasers =
    phrase ?
      [
        ...phrase.articles.nodes.map(node =>
          articleToTeaser(node as FullArticleTeaserFragment['article'])
        ),
        ...phrase.pages.nodes.map(node =>
          pageToTeaser(node as FullPageTeaserFragment['page'])
        ),
      ]
    : [];

  const noResultsFound = !teasers.length && !loading && !error && phraseQuery;

  return (
    <>
      <H3 component="h1">Suche</H3>

      <SearchForm
        onSubmit={handleSubmit(({ q }) =>
          navigate({ to: '/search', search: { q } })
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

      {error && <Alert severity="error">{error.message}</Alert>}
      {noResultsFound && (
        <Alert severity="info">Keine Suchergebnisse gefunden</Alert>
      )}

      <EenewsTeaserGrid
        teasers={teasers}
        numColumns={3}
        loading={!!phraseQuery && loading}
        skeletonCount={ITEMS_PER_PAGE}
      />

      {!!teasers.length && (
        <Pagination
          page={page}
          count={pageCount}
          onChange={(_, value) =>
            navigate({ to: '/search', search: { page: value, q: phraseQuery } })
          }
        />
      )}
    </>
  );
}
