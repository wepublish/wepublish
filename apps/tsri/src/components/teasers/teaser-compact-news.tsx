import styled from '@emotion/styled';
import {
  ArticleSort,
  FullTeaserFragment,
  SortOrder,
  TagType,
  useArticleListQuery,
  useTagQuery,
} from '@wepublish/website/api';
import {
  BuilderTeaserProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { PiCaretRightBold } from 'react-icons/pi';

import { TeaserWrapper as TeaserWrapperDefault } from './tsri-teaser';

export const COMPACT_NEWS_COMPONENT = 'compact-news';
export const COMPACT_NEWS_MIN_ROWS = 4;

export const getCompactNewsFillerCount = (
  count: number,
  articleCount: number
) => Math.max(0, Math.max(count, COMPACT_NEWS_MIN_ROWS) - articleCount);

const getTeaserProperty = (
  teaser: FullTeaserFragment | null | undefined,
  key: string
) =>
  teaser?.__typename === 'CustomTeaser' ?
    teaser.properties
      ?.find(property => property.key.trim().toLowerCase() === key)
      ?.value.trim()
  : undefined;

export const isTeaserCompactNews = ({ teaser }: BuilderTeaserProps) =>
  getTeaserProperty(teaser, 'component')?.toLowerCase() ===
  COMPACT_NEWS_COMPONENT;

export const parseCompactNewsConfig = (
  teaser: FullTeaserFragment | null | undefined
) => {
  const count = parseInt(getTeaserProperty(teaser, 'count') ?? '', 10);

  return {
    tag: getTeaserProperty(teaser, 'tag') || undefined,
    count: Number.isNaN(count) ? 4 : Math.min(8, Math.max(1, count)),
  };
};

export const TeaserWrapper = styled(TeaserWrapperDefault)`
  ${({ theme }) => theme.breakpoints.up('xs')} {
    aspect-ratio: unset;
    height: 100%;
    min-width: 0;
    grid-template-columns: minmax(0, 1fr);
    container-type: normal;
    cursor: default;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    aspect-ratio: 16/9;
    grid-column: auto;
    grid-row: auto;
    --tw: 47.5cqw;
  }
`;

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
    row-gap: calc(var(--tw, 100cqw) * 0.02);
    min-height: 0;
    min-width: 0;
    list-style: none;
    margin: 0;
    padding: calc(var(--tw, 100cqw) * 0.03) 0 calc(var(--tw, 100cqw) * 0.03)
      calc(var(--tw, 100cqw) * 0.1);
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    row-gap: calc(var(--tw, 100cqw) * 0.012);
    padding: calc(var(--tw, 100cqw) * 0.018) 0 calc(var(--tw, 100cqw) * 0.018)
      calc(var(--tw, 100cqw) * 0.1);
  }
`;

export const CompactNewsRow = styled('li')`
  ${({ theme }) => theme.breakpoints.up('xs')} {
    min-height: 0;
    min-width: 0;
    overflow: hidden;
    background-color: ${({ theme }) => theme.palette.common.white};

    & > a {
      display: block;
      height: 100%;
      color: ${({ theme }) => theme.palette.common.black};
      text-decoration: none;
    }

    &:hover {
      background-color: ${({ theme }) => theme.palette.primary.light};
    }
  }
`;

export const CompactNewsRowPlaceholder = styled(CompactNewsRow)`
  ${({ theme }) => theme.breakpoints.up('xs')} {
    background-color: transparent;

    &:hover {
      background-color: transparent;
    }
  }
`;

export const CompactNewsRowContent = styled('span')`
  ${({ theme }) => theme.breakpoints.up('xs')} {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    height: 100%;
    column-gap: calc(var(--tw, 100cqw) * 0.025);
    padding: calc(var(--tw, 100cqw) * 0.015) calc(var(--tw, 100cqw) * 0.02);
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    column-gap: calc(var(--tw, 100cqw) * 0.015);
    padding: calc(var(--tw, 100cqw) * 0.008) calc(var(--tw, 100cqw) * 0.012);
  }
