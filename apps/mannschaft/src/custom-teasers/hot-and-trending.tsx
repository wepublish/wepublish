import styled from '@emotion/styled';
import { TeaserWrapper } from '@wepublish/block-content/website';
import { useHotAndTrendingQuery } from '@wepublish/website/api';
import {
  BuilderTeaserProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';
import { useMemo } from 'react';

export const isHotAndTrendingTeaser = allPass([
  ({ teaser }: BuilderTeaserProps) => teaser?.type === 'Custom',
  ({ teaser }: BuilderTeaserProps) => teaser?.preTitle === 'hot-and-trending',
]);

const HotAndTrendingTeaserWrapper = styled('div')`
  display: grid;
  grid-auto-rows: min-content;
  gap: ${({ theme }) => theme.spacing(4)};
  background-color: ${({ theme }) => theme.palette.accent.contrastText};
  background-color: ${({ theme }) => theme.palette.accent.light};
  padding: ${({ theme }) => theme.spacing(2)};
`;

const HotAndTrendingTitle = styled('h1')``;

const HotAndTrendingLinkList = styled('ul')`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-auto-rows: min-content;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const HotAndTrendingLink = styled('li')`
  padding-bottom: ${({ theme }) => theme.spacing(2)};
  border-bottom: currentColor 1px solid;
  font-size: ${({ theme }) => theme.typography.h6.fontSize};
  font-weight: 600;

  &:last-child {
    border-bottom: 0;
  }
`;

export const HotAndTrendingTeaser = ({
  alignment,
  teaser,
}: BuilderTeaserProps) => {
  const {
    elements: { H4, Link },
  } = useWebsiteBuilder();

  const yesterday = useMemo(() => {
    const now = new Date();
    now.setUTCHours(0, 0, 0, 0);

    return now.toISOString();
  }, []);

  const { data } = useHotAndTrendingQuery({
    variables: {
      take: 5,
      start: yesterday,
    },
  });

  return (
    <TeaserWrapper {...alignment}>
      <HotAndTrendingTeaserWrapper>
        <H4 component={HotAndTrendingTitle}>{teaser?.title || 'Trending'}</H4>

        <HotAndTrendingLinkList>
          {data?.hotAndTrending.map(article => (
            <HotAndTrendingLink key={article.id}>
              <Link
                href={article.url}
                color="inherit"
                underline="none"
              >
                {article.latest.title}
              </Link>
            </HotAndTrendingLink>
          ))}
        </HotAndTrendingLinkList>
      </HotAndTrendingTeaserWrapper>
    </TeaserWrapper>
  );
};
