import styled from '@emotion/styled';
import { Container, Typography } from '@mui/material';
import {
  ArticleSort,
  SortOrder,
  TagType,
  useArticleListQuery,
  useTagListQuery,
} from '@wepublish/website/api';
import { BuilderTagProps, useWebsiteBuilder } from '@wepublish/website/builder';
import Link from 'next/link';
import { useState, useMemo } from 'react';

import { eenewsColors } from '../theme';

const TopicHero = styled('section')<{ tint?: string | null }>`
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
        ${({ tint }) => tint ?? 'rgba(217,234,123,0.5)'} 0%,
        transparent 55%
      ),
      radial-gradient(
        circle at 5% 110%,
        ${({ tint }) => tint ?? 'rgba(217,234,123,0.35)'} 0%,
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

const TagChip = styled('span')`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border: 1px solid ${eenewsColors.ruleStrong};
  border-radius: 999px;
  background: ${eenewsColors.paper};
  font-family: inherit;
  font-size: 14px;
  letter-spacing: 0.04em;
  color: ${eenewsColors.inkSoft};
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

const Feed = styled('div')<{ list?: boolean }>`
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

const CardLead = styled('p')<{ list?: boolean }>`
  margin: 0;
  color: ${eenewsColors.inkSoft};
  ${({ list }) =>
    list ?
      `
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      `
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

const RelatedGrid = styled('div')`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  padding: 64px 0;
  margin-top: 48px;
  border-top: 1px solid ${eenewsColors.rule};

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
    gap: 40px;
    padding: 48px 0;
  }
`;

const RelatedHeading = styled('h3')`
  font-family: inherit;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${eenewsColors.inkSoft};
  margin: 0 0 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid ${eenewsColors.rule};
`;

const AuthorList = styled('div')`
  display: flex;
  flex-direction: column;
`;

const AuthorRow = styled(Link)`
  display: grid;
  grid-template-columns: 56px 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid ${eenewsColors.rule};
  text-decoration: none;
  color: inherit;
  transition: padding 0.15s ease;

  &:hover {
    padding-left: 8px;
  }

  &:last-of-type {
    border-bottom: 0;
  }
`;

const Avatar = styled('div')`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    ${eenewsColors.paperWarm},
    ${eenewsColors.rule}
  );
  display: grid;
  place-items: center;
  font-family: inherit;
  font-size: 22px;
  font-weight: 400;
  color: ${eenewsColors.ink};
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const RelatedTags = styled('div')`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const TagChipLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border: 1px solid ${eenewsColors.ruleStrong};
  border-radius: 999px;
  background: ${eenewsColors.paper};
  font-family: inherit;
  font-size: 13px;
  color: ${eenewsColors.ink};
  text-decoration: none;
  transition:
    background 0.15s ease,
    color 0.15s ease;

  &:hover {
    background: ${eenewsColors.ink};
    color: ${eenewsColors.paper};
  }
`;

const formatTagDisplay = (raw: string | null | undefined) => {
  if (!raw) {
    return '';
  }
  return raw.charAt(0).toUpperCase() + raw.slice(1);
};

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('');

const formatGermanDate = (iso: string | null | undefined) => {
  if (!iso) {
    return '';
  }
  return new Date(iso).toLocaleDateString('de-CH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const formatMonthYear = (iso: string | null | undefined) => {
  if (!iso) {
    return null;
  }
  return new Date(iso).toLocaleDateString('de-CH', {
    month: 'long',
    year: 'numeric',
  });
};

export const EenewsTagPage = ({
  className,
  tag: tagData,
  articles,
  variables,
  onVariablesChange,
}: BuilderTagProps) => {
  const { ArticleList } = useWebsiteBuilder();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const tagObject = tagData?.data?.tag;
  const tagId = tagObject?.id;

  // `AuthorFilter.tagIds` filters by the Author's *own* tag relations
  // (`Author.tags`), not by tags on the articles they wrote. To get
  // "Autor·innen zu diesem Thema" we have to derive unique authors from
  // the articles in this topic. `take: 200` is enough for realistic topic
  // sizes; the dedupe is in `uniqueAuthors` below.
  //
  // CRITICAL: `ArticleFilter.tags` expects tag IDs, NOT slugs (see
  // `libs/article/api/src/lib/article.service.ts:60-72` — `tagId: { in:
  // filter.tags }`). Pass `tagObject.id`, never `tagObject.tag`. Naming
  // is misleading — the field is called `tags` but the values are IDs.
  const topicArticlesForAuthors = useArticleListQuery({
    skip: !tagId,
    variables: {
      filter: { tags: tagId ? [tagId] : [] },
      take: 200,
    },
  });

  // Earliest article for the "Erster Beitrag" stat.
  const earliestArticleResult = useArticleListQuery({
    skip: !tagId,
    variables: {
      filter: { tags: tagId ? [tagId] : [] },
      sort: ArticleSort.PublishedAt,
      order: SortOrder.Ascending,
      take: 1,
    },
  });

  // Related tags — main article tags (excluding the current one).
  const relatedTagsResult = useTagListQuery({
    variables: { filter: { type: TagType.Article }, take: 24 },
  });

  const articleNodes = articles?.data?.articles?.nodes ?? [];
  const totalCount = articles?.data?.articles?.totalCount ?? 0;
  const featureArticle = articleNodes[0];
  const restArticles = articleNodes.slice(1);

  // Dedupe authors across all topic articles AND count their article
  // appearances for the "N →" badge in the related-authors list.
  const { uniqueAuthors, authorArticleCounts } = useMemo(() => {
    type Author = NonNullable<
      NonNullable<typeof topicArticlesForAuthors.data>['articles']
    >['nodes'][number]['latest']['authors'][number];
    const map = new Map<string, Author>();
    const counts = new Map<string, number>();
    const nodes = topicArticlesForAuthors.data?.articles?.nodes ?? [];
    for (const article of nodes) {
      for (const author of article.latest.authors ?? []) {
        if (!map.has(author.id)) {
          map.set(author.id, author);
        }
        counts.set(author.id, (counts.get(author.id) ?? 0) + 1);
      }
    }
    const list = [...map.values()].sort(
      (a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0)
    );
    return { uniqueAuthors: list, authorArticleCounts: counts };
  }, [topicArticlesForAuthors.data]);

  const authorCount = uniqueAuthors.length;
  const earliestPublishedAt =
    earliestArticleResult.data?.articles?.nodes?.[0]?.publishedAt;
  const earliestLabel = formatMonthYear(earliestPublishedAt);

  const relatedTags = useMemo(() => {
    const all = relatedTagsResult.data?.tags?.nodes ?? [];
    return all
      .filter(t => !!t.tag && t.id !== tagId)
      .filter(t => t.main)
      .slice(0, 8);
  }, [relatedTagsResult.data?.tags?.nodes, tagId]);

  const tagTint =
    tagObject?.color ?
      `${tagObject.color}88` // ~50% alpha hex
    : null;

  const take = variables?.take ?? 24;
  const currentSkip = variables?.skip ?? 0;
  const hasMore =
    totalCount > currentSkip + (variables?.take ?? articleNodes.length);

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (!onVariablesChange) {
      return;
    }
    if (event.target.value === 'asc') {
      onVariablesChange({
        sort: ArticleSort.PublishedAt,
        order: SortOrder.Ascending,
        skip: 0,
      });
    } else {
      onVariablesChange({
        sort: ArticleSort.PublishedAt,
        order: SortOrder.Descending,
        skip: 0,
      });
    }
  };

  const handleLoadMore = () => {
    onVariablesChange?.({ take: take + 9 });
  };

  if (!tagObject) {
    return null;
  }

  const displayName = formatTagDisplay(tagObject.tag);
  const description = (() => {
    if (!tagObject.description) {
      return null;
    }
    if (typeof tagObject.description === 'string') {
      return tagObject.description;
    }
    return null;
  })();

  return (
    <article className={className}>
      <TopicHero tint={tagTint}>
        <HeroInner>
          <Crumbs>
            <Link href="/">Home</Link> &nbsp;/&nbsp;
            <Link href="/a">Archiv</Link> &nbsp;/&nbsp;
            <span>Thema</span>
          </Crumbs>
          <TopicHead>
            <div>
              <TagChip>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3 1 L2.5 11 M9 1 L8.5 11 M1 3.5 H11 M1 8.5 H11"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
                Tag · #{tagObject.tag}
              </TagChip>
              <Typography
                variant="displayTopicH1"
                component="h1"
                sx={{
                  margin: '18px 0 0',
                  color: eenewsColors.ink,
                }}
              >
                {displayName}
              </Typography>
            </div>
            <HeroRight>
              {description ?
                <Typography
                  variant="bodyTopicDesc"
                  component="p"
                  sx={{ margin: '0 0 24px', color: eenewsColors.ink }}
                >
                  {description}
                </Typography>
              : null}
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
                    Autor·innen
                  </Typography>
                  <Typography
                    variant="displayStatNum"
                    component="span"
                    sx={{ color: eenewsColors.ink }}
                  >
                    {authorCount}
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
                      sx={{
                        color: eenewsColors.ink,
                        fontSize: 18,
                      }}
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
                    .join(' · ') || `${featureArticle.tags.length} Tags`}
                </Meta>
              </FeatureBody>
            </TopicFeature>
          </Link>
        : null}

        {restArticles.length > 0 ?
          <>
            <FeedToolbar>
              <ToolbarLabel>Alle Beiträge zu #{tagObject.tag}</ToolbarLabel>
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
                      sx={{
                        margin: '8px 0 8px',
                        color: eenewsColors.ink,
                      }}
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
        : !articles?.loading ?
          <Typography
            variant="bodyDefault"
            component="p"
            sx={{ paddingTop: 6, paddingBottom: 6 }}
          >
            Keine Beiträge vorhanden.
          </Typography>
        : null}

        {uniqueAuthors.length > 0 || relatedTags.length > 0 ?
          <RelatedGrid>
            {uniqueAuthors.length > 0 ?
              <div>
                <RelatedHeading>Autor·innen zu diesem Thema</RelatedHeading>
                <AuthorList>
                  {uniqueAuthors.slice(0, 6).map(author => {
                    const count = authorArticleCounts.get(author.id) ?? 0;
                    return (
                      <AuthorRow
                        key={author.id}
                        href={`/author/${author.slug}`}
                      >
                        <Avatar>
                          {author.image?.s ?
                            <img
                              src={author.image.s}
                              alt={author.image.title ?? author.name}
                            />
                          : initialsOf(author.name)}
                        </Avatar>
                        <div>
                          <Typography
                            variant="uiByLineName"
                            component="div"
                            sx={{ color: eenewsColors.ink }}
                          >
                            {author.name}
                          </Typography>
                          {author.jobTitle ?
                            <Typography
                              variant="metaInline"
                              component="div"
                              sx={{ color: eenewsColors.inkSoft }}
                            >
                              {author.jobTitle}
                            </Typography>
                          : null}
                        </div>
                        <Typography
                          variant="metaInline"
                          component="span"
                          sx={{ color: eenewsColors.inkSoft }}
                        >
                          {count} →
                        </Typography>
                      </AuthorRow>
                    );
                  })}
                </AuthorList>
              </div>
            : null}

            {relatedTags.length > 0 ?
              <div>
                <RelatedHeading>Verwandte Themen</RelatedHeading>
                <RelatedTags>
                  {relatedTags.map(t => (
                    <TagChipLink
                      key={t.id}
                      href={`/a/tag/${t.tag}`}
                    >
                      #{formatTagDisplay(t.tag)}
                    </TagChipLink>
                  ))}
                </RelatedTags>
                <Typography
                  variant="metaInline"
                  component="p"
                  sx={{
                    color: eenewsColors.inkSoft,
                    marginTop: 3,
                    maxWidth: '52ch',
                  }}
                >
                  Tags fassen Beiträge zu Themen zusammen. Ein Beitrag kann
                  mehrere Tags tragen — verwandte Themen ergeben sich aus den am
                  häufigsten ko-verwendeten Tags.
                </Typography>
              </div>
            : null}
          </RelatedGrid>
        : null}

        {/* Fallback default ArticleList only kept around for empty/loading
            states the custom feed doesn't render — hidden by default. */}
        <div hidden>
          <ArticleList
            {...articles}
            variables={variables}
            onVariablesChange={onVariablesChange}
          />
        </div>
      </Container>
    </article>
  );
};
