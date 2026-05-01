import styled from '@emotion/styled';
import { Container, Typography } from '@mui/material';
import {
  ArticleListQueryVariables,
  ArticleSort,
  SortOrder,
  useArticleListQuery,
} from '@wepublish/website/api';
import Link from 'next/link';
import { useState } from 'react';

import { eenewsColors } from '../theme';

// Mirrors apps/eenews/src/components/eenews-tag-page.tsx — same hero/feature/
// feed toolbar/grid styled-components, minus the tag chip + related-authors/
// tags sections that don't apply to the global archive view.

const TopicHero = styled('section')`
  position: relative;
  padding: 56px 0 48px;
  border-bottom: 1px solid ${eenewsColors.rule};
  background: ${eenewsColors.paperWarm};
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(
        circle at 90% 20%,
        rgba(217, 234, 123, 0.45) 0%,
        transparent 55%
      ),
      radial-gradient(
        circle at 5% 110%,
        rgba(217, 234, 123, 0.3) 0%,
        transparent 50%
      );
    pointer-events: none;
  }
`;

const HeroInner = styled(Container)`
  position: relative;
  z-index: 1;
`;

const Crumbs = styled('div')`
  font-family: inherit;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${eenewsColors.inkSoft};
  margin-bottom: 24px;

  a {
    color: ${eenewsColors.inkSoft};
    text-decoration: none;
    &:hover {
      color: ${eenewsColors.ink};
    }
  }
`;

const TopicHead = styled('div')`
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 64px;
  align-items: end;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
    gap: 32px;
  }
`;

const HeroRight = styled('div')`
  padding-bottom: 18px;
  @media (max-width: 1100px) {
    padding-bottom: 0;
  }
`;

const StatsRow = styled('div')`
  display: flex;
  gap: 36px;
  padding-top: 24px;
  border-top: 1px solid ${eenewsColors.rule};
  flex-wrap: wrap;
  @media (max-width: 720px) {
    gap: 24px;
  }
`;

const StatItem = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const TopicFeature = styled('article')`
  margin: 56px 0 40px;
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 48px;
  align-items: stretch;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 0.92;
  }

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

const FeatureImg = styled('div')`
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: ${eenewsColors.paperWarm};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const FeatureBody = styled('div')`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const Kicker = styled('div')`
  font-family: inherit;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${eenewsColors.inkSoft};
  margin-bottom: 14px;
`;

const FeatureLead = styled('p')`
  margin: 0 0 24px;
  max-width: 48ch;
  color: ${eenewsColors.ink};
  font-weight: 300;
`;

const Meta = styled('div')`
  font-family: inherit;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${eenewsColors.inkSoft};
`;

const FeedToolbar = styled('div')`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 0;
  margin-bottom: 32px;
  border-top: 1px solid ${eenewsColors.rule};
  border-bottom: 1px solid ${eenewsColors.rule};
  gap: 16px;

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

const ToolbarLabel = styled('span')`
  font-family: inherit;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${eenewsColors.inkSoft};
`;

const ToolbarRight = styled('div')`
  display: flex;
  align-items: center;
  gap: 24px;
`;

const SortSelect = styled('select')`
  appearance: none;
  background: transparent;
  border: 0;
  font-family: inherit;
  font-size: 14px;
  color: ${eenewsColors.ink};
  padding: 4px 22px 4px 0;
  cursor: pointer;
  background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'><path d='M1 1 L6 6 L11 1' stroke='%230e2a3b' stroke-width='1.5' fill='none' stroke-linecap='round'/></svg>")
    right center no-repeat;
  background-size: 10px;
`;

const ViewToggle = styled('div')`
  display: inline-flex;
  gap: 0;
  border: 1px solid ${eenewsColors.ruleStrong};
  border-radius: 999px;
  padding: 2px;
`;

const ViewButton = styled('button', {
  shouldForwardProp: prop => prop !== 'active',
})<{ active: boolean }>`
  background: ${({ active }) => (active ? eenewsColors.ink : 'transparent')};
  color: ${({ active }) =>
    active ? eenewsColors.paper : eenewsColors.inkSoft};
  border: 0;
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
  padding: 6px 14px;
  border-radius: 999px;
  transition:
    background 0.15s ease,
    color 0.15s ease;
`;

const Feed = styled('div', {
  shouldForwardProp: prop => prop !== 'list',
})<{ list?: boolean }>`
  display: grid;
  ${({ list }) =>
    list ?
      `grid-template-columns: 1fr; gap: 0;`
    : `grid-template-columns: repeat(3, 1fr); gap: 40px 32px;`}

  @media (max-width: 1100px) {
    grid-template-columns: ${({ list }) => (list ? '1fr' : 'repeat(2, 1fr)')};
  }
  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const FeedCardLink = styled(Link, {
  shouldForwardProp: prop => prop !== 'list',
})<{ list?: boolean }>`
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 0.85;
  }

  ${({ list }) =>
    list ?
      `
        display: grid;
        grid-template-columns: 200px 1fr;
        gap: 28px;
        padding: 28px 0;
        border-bottom: 1px solid ${eenewsColors.rule};
        @media (max-width: 720px) { grid-template-columns: 1fr; }
      `
    : `display: flex; flex-direction: column; gap: 14px;`}
