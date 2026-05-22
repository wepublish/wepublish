import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import {
  FullNavigationFragment,
  Teaser,
  useNavigationListQuery,
  useTagListQuery,
} from '@wepublish/website/api';
import {
  BuilderTagProps,
  Link,
  useWebsiteBuilder,
  WebsiteBuilderProvider,
} from '@wepublish/website/builder';

import { eenewsColors } from '../theme';
import { EenewsTeaser } from './blocks/eenews-teaser';
import { EenewsPagination } from './eenews-pagination';

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
  max-width: 1340px;
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
  color: ${eenewsColors.accent};
  text-transform: capitalize;
`;

const TopicCount = styled('span')`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
  color: ${eenewsColors.accent};
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
  max-width: 1340px;
  margin: 0 auto;
`;

const FilterBar = styled('div')`
  padding: 0 56px 28px;
  ${({ theme }) => theme.breakpoints.down('md')} {
    padding: 0 20px 24px;
  }
`;

const FilterBarInner = styled('div')`
  max-width: 1340px;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 10px;
`;

const Chip = styled(Link)<{ chipColor: string }>`
  background: ${({ chipColor }) => chipColor};
  color: ${eenewsColors.accent};
  border: 0;
  padding: 7px 18px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  cursor: pointer;
  transition:
    background 140ms,
    color 140ms;
  &:hover {
    background: ${eenewsColors.accent};
    color: ${eenewsColors.tag};
  }
`;

const Section = styled('section')`
  padding: 56px;
  background: ${eenewsColors.bg};
  ${({ theme }) => theme.breakpoints.down('md')} {
    padding: 36px 20px;
  }
`;

const Grid = styled('div')`
  max-width: 1340px;
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
  color: ${eenewsColors.accent};
  text-align: center;
  padding: 32px 0;
`;

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

  const tag = tagResult.data?.tag;
  const articles = articlesResult.data?.articles?.nodes ?? [];
  const totalCount = articlesResult.data?.articles?.totalCount ?? 0;

  const take = variables?.take ?? 25;
  const skip = variables?.skip ?? 0;
  const currentPage = Math.floor(skip / take) + 1;
  const totalPages = Math.max(1, Math.ceil(totalCount / take));

  const { data: navData } = useNavigationListQuery({
    fetchPolicy: 'cache-first',
  });
  const dossierNav = navData?.navigations?.find(n => n.key === 'mega-dossiers');

  const { data: tagListData } = useTagListQuery({
    fetchPolicy: 'cache-first',
    variables: { take: 100 },
  });
  const tagColorByName = new Map<string, string>();
  for (const t of tagListData?.tags?.nodes ?? []) {
    if (t.tag && t.color) {
      tagColorByName.set(t.tag.toLowerCase(), t.color);
    }
  }

  const resolveChipColor = (url: string): string => {
    const match = url.match(/\/a\/tag\/(.+)$/);
    if (!match) {
      return eenewsColors.tag;
    }
    const slug = decodeURIComponent(match[1]).toLowerCase();
    return tagColorByName.get(slug) ?? eenewsColors.tag;
  };

  const isListingRoot = !tag;
  const tagColor = tag?.color ?? eenewsColors.tag;
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

      {isListingRoot && dossierNav && (
        <FilterBar>
          <FilterBarInner>
            {dossierNav.links.map((link, idx) => {
              const url = navigationLinkToUrl(link);
              if (!url) {
                return null;
              }
              return (
                <Chip
                  key={`${link.label}-${idx}`}
                  href={url}
                  chipColor={resolveChipColor(url)}
                >
                  <Typography variant="teaserTagChip">{link.label}</Typography>
                </Chip>
              );
            })}
          </FilterBarInner>
        </FilterBar>
      )}

      <Section>
        {articles.length === 0 ?
          <EmptyState variant="sectionToggle">Keine Beiträge.</EmptyState>
        : <Grid>
            <WebsiteBuilderProvider blocks={{ Teaser: EenewsTeaser }}>
              {articles.map((relatedArticle, idx) => (
                <BuilderTeaser
                  key={relatedArticle.id}
                  teaser={
                    {
                      __typename: 'ArticleTeaser',
                      style: 'DEFAULT',
                      image: null,
                      preTitle: null,
                      title: null,
                      lead: null,
                      article: relatedArticle,
                    } as unknown as Teaser
                  }
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
                    static: false,
                  }}
                />
              ))}
            </WebsiteBuilderProvider>
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
