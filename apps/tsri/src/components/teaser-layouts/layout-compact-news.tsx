import styled from '@emotion/styled';
import {
  isFilledTeaser,
  selectTeaserTarget,
  selectTeaserTitle,
  selectTeaserUrl,
} from '@wepublish/block-content/website';
import { FullTeaserFragment } from '@wepublish/website/api';
import {
  BuilderTeaserSlotsBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';

import {
  COMPACT_NEWS_TEASER_STYLE,
  CompactNewsRowContent,
  CompactNewsRowLead,
  CompactNewsRowPlaceholder,
  CompactNewsRowText,
  CompactNewsRowTitle,
  getCompactNewsFillerCount,
} from '../teasers/teaser-compact-news';
import { TsriLayoutType } from './tsri-layout';

export const isTeaserSlotsCompactNews = allPass([
  ({ blockStyle }: BuilderTeaserSlotsBlockProps) => {
    return blockStyle === TsriLayoutType.CompactNews;
  },
]);

export const CompactNewsSlotsWrapper = styled('div')``;

export const CompactNewsBox = styled('div')`
  ${({ theme }) => theme.breakpoints.up('xs')} {
    display: grid;
    grid-template-rows: min-content 1fr min-content;
    grid-template-columns: minmax(0, 1fr);
    height: 100%;
    min-width: 0;
    overflow: hidden;
    border-radius: calc(var(--tw, 100cqw) * 0.016875);
    background: linear-gradient(
      to bottom,
      ${({ theme }) => theme.palette.primary.main},
      color-mix(
        in srgb,
        ${({ theme }) => theme.palette.common.white} 60%,
        ${({ theme }) => theme.palette.primary.main}
      )
    );
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    aspect-ratio: 16/9;
    --tw: 47.5cqw;
  }
`;

export const CompactNewsHeader = styled('h2')`
  ${({ theme }) => theme.breakpoints.up('xs')} {
    margin: 0;
    padding: calc(var(--tw, 100cqw) * 0.018) calc(var(--tw, 100cqw) * 0.025);
    background-color: ${({ theme }) => theme.palette.common.black};
    color: ${({ theme }) => theme.palette.common.white};
    font-size: calc(var(--tw, 100cqw) * 0.045);
    line-height: 1.2;
    font-weight: 700;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding: calc(var(--tw, 100cqw) * 0.012) calc(var(--tw, 100cqw) * 0.015);
    font-size: calc(var(--tw, 100cqw) * 0.031);
  }
`;

export const CompactNewsRows = styled('ul')`
  ${({ theme }) => theme.breakpoints.up('xs')} {
    display: grid;
    grid-auto-rows: minmax(0, 1fr);
    grid-template-columns: minmax(0, 1fr);
    row-gap: calc(var(--tw, 100cqw) * 0.015);
    min-height: 0;
    min-width: 0;
    list-style: none;
    margin: 0;
    padding: calc(var(--tw, 100cqw) * 0.03) 0 calc(var(--tw, 100cqw) * 0.03)
      calc(var(--tw, 100cqw) * 0.1);
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    row-gap: calc(var(--tw, 100cqw) * 0.009);
    padding: calc(var(--tw, 100cqw) * 0.018) 0 calc(var(--tw, 100cqw) * 0.018)
      calc(var(--tw, 100cqw) * 0.1);
  }
`;

export const CompactNewsFooter = styled('div')`
  ${({ theme }) => theme.breakpoints.up('xs')} {
    justify-self: end;
    padding: 0 calc(var(--tw, 100cqw) * 0.025) calc(var(--tw, 100cqw) * 0.025);
    font-size: calc(var(--tw, 100cqw) * 0.04);
    font-weight: 700;

    & a {
      color: ${({ theme }) => theme.palette.common.black};
      text-decoration: underline;
      padding: calc(var(--tw, 100cqw) * 0.005) calc(var(--tw, 100cqw) * 0.015);
    }

    & a:hover {
      background-color: ${({ theme }) => theme.palette.primary.light};
      text-decoration: none;
    }
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding: 0 calc(var(--tw, 100cqw) * 0.015) calc(var(--tw, 100cqw) * 0.015);
    font-size: calc(var(--tw, 100cqw) * 0.0265);
  }
`;

const rowAlignment = (index: number) => ({
  i: index.toString(),
  static: false,
  h: 1,
  w: 1,
  x: 0,
  y: index,
});

export const TeaserSlotsCompactNews = ({
  teasers,
  title,
  className,
}: BuilderTeaserSlotsBlockProps) => {
  const {
    blocks: { Teaser },
    elements: { Link },
  } = useWebsiteBuilder();

  const filledTeasers = teasers.filter(isFilledTeaser);
  const rowTeasers = filledTeasers.filter(
    teaser => teaser.__typename === 'ArticleTeaser'
  );
  const linkTeaser = filledTeasers.find(
    (teaser): teaser is Extract<FullTeaserFragment, { contentUrl?: unknown }> =>
      teaser.__typename === 'CustomTeaser'
  );
  const fillerCount = getCompactNewsFillerCount(rowTeasers.length);
  const moreHref = linkTeaser && selectTeaserUrl(linkTeaser);
  const moreLabel =
    (linkTeaser && selectTeaserTitle(linkTeaser)) || 'Weitere Kurz-News hier';

  return (
    <CompactNewsSlotsWrapper className={className}>
      <CompactNewsBox>
        <CompactNewsHeader>
          {title?.trim() || 'Tsüri kompakt'}
        </CompactNewsHeader>
        <CompactNewsRows>
          {rowTeasers.map((teaser, index) => (
            <Teaser
              key={index}
              index={index}
              teaser={teaser}
              alignment={rowAlignment(index)}
              blockStyle={COMPACT_NEWS_TEASER_STYLE}
            />
          ))}
          {Array.from({ length: fillerCount }, (_, index) => (
            <CompactNewsRowPlaceholder
              key={index}
              aria-hidden
            >
              <CompactNewsRowContent>
                <CompactNewsRowText>
                  <CompactNewsRowTitle>{' '}</CompactNewsRowTitle>
                  <CompactNewsRowLead>{' '}</CompactNewsRowLead>
                </CompactNewsRowText>
              </CompactNewsRowContent>
            </CompactNewsRowPlaceholder>
          ))}
        </CompactNewsRows>
        {moreHref && (
          <CompactNewsFooter>
            <Link
              href={moreHref}
              target={linkTeaser && selectTeaserTarget(linkTeaser)}
            >
              {moreLabel}
            </Link>
          </CompactNewsFooter>
        )}
      </CompactNewsBox>
    </CompactNewsSlotsWrapper>
  );
};
