import styled from '@emotion/styled';
import { Typography, useTheme } from '@mui/material';
import {
  FullNavigationFragment,
  FullTeaserFragment,
  useArticleListQuery,
  useNavigationListQuery,
  useTagListQuery,
} from '@wepublish/website/api';
import {
  BuilderTagProps,
  Link,
  useWebsiteBuilder,
  WebsiteBuilderProvider,
} from '@wepublish/website/builder';
import { useRouter } from 'next/router';
import { MdClose } from 'react-icons/md';

import { ActiveBadgeTagContext } from '../context/active-badge-tag-context';
import { EenewsTeaser } from './blocks/eenews-teaser';
import { EenewsTeaserSkeleton } from './blocks/eenews-teaser-skeleton';
import { EenewsPagination } from './eenews-pagination';
import { isAllowedTagName } from './teasers/eenews-teaser-selectors';

const navigationLinkToUrl = (
  link: FullNavigationFragment['links'][number]
): string | undefined => {
  switch (link.__typename) {
    case 'ArticleNavigationLink':
      return link.article?.url;
    case 'PageNavigationLink':
      return link.page?.url;
    case 'ExternalNavigationLink':
      return link.url ?? undefined;
  }
};

const TopicHero = styled('section')`
  padding: 36px 56px 28px;
  ${({ theme }) => theme.breakpoints.down('md')} {
    padding: 24px 20px 18px;
  }
`;

const TopicHeroInner = styled('div')`
  max-width: var(--max-width);
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`;

const PageTitle = styled(Typography)`
  display: block;
  margin: 0;
  font-family: ${({ theme }) => theme.typography.fontFamily};
  font-size: 38px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.palette.primary.main};
  text-transform: capitalize;
`;

const TopicCount = styled('span')`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
  color: ${({ theme }) => theme.palette.primary.main};
  font-family: ${({ theme }) => theme.typography.fontFamily};
  font-size: 15px;
  font-weight: 500;
  line-height: 1;
`;

const TopicCountDot = styled('span', {
  shouldForwardProp: p => p !== 'dotColor',
})<{ dotColor: string }>`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ dotColor }) => dotColor};
`;

const ListingHero = styled('section')`
  padding: 36px 56px 24px;
  ${({ theme }) => theme.breakpoints.down('md')} {
    padding: 24px 20px 18px;
  }
`;

const ListingHeroInner = styled('div')`
  max-width: var(--max-width);
  margin: 0 auto;
`;

const FilterBar = styled('div')`
  padding: 0 56px 28px;
  ${({ theme }) => theme.breakpoints.down('md')} {
    padding: 0 20px 24px;
  }
`;

const FilterBarInner = styled('div')`
  max-width: var(--max-width);
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 10px;
`;

const Chip = styled(Link, {
  shouldForwardProp: p => p !== 'chipColor' && p !== 'isActive',
})<{ chipColor: string; isActive?: boolean }>`
  background: ${({ chipColor, isActive, theme }) =>
    isActive ? theme.palette.primary.main : chipColor};
  color: ${({ isActive, theme }) =>
    isActive ? theme.palette.secondary.main : theme.palette.primary.main};
  border: 0;
  box-shadow: ${({ isActive }) =>
    isActive ? '0 4px 14px rgba(0, 0, 0, 0.45)' : 'none'};
  padding: 7px 18px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  cursor: pointer;
  transition:
    background 140ms,
    color 140ms,
    box-shadow 140ms;
  &:hover {
    background: ${({ theme }) => theme.palette.primary.main};
    color: ${({ theme }) => theme.palette.secondary.main};
  }
`;

const ResetChip = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  min-width: 34px;
  padding: 0 8px;
  border: 1.5px solid ${({ theme }) => theme.palette.primary.main};
  background: transparent;
  color: ${({ theme }) => theme.palette.primary.main};
  text-decoration: none;
  cursor: pointer;
  transition:
    background 140ms,
    color 140ms;
  &:hover {
    background: ${({ theme }) => theme.palette.primary.main};
    color: ${({ theme }) => theme.palette.background.paper};
  }
`;

const Section = styled('section')`
  padding: 56px;
  background: ${({ theme }) => theme.palette.background.default};
  ${({ theme }) => theme.breakpoints.down('md')} {
    padding: 36px 20px;
  }
