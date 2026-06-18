import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { isFilledTeaser } from '@wepublish/block-content/website';
import {
  ArticleSort,
  FullTeaserFragment,
  SortOrder,
  useArticleListQuery,
  useTagListQuery,
} from '@wepublish/website/api';
import {
  BuilderTeaserSlotsBlockProps,
  useWebsiteBuilder,
  WebsiteBuilderProvider,
} from '@wepublish/website/builder';
import { useMemo, useState } from 'react';

import { EenewsTeaser } from '../teasers/eenews-teaser';
import { enrichTeasersWithAds } from '../teasers/eenews-teaser-ads';
import { EenewsTeaserSkeleton } from '../teasers/eenews-teaser-skeleton';

type Region = 'ch' | 'welt' | 'fr';

const REGION_TAG_NAME: Record<Region, string | null> = {
  ch: null,
  welt: 'international',
  fr: 'articles en français',
};

const Section = styled('section')`
  background: ${({ theme }) => theme.palette.background.default};
  padding: 56px;
  ${({ theme }) => theme.breakpoints.down('md')} {
    padding: 36px 20px;
  }
`;

const Head = styled('div')`
  max-width: var(--max-width);
  margin: 0 auto 28px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  ${({ theme }) => theme.breakpoints.down('md')} {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const Title = styled(Typography)`
  display: block;
  color: ${({ theme }) => theme.palette.primary.main};
  margin: 0;
`;

const Toggle = styled('div')`
  display: inline-flex;
  gap: 18px;
  align-items: center;
  color: ${({ theme }) => theme.palette.primary.main};
  ${({ theme }) => theme.breakpoints.down('sm')} {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0;
    width: 100%;
  }
`;

const ToggleSep = styled('span')`
  display: inline-block;
  width: 1px;
  height: 22px;
  background: ${({ theme }) => theme.palette.primary.main};
  opacity: 0.6;
  margin: 0 2px;
  ${({ theme }) => theme.breakpoints.down('sm')} {
    width: 56px;
    height: 1px;
    margin: 8px 0;
  }
`;

const ToggleLink = styled('a', {
  shouldForwardProp: p => p !== 'isActive',
})<{ isActive: boolean }>`
  background: none;
  border: 0;
  padding: 4px 2px;
  color: ${({ theme }) => theme.palette.primary.main};
  opacity: ${({ isActive }) => (isActive ? 1 : 0.45)};
  font-weight: ${({ isActive }) => (isActive ? 800 : 400)};
  text-decoration: ${({ isActive }) => (isActive ? 'underline' : 'none')};
  text-decoration-thickness: 3px;
  text-underline-offset: 6px;
  cursor: pointer;
  &:hover {
    opacity: 1;
  }
  ${({ theme }) => theme.breakpoints.down('sm')} {
    width: 100%;
    padding: 3px 0;
    text-decoration: none;
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
    gap: 50px;
  }
`;

export const EenewsAktuellGrid = ({
  title,
  teasers,
  blockStyle,
  className,
}: BuilderTeaserSlotsBlockProps) => {
  const {
    blocks: { Teaser },
  } = useWebsiteBuilder();

  const [region, setRegion] = useState<Region>('ch');

  const cmsTeasers = useMemo(
    () => (teasers ?? []).filter(isFilledTeaser),
    [teasers]
  );
  const articleCount = cmsTeasers.length || 6;

  const { data: tagListData } = useTagListQuery({
    fetchPolicy: 'cache-first',
    variables: { take: 100 },
  });
  const tagIdByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const tag of tagListData?.tags?.nodes ?? []) {
      if (tag.tag) {
        map.set(tag.tag.toLowerCase(), tag.id);
      }
    }
    return map;
  }, [tagListData]);

  const activeTagName = REGION_TAG_NAME[region];
  const activeTagId =
    activeTagName ? tagIdByName.get(activeTagName) : undefined;

  const { data: articlesData, loading } = useArticleListQuery({
    skip: !activeTagId,
    fetchPolicy: 'cache-first',
    variables: {
      filter: { tagsInclude: activeTagId ? [activeTagId] : [] },
      take: articleCount,
      skip: 0,
      sort: ArticleSort.PublishedAt,
      order: SortOrder.Descending,
    },
  });

  const articleTeasers = useMemo(
    () =>
      (articlesData?.articles?.nodes ?? []).map(
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
      ),
    [articlesData]
  );

  const displayTeasers = enrichTeasersWithAds(
    region === 'ch' ? cmsTeasers : articleTeasers
  );
  const pending = region !== 'ch' && (!activeTagId || loading);
  const showSkeleton = pending && articleTeasers.length === 0;

  return (
    <Section className={className}>
      <Head>
        <Title variant="sectionTitle">{title ?? 'Aktuell'}</Title>
        <Toggle
          role="navigation"
          aria-label="Region"
        >
          <ToggleLink
            href="/"
            isActive={region === 'ch'}
            onClick={event => {
              event.preventDefault();
              setRegion('ch');
            }}
          >
            <Typography
              variant="sectionToggle"
              component="span"
            >
              Schweiz
            </Typography>
          </ToggleLink>
          <ToggleSep aria-hidden />
          <ToggleLink
            href="/a/tag/international"
            isActive={region === 'welt'}
            onClick={event => {
              event.preventDefault();
              setRegion('welt');
            }}
          >
            <Typography
              variant="sectionToggle"
              component="span"
            >
              Welt
            </Typography>
          </ToggleLink>
          <ToggleSep aria-hidden />
          <ToggleLink
            href="/a/tag/articles%20en%20fran%C3%A7ais"
            isActive={region === 'fr'}
            onClick={event => {
              event.preventDefault();
              setRegion('fr');
            }}
          >
            <Typography
              variant="sectionToggle"
              component="span"
            >
              Articles en français
            </Typography>
          </ToggleLink>
        </Toggle>
      </Head>
      <Grid>
        {showSkeleton ?
          Array.from({ length: articleCount }).map((_, idx) => (
            <EenewsTeaserSkeleton key={idx} />
          ))
        : <WebsiteBuilderProvider blocks={{ Teaser: EenewsTeaser }}>
            {displayTeasers.map((teaser, idx) => (
              <Teaser
                key={idx}
                teaser={teaser}
                index={idx}
                blockStyle={blockStyle}
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
        }
      </Grid>
    </Section>
  );
};
