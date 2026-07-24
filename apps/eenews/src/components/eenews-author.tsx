import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import {
  FullTeaserFragment,
  useArticleListQuery,
} from '@wepublish/website/api';
import {
  BuilderAuthorProps,
  useWebsiteBuilder,
  WebsiteBuilderProvider,
} from '@wepublish/website/builder';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

import { EenewsPagination } from './eenews-pagination';
import { EenewsTeaser } from './teasers/eenews-teaser';
import { enrichTeasersWithAds } from './teasers/eenews-teaser-ads';

const AUTHOR_ARTICLES_PER_PAGE = 12;

const Hero = styled('section')`
  padding: 36px 56px 24px;
  background: ${({ theme }) => theme.palette.background.default};
  ${({ theme }) => theme.breakpoints.down('sm')} {
    padding: 24px 20px 18px;
  }
`;

const HeroInner = styled('div')`
  max-width: var(--max-width);
  margin: 0 auto;
`;

const Eyebrow = styled(Typography)`
  display: block;
  color: ${({ theme }) => theme.palette.primary.main};
  margin-bottom: 4px;
`;

const Name = styled(Typography)`
  display: block;
  margin: 0;
  color: ${({ theme }) => theme.palette.primary.main};
`;

const ArticlesSection = styled('section')`
  padding: 56px;
  background: ${({ theme }) => theme.palette.background.default};
  ${({ theme }) => theme.breakpoints.down('md')} {
    padding: 36px 20px;
  }
`;

const ArticlesHead = styled('div')`
  max-width: var(--max-width);
  margin: 0 auto 28px;
`;

const ArticlesTitle = styled(Typography)`
  display: block;
  margin: 0;
  color: ${({ theme }) => theme.palette.primary.main};
`;

const Grid = styled('div')`
  max-width: var(--max-width);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 36px 32px;
  ${({ theme }) => theme.breakpoints.down('md')} {
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }
  ${({ theme }) => theme.breakpoints.down('sm')} {
    grid-template-columns: 1fr;
    gap: 50px;
  }
`;

export const EenewsAuthor = ({ data, className }: BuilderAuthorProps) => {
  const {
    blocks: { Teaser: BuilderTeaser },
  } = useWebsiteBuilder();

  const router = useRouter();
  const author = data?.author;

  const pageRaw = Number(router.query.page);
  const currentPage = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;

  const variables = useMemo(
    () => ({
      filter: { authors: author?.id ? [author.id] : undefined },
      take: AUTHOR_ARTICLES_PER_PAGE,
      skip: (currentPage - 1) * AUTHOR_ARTICLES_PER_PAGE,
    }),
    [author?.id, currentPage]
  );

  const { data: articlesData } = useArticleListQuery({
    skip: !author?.id,
    variables,
  });

  if (!author) {
    return null;
  }

  const articles = articlesData?.articles?.nodes ?? [];
  const teasers = enrichTeasersWithAds(
    articles.map(
      article =>
        ({
          __typename: 'ArticleTeaser',
          style: 'DEFAULT',
          image: null,
          preTitle: null,
          title: null,
          lead: null,
          article,
        }) as unknown as FullTeaserFragment
    )
  );
  const totalCount = articlesData?.articles?.totalCount ?? 0;
  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / AUTHOR_ARTICLES_PER_PAGE)
  );

  const goToPage = (next: number) => {
    router.replace({ query: { ...router.query, page: next } }, undefined, {
      shallow: true,
      scroll: true,
    });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className={className}>
      <Hero>
        <HeroInner>
          <Eyebrow variant="pageEyebrow">Autor:in</Eyebrow>
          <Name variant="pageH1Standard">{author.name}</Name>
        </HeroInner>
      </Hero>

      {articles.length > 0 && (
        <ArticlesSection>
          <ArticlesHead>
            <ArticlesTitle variant="sectionTitle">
              Alle Artikel von {author.name}
            </ArticlesTitle>
          </ArticlesHead>
          <Grid>
            <WebsiteBuilderProvider blocks={{ Teaser: EenewsTeaser }}>
              {teasers.map((teaser, idx) => (
                <BuilderTeaser
                  key={idx}
                  teaser={teaser}
                  index={idx}
                  blockStyle="DossierGrid"
                  numColumns={3}
                  alignment={{
                    i: String(idx),
                    x: 0,
                    y: 0,
                    w: 4,
                    h: 1,
                  }}
                />
              ))}
            </WebsiteBuilderProvider>
          </Grid>

          {totalPages > 1 && (
            <EenewsPagination
              page={currentPage}
              totalPages={totalPages}
              onChange={goToPage}
            />
          )}
        </ArticlesSection>
      )}
    </div>
  );
};