`;

export const CompactNewsRowText = styled('span')`
  ${({ theme }) => theme.breakpoints.up('xs')} {
    display: block;
    min-width: 0;
  }
`;

export const CompactNewsRowTitle = styled('strong')`
  ${({ theme }) => theme.breakpoints.up('xs')} {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 700;
    font-size: calc(var(--tw, 100cqw) * 0.04);
    line-height: 1.35;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    font-size: calc(var(--tw, 100cqw) * 0.0265);
  }
`;

export const CompactNewsRowLead = styled('span')`
  ${({ theme }) => theme.breakpoints.up('xs')} {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 400;
    font-size: calc(var(--tw, 100cqw) * 0.04);
    line-height: 1.35;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    font-size: calc(var(--tw, 100cqw) * 0.0265);
  }
`;

export const CompactNewsRowArrow = styled('span')`
  ${({ theme }) => theme.breakpoints.up('xs')} {
    display: grid;
    place-items: center;
    width: calc(var(--tw, 100cqw) * 0.09);
    aspect-ratio: 1;
    border-radius: 50%;
    background-color: ${({ theme }) => theme.palette.common.black};
    color: ${({ theme }) => theme.palette.common.white};
    font-size: calc(var(--tw, 100cqw) * 0.05);
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    width: calc(var(--tw, 100cqw) * 0.055);
    font-size: calc(var(--tw, 100cqw) * 0.03);
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

export const TeaserCompactNews = ({
  teaser,
  alignment,
  className,
}: BuilderTeaserProps) => {
  const {
    elements: { Link },
  } = useWebsiteBuilder();
  const { tag, count } = parseCompactNewsConfig(teaser);

  const { data: tagData } = useTagQuery({
    skip: !tag,
    variables: {
      tag: tag ?? '',
      type: TagType.Article,
    },
  });

  const tagId = tagData?.tag?.id;

  const { data: articleData } = useArticleListQuery({
    skip: !tagId,
    variables: {
      take: count,
      sort: ArticleSort.PublishedAt,
      order: SortOrder.Descending,
      filter: { tags: tagId ? [tagId] : [] },
    },
  });

  if (!tag) {
    return null;
  }

  const customTeaser =
    teaser?.__typename === 'CustomTeaser' ? teaser : undefined;
  const articles = articleData?.articles.nodes ?? [];
  const fillerCount = getCompactNewsFillerCount(count, articles.length);
  const moreHref = customTeaser?.contentUrl || tagData?.tag?.url || '';
  const moreLabel = customTeaser?.lead?.trim() || 'Weitere Kurz-News hier';
  const heading = customTeaser?.title?.trim() || 'Tsüri kompakt';

  return (
    <TeaserWrapper
      {...alignment}
      className={className}
    >
      <CompactNewsBox>
        <CompactNewsHeader>{heading}</CompactNewsHeader>
        <CompactNewsRows>
          {articles.map(article => (
            <CompactNewsRow key={article.id}>
              <Link href={article.url}>
                <CompactNewsRowContent>
                  <CompactNewsRowText>
                    <CompactNewsRowTitle>
                      {article.latest.title}
                    </CompactNewsRowTitle>
                    <CompactNewsRowLead>
                      {article.latest.lead}
                    </CompactNewsRowLead>
                  </CompactNewsRowText>
                  <CompactNewsRowArrow>
                    <PiCaretRightBold />
                  </CompactNewsRowArrow>
                </CompactNewsRowContent>
              </Link>
            </CompactNewsRow>
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
              target={customTeaser?.openInNewTab ? '_blank' : undefined}
            >
              {moreLabel}
            </Link>
          </CompactNewsFooter>
        )}
      </CompactNewsBox>
    </TeaserWrapper>
  );
};
