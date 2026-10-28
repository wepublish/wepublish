import { ApolloClient } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircularProgress } from '@mui/material';
import { useNavigate } from '@tanstack/react-router';
import { articleToTeaser } from '@wepublish/article/website';
import { PageWrapper } from '@wepublish/page/website';
import {
  FullArticleTeaserFragment,
  FullPageTeaserFragment,
  PhraseDocument,
  PhraseQuery,
  TeaserType,
} from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdSearch } from 'react-icons/md';
import { z } from 'zod';

import { useQueryParams } from '../router-hooks';

const SearchForm = styled('form')`
  display: grid;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  grid-template-columns: 1fr max-content;
`;

const SearchPageWrapper = styled(PageWrapper)``;

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

const ITEMS_PER_PAGE = 12;

/**
 * Schema for `validateSearch`. **No `.default()` here on purpose**: TanStack
 * canonicalises the URL against `validateSearch` output and 307-redirects when
 * they differ, so a default would turn `/search?q=x` into
 * `/search?q=x&page=1`. Next did not do that, and the extra redirect costs a
 * round trip and splits SEO. Defaults belong in `searchPageSchema` below,
 * which is only used for *reading*.
 */
export const searchPageSearchSchema = z.object({
  page: z.coerce.number().gte(1).optional(),
  q: z.coerce.string().nullish(),
});

export const searchPageSchema = searchPageSearchSchema.extend({
  page: z.coerce.number().gte(1).default(1),
});

/**
 * TanStack port of `SearchPageGetServerSideProps`. Search was `getServerSideProps`
 * in Next, i.e. never cached — the route must keep it that way by **not**
 * calling `revalidate()`.
 */
export const prefetchSearch = async (client: ApolloClient, search: unknown) => {
  const { page, q: phraseQuery } = searchPageSchema.parse(search ?? {});

  if (!phraseQuery) {
    return;
  }

  await client.query<PhraseQuery>({
    query: PhraseDocument,
    variables: {
      query: phraseQuery,
      take: ITEMS_PER_PAGE,
      skip: (page - 1) * ITEMS_PER_PAGE,
    },
  });
};

/** TanStack port of `SearchPage`. */
export const SearchPage = ({ className }: { className?: string }) => {
  const {
    blocks: { TeaserGrid },
    elements: { IconButton, TextField, Pagination, Alert, H3, H4 },
  } = useWebsiteBuilder();
  const { t } = useTranslation();

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
      query: phraseQuery ?? '', // skipped if undefined anyways
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
      articleToTeaser(node as FullArticleTeaserFragment['article'])
    );
    const pageTeasers = phraseData.phrase.pages.nodes.map(node =>
      pageToTeaser(node as FullPageTeaserFragment['page'])
    );

    return [...articleTeasers, ...pageTeasers];
  }, [phraseData?.phrase]);

  const noResultsFound = !teasers.length && !loading && !error && phraseQuery;

  return (
    <SearchPageWrapper
      fullWidth
      className={className}
    >
      <H3 component="h1">{t('search.search')}</H3>

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
              placeholder={t('search.searchPlaceholder')}
              {...field}
            />
          )}
        />

        <IconButton
          type="submit"
          aria-label={t('search.search')}
        >
          <MdSearch size={28} />
        </IconButton>
      </SearchForm>

      {phraseQuery && <H4 component="h2">{t('search.searchResults')}</H4>}

      {loading && (
        <CircularProgress
          sx={{ justifySelf: 'center' }}
          size={48}
        />
      )}
      {error && <Alert severity="error">{error.message}</Alert>}
      {noResultsFound && (
        <Alert severity="info">{t('search.noResultsFound')}</Alert>
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
            navigate({ to: '/search', search: { page: value, q: phraseQuery } })
          }
        />
      )}
    </SearchPageWrapper>
  );
};