`;

const ImgWrap = styled('div')`
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: ${eenewsColors.paperWarm};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.4s ease;
  }
  &:hover img {
    transform: scale(1.03);
  }
`;

const CardLead = styled('p', {
  shouldForwardProp: prop => prop !== 'list',
})<{ list?: boolean }>`
  margin: 0;
  color: ${eenewsColors.inkSoft};
  ${({ list }) =>
    list ?
      `display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;`
    : ''}
`;

const FeedMore = styled('div')`
  text-align: center;
  padding: 48px 0;
  border-top: 1px solid ${eenewsColors.rule};
  margin-top: 48px;
`;

const LoadMoreButton = styled('button')`
  appearance: none;
  background: ${eenewsColors.paper};
  color: ${eenewsColors.ink};
  border: 1px solid ${eenewsColors.ruleStrong};
  padding: 14px 26px;
  font-family: inherit;
  font-size: 14px;
  cursor: pointer;
  transition:
    background 0.12s ease,
    color 0.12s ease;
  &:hover {
    background: ${eenewsColors.ink};
    color: ${eenewsColors.paper};
  }
`;

const formatGermanDate = (iso: string | null | undefined) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('de-CH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const formatMonthYear = (iso: string | null | undefined) => {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('de-CH', {
    month: 'long',
    year: 'numeric',
  });
};

export type EenewsArchivePageProps = {
  variables: Partial<ArticleListQueryVariables>;
  onVariablesChange: (next: Partial<ArticleListQueryVariables>) => void;
};

export const EenewsArchivePage = ({
  variables,
  onVariablesChange,
}: EenewsArchivePageProps) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const articles = useArticleListQuery({
    fetchPolicy: 'cache-and-network',
    variables,
  });

  // Earliest article for the "Erstes Archiv-Beitrag" stat — same trick as
  // the topic page (no Article.firstPublishedAt aggregate; query take:1
  // sorted ascending instead).
  const earliest = useArticleListQuery({
    fetchPolicy: 'cache-first',
    variables: {
      sort: ArticleSort.PublishedAt,
      order: SortOrder.Ascending,
      take: 1,
    },
  });

  // Author count derived from the visible page only — for a global archive
  // a more accurate number would require fetching all articles, which is
  // wasteful. The stat reads "Autor·innen sichtbar" to be honest about
  // scope.
  const visibleAuthorIds = new Set<string>();
  for (const node of articles.data?.articles?.nodes ?? []) {
    for (const author of node.latest.authors ?? []) {
      visibleAuthorIds.add(author.id);
    }
  }
  const visibleAuthorCount = visibleAuthorIds.size;

  const articleNodes = articles.data?.articles?.nodes ?? [];
  const totalCount = articles.data?.articles?.totalCount ?? 0;
  const featureArticle = articleNodes[0];
  const restArticles = articleNodes.slice(1);

  const earliestPublishedAt = earliest.data?.articles?.nodes?.[0]?.publishedAt;
  const earliestLabel = formatMonthYear(earliestPublishedAt);

  const take = variables?.take ?? 24;
  const currentSkip = variables?.skip ?? 0;
  const hasMore =
    totalCount > currentSkip + (variables?.take ?? articleNodes.length);

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onVariablesChange(
      event.target.value === 'asc' ?
        {
          sort: ArticleSort.PublishedAt,
          order: SortOrder.Ascending,
          skip: 0,
        }
      : {
          sort: ArticleSort.PublishedAt,
          order: SortOrder.Descending,
          skip: 0,
        }
    );
  };

  const handleLoadMore = () => {
    onVariablesChange({ take: take + 9 });
  };

  return (
    <article>
      <TopicHero>
        <HeroInner>
          <Crumbs>
            <Link href="/">Home</Link> &nbsp;/&nbsp;
            <span>Archiv</span>
          </Crumbs>
          <TopicHead>
            <div>
              <Typography
                variant="metaEyebrow"
                component="div"
                sx={{ marginBottom: 1, color: eenewsColors.inkSoft }}
              >
                EE News
              </Typography>
              <Typography
                variant="displayTopicH1"
                component="h1"
                sx={{ margin: 0, color: eenewsColors.ink }}
              >
                Archiv
              </Typography>
            </div>
            <HeroRight>
              <Typography
                variant="bodyTopicDesc"
                component="p"
                sx={{ margin: '0 0 24px', color: eenewsColors.ink }}
              >
                Alle veröffentlichten Beiträge von ee·news, sortiert und
                filterbar nach Veröffentlichungsdatum. Tags und Autor·innen über
                die jeweiligen Themen-/Profilseiten zugänglich.
              </Typography>
              <StatsRow>
                <StatItem>
                  <Typography
                    variant="metaEyebrow"
                    component="span"
                  >
                    Beiträge
                  </Typography>
                  <Typography
                    variant="displayStatNum"
                    component="span"
                    sx={{ color: eenewsColors.ink }}
                  >
                    {totalCount}
                  </Typography>
                </StatItem>
                <StatItem>
                  <Typography
                    variant="metaEyebrow"
                    component="span"
                  >
                    Autor·innen sichtbar
                  </Typography>
                  <Typography
                    variant="displayStatNum"
                    component="span"
                    sx={{ color: eenewsColors.ink }}
                  >
                    {visibleAuthorCount}
                  </Typography>
                </StatItem>
                {earliestLabel ?
                  <StatItem>
                    <Typography
                      variant="metaEyebrow"
                      component="span"
                    >
                      Erster Beitrag
                    </Typography>
                    <Typography
                      variant="displayStatNum"
                      component="span"
                      sx={{ color: eenewsColors.ink, fontSize: 18 }}
                    >
                      {earliestLabel}
                    </Typography>
                  </StatItem>
                : null}
              </StatsRow>
            </HeroRight>
          </TopicHead>
        </HeroInner>
      </TopicHero>

      <Container>
        {featureArticle ?
          <Link
            href={featureArticle.url}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <TopicFeature>
              {featureArticle.latest.image?.l ?
                <FeatureImg>
                  <img
                    src={featureArticle.latest.image.l}
                    alt={featureArticle.latest.image.title ?? ''}
                  />
                </FeatureImg>
              : <FeatureImg />}
              <FeatureBody>
                <Kicker>
                  Aktuell · {formatGermanDate(featureArticle.publishedAt)}
                </Kicker>
                <Typography
                  variant="displayFeatureH2"
                  component="h2"
                  sx={{ margin: '0 0 20px', color: eenewsColors.ink }}
                >
                  {featureArticle.latest.title}
                </Typography>
                {featureArticle.latest.lead ?
                  <FeatureLead>
                    <Typography
                      variant="bodyTeaserFeatured"
                      component="span"
                    >
                      {featureArticle.latest.lead}
                    </Typography>
                  </FeatureLead>
                : null}
                <Meta>
                  {(featureArticle.latest.authors ?? [])
                    .map(a => a.name)
                    .filter(Boolean)
                    .join(' · ') || `${featureArticle.tags?.length ?? 0} Tags`}
                </Meta>
              </FeatureBody>
            </TopicFeature>
          </Link>
        : null}

        {restArticles.length > 0 ?
          <>
            <FeedToolbar>
              <ToolbarLabel>Alle Beiträge</ToolbarLabel>
              <ToolbarRight>
                <SortSelect
                  aria-label="Sortierung"
                  defaultValue={
                    variables?.order === SortOrder.Ascending ? 'asc' : 'desc'
                  }
                  onChange={handleSortChange}
                >
                  <option value="desc">Neueste zuerst</option>
                  <option value="asc">Älteste zuerst</option>
                </SortSelect>
                <ViewToggle role="tablist">
                  <ViewButton
                    type="button"
                    active={viewMode === 'grid'}
                    onClick={() => setViewMode('grid')}
                    aria-label="Raster"
                  >
                    ▦ Raster
                  </ViewButton>
                  <ViewButton
                    type="button"
                    active={viewMode === 'list'}
                    onClick={() => setViewMode('list')}
                    aria-label="Liste"
                  >
                    ☰ Liste
                  </ViewButton>
                </ViewToggle>
              </ToolbarRight>
            </FeedToolbar>

            <Feed list={viewMode === 'list'}>
              {restArticles.map(article => (
                <FeedCardLink
                  key={article.id}
                  href={article.url}
                  list={viewMode === 'list'}
                >
                  {article.latest.image?.m ?
                    <ImgWrap>
                      <img
                        src={article.latest.image.m}
                        alt={article.latest.image.title ?? ''}
                      />
                    </ImgWrap>
                  : <ImgWrap />}
                  <div>
                    <Meta>
                      {formatGermanDate(article.publishedAt)}
                      {article.latest.authors[0]?.name ?
                        ` · ${article.latest.authors[0].name}`
                      : ''}
                    </Meta>
                    <Typography
                      variant="displayTeaserMd"
                      component="h3"
                      sx={{ margin: '8px 0 8px', color: eenewsColors.ink }}
                    >
                      {article.latest.title}
                    </Typography>
                    {article.latest.lead ?
                      <CardLead list={viewMode === 'list'}>
                        <Typography
                          variant="bodyTeaserStandard"
                          component="span"
                        >
                          {article.latest.lead}
                        </Typography>
                      </CardLead>
                    : null}
                  </div>
                </FeedCardLink>
              ))}
            </Feed>

            {hasMore ?
              <FeedMore>
                <LoadMoreButton
                  type="button"
                  onClick={handleLoadMore}
                >
                  {totalCount - articleNodes.length} weitere Beiträge laden →
                </LoadMoreButton>
              </FeedMore>
            : null}
          </>
        : !articles.loading ?
          <Typography
            variant="bodyDefault"
            component="p"
            sx={{ paddingTop: 6, paddingBottom: 6 }}
          >
            Keine Beiträge vorhanden.
          </Typography>
        : null}
      </Container>
    </article>
  );
};
