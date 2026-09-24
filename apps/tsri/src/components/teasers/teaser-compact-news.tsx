import styled from '@emotion/styled';
import {
  hasBlockStyle,
  selectTeaserLead,
  selectTeaserTitle,
  selectTeaserUrl,
} from '@wepublish/block-content/website';
import {
  BuilderTeaserProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';
import { MdArrowForwardIos } from 'react-icons/md';

export const COMPACT_NEWS_TEASER_STYLE = 'T_CompactNews';

export const COMPACT_NEWS_MIN_ROWS = 4;

export const getCompactNewsFillerCount = (rowCount: number) =>
  Math.max(0, COMPACT_NEWS_MIN_ROWS - rowCount);

export const isTeaserCompactNews = allPass([
  ({ blockStyle }: BuilderTeaserProps) =>
    hasBlockStyle(COMPACT_NEWS_TEASER_STYLE)({ blockStyle }),
]);

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
    font-size: calc(var(--tw, 100cqw) * 0.055);

    & svg {
      transform: translateX(10%);
    }
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    width: calc(var(--tw, 100cqw) * 0.055);
    font-size: calc(var(--tw, 100cqw) * 0.04);
  }
`;

export const TeaserCompactNews = ({
  teaser,
  className,
}: BuilderTeaserProps) => {
  const {
    elements: { Link },
  } = useWebsiteBuilder();

  const title = teaser && selectTeaserTitle(teaser);
  const lead = teaser && selectTeaserLead(teaser);
  const href = (teaser && selectTeaserUrl(teaser)) ?? '';

  return (
    <CompactNewsRow className={className}>
      <Link href={href}>
        <CompactNewsRowContent>
          <CompactNewsRowText>
            <CompactNewsRowTitle>{title}</CompactNewsRowTitle>
            <CompactNewsRowLead>{lead}</CompactNewsRowLead>
          </CompactNewsRowText>
          <CompactNewsRowArrow>
            <MdArrowForwardIos />
          </CompactNewsRowArrow>
        </CompactNewsRowContent>
      </Link>
    </CompactNewsRow>
  );
};