`;

const Grid = styled('div')`
  max-width: var(--max-width);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 36px 32px;
  ${({ theme }) => theme.breakpoints.down('lg')} {
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }
  ${({ theme }) => theme.breakpoints.down('sm')} {
    grid-template-columns: 1fr;
  }
`;

const EmptyState = styled(Typography)`
  display: block;
  color: ${({ theme }) => theme.palette.primary.main};
  text-align: center;
  padding: 32px 0;
`;

type TopicFilterChipProps = {
  topicTagId: string;
  chipTagId: string;
  href: string;
  chipColor: string;
  isActive: boolean;
  label: string;
};

// Renders a topic-page filter chip only when its "topic ∩ chip" intersection has at
// least one article, so no chip selection can lead to an empty page. The count is
// prefetched in getStaticProps, so this cache-first read resolves from the hydrated
// Apollo cache — no extra request, no flash.
const TopicFilterChip = ({
  topicTagId,
  chipTagId,
  href,
  chipColor,
  isActive,
  label,
}: TopicFilterChipProps) => {
  const { data } = useArticleListQuery({
    fetchPolicy: 'cache-first',
    variables: {
      take: 1,
      skip: 0,
      filter: { tagsInclude: [topicTagId, chipTagId] },
    },
  });

  if (!data?.articles?.totalCount) {
    return null;
  }

  return (
    <Chip
      href={href}
      chipColor={chipColor}
      isActive={isActive}
    >
      <Typography variant="teaserTagChip">{label}</Typography>
    </Chip>
  );
};

export const EenewsTagPage = ({
  className,
  tag: tagResult,
  articles: articlesResult,
  variables,
  onVariablesChange,
}: BuilderTagProps) => {
  const {
    blocks: { Teaser: BuilderTeaser },
  } = useWebsiteBuilder();
  const theme = useTheme();
  const router = useRouter();

  const tag = tagResult.data?.tag;
  const isListingRoot = !tag;
  const isTopicPage = Boolean(tag?.main);
  const currentTagSlug = tag?.tag?.toLowerCase();
  const isDossierPage =
    !isListingRoot && !isTopicPage && isAllowedTagName(currentTagSlug);

  const take = variables?.take ?? 25;
  const skip = variables?.skip ?? 0;

  const { data: navData } = useNavigationListQuery({
    fetchPolicy: 'cache-first',
  });
  const dossierNav = navData?.navigations?.find(n => n.key === 'mega-dossiers');
  const showFilterBar = Boolean(
    dossierNav && (isListingRoot || isTopicPage || isDossierPage)
  );

  const { data: tagListData } = useTagListQuery({
    fetchPolicy: 'cache-first',
    variables: { take: 100 },
  });
  const tagColorByName = new Map<string, string>();
  const tagIdByName = new Map<string, string>();
  for (const t of tagListData?.tags?.nodes ?? []) {
    if (t.tag) {
      tagIdByName.set(t.tag.toLowerCase(), t.id);
    }
    if (t.tag && t.color) {
      tagColorByName.set(t.tag.toLowerCase(), t.color);
    }
  }

  const tagSlugFromUrl = (url: string): string | undefined => {
    const match = url.match(/\/a\/tag\/(.+)$/);
    return match ? decodeURIComponent(match[1]).toLowerCase() : undefined;
  };

  const resolveChipColor = (url: string): string => {
    const slug = tagSlugFromUrl(url);
    return (slug && tagColorByName.get(slug)) || theme.palette.secondary.main;
  };

  const intersectionSlug =
    isTopicPage && typeof router.query.filter === 'string' ?
      router.query.filter.toLowerCase()
    : undefined;
  const intersectionTagId =
    intersectionSlug ? tagIdByName.get(intersectionSlug) : undefined;
  const isIntersection = Boolean(tag?.id && intersectionTagId);

  const activeChipSlug =
    isTopicPage ? intersectionSlug
    : isDossierPage ? currentTagSlug
    : undefined;

  const filteredArticles = useArticleListQuery({
    skip: !isIntersection,
    fetchPolicy: 'cache-first',
    variables: {
      ...variables,
      filter: { tagsInclude: [tag?.id ?? '', intersectionTagId ?? ''] },
    },
  });

  const articlesData =
    isIntersection ? filteredArticles.data : articlesResult.data;
  const articlesLoading =
    isIntersection ? filteredArticles.loading : articlesResult.loading;
  const articles = articlesData?.articles?.nodes ?? [];
  const teasers = articles.map(
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
  );
  const totalCount = articlesData?.articles?.totalCount ?? 0;
  const currentPage = Math.floor(skip / take) + 1;
  const totalPages = Math.max(1, Math.ceil(totalCount / take));

  const tagColor = tag?.color ?? theme.palette.secondary.main;
  const tagLabel = tag?.tag ?? '';

  return (
    <div className={className}>
      {isListingRoot ?
        <ListingHero>
          <ListingHeroInner>
            <PageTitle>Dossiers</PageTitle>
          </ListingHeroInner>
        </ListingHero>
      : <TopicHero>
          <TopicHeroInner>
            <PageTitle>{tagLabel}</PageTitle>
            <TopicCount>
              <TopicCountDot
                dotColor={tagColor}
                aria-hidden
              />
              {totalCount} Beiträge
            </TopicCount>
          </TopicHeroInner>
        </TopicHero>
      }

      {showFilterBar && (
        <FilterBar>
          <FilterBarInner>
            {dossierNav?.links.map((link, idx) => {
              const url = navigationLinkToUrl(link);
              if (!url) {
                return null;
              }
              const slug = tagSlugFromUrl(url);
              if (!slug || !isAllowedTagName(slug)) {
                return null;
              }
              const chipActive = activeChipSlug === slug;
              const base = router.asPath.split('?')[0];
              let href: string;
              if (isTopicPage) {
                href =
                  chipActive ? base : (
                    `${base}?filter=${encodeURIComponent(slug)}`
                  );
              } else {
                href = chipActive ? '/a/tag' : url;
              }
              const chipColor = resolveChipColor(url);

              // On topic pages, only show a chip whose topic∩chip intersection has
              // articles (availability prefetched in getStaticProps).
              if (isTopicPage && tag?.id) {
                const chipTagId = tagIdByName.get(slug);
                if (!chipTagId) {
                  return null;
                }
                return (
                  <TopicFilterChip
                    key={`${link.label}-${idx}`}
                    topicTagId={tag.id}
                    chipTagId={chipTagId}
                    href={href}
                    chipColor={chipColor}
                    isActive={chipActive}
                    label={link.label}
                  />
                );
              }

              return (
                <Chip
                  key={`${link.label}-${idx}`}
                  href={href}
                  chipColor={chipColor}
                  isActive={chipActive}
                >
                  <Typography variant="teaserTagChip">{link.label}</Typography>
                </Chip>
              );
            })}
            {activeChipSlug && (
              <ResetChip
                href={isTopicPage ? router.asPath.split('?')[0] : '/a/tag'}
                aria-label="Filter zurücksetzen"
              >
                <MdClose size={18} />
              </ResetChip>
            )}
          </FilterBarInner>
        </FilterBar>
      )}

      <Section>
        {articles.length === 0 && articlesLoading ?
          <Grid>
            {Array.from({ length: take }).map((_, idx) => (
              <EenewsTeaserSkeleton key={idx} />
            ))}
          </Grid>
        : articles.length === 0 ?
          <EmptyState variant="sectionToggle">Keine Beiträge.</EmptyState>
        : <Grid>
            <ActiveBadgeTagContext.Provider value={activeChipSlug}>
              <WebsiteBuilderProvider blocks={{ Teaser: EenewsTeaser }}>
                {teasers.map((teaser, idx) => (
                  <BuilderTeaser
                    key={idx}
                    teaser={teaser}
                    index={idx}
                    blockStyle={
                      isListingRoot ? 'DossierGrid' : 'TagFilterableGrid'
                    }
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
            </ActiveBadgeTagContext.Provider>
          </Grid>
        }

        {totalPages > 1 && (
          <EenewsPagination
            page={currentPage}
            totalPages={totalPages}
            onChange={nextPage => {
              onVariablesChange?.({
                ...variables,
                skip: (nextPage - 1) * take,
                take,
              });
              if (typeof window !== 'undefined') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          />
        )}
      </Section>
    </div>
  );
};
