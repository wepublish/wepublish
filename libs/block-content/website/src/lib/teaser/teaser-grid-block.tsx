import { css } from '@mui/material';
import styled from '@emotion/styled';
import {
  BlockContent,
  FlexAlignment,
  Teaser,
  TeaserGridBlock as TeaserGridBlockType,
} from '@wepublish/website/api';
import {
  BuilderTeaserGridBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

export const isTeaserGridBlock = (
  block: Pick<BlockContent, '__typename'>
): block is TeaserGridBlockType => block.__typename === 'TeaserGridBlock';

export const TeaserGridBlockWrapper = styled('div', {
  shouldForwardProp: propName => propName !== 'numColumns',
})<Pick<TeaserGridBlockType, 'numColumns'>>`
  display: grid;
  column-gap: ${({ theme }) => theme.spacing(2)};
  row-gap: ${({ theme }) => theme.spacing(5)};
  grid-template-columns: 1fr;
  align-items: start;

  ${({ theme, numColumns }) =>
    numColumns > 1 &&
    css`
      ${theme.breakpoints.up('sm')} {
        grid-template-columns: 1fr 1fr;
      }

      ${theme.breakpoints.up('md')} {
        grid-template-columns: repeat(12, 1fr);
      }
    `}
`;

// @TODO: Have API filter these out by default
export const isFilledTeaser = (
  teaser: Teaser | null | undefined
): teaser is Teaser => {
  switch (teaser?.__typename) {
    case 'ArticleTeaser': {
      return Boolean(teaser.article);
    }

    case 'PageTeaser': {
      return Boolean(teaser.page);
    }

    case 'EventTeaser': {
      return Boolean(teaser.event);
    }

    case 'CustomTeaser': {
      return true;
    }
  }

  return false;
};

export const alignmentForTeaserBlock = (
  index: number,
  numColumns: number
): FlexAlignment => {
  const columnIndex = index % numColumns;
  const rowIndex = Math.floor(index / numColumns);

  return {
    i: index.toString(),
    static: false,
    h: 1,
    w: 12 / numColumns,
    x: (12 / numColumns) * columnIndex,
    y: rowIndex,
  };
};

export const TeaserGridBlock = ({
  numColumns,
  teasers,
  blockStyle,
  className,
}: BuilderTeaserGridBlockProps) => {
  const {
    blocks: { Teaser },
  } = useWebsiteBuilder();

  const filledTeasers = teasers.filter(isFilledTeaser);

  return (
    <TeaserGridBlockWrapper
      className={className}
      numColumns={numColumns}
    >
      {filledTeasers.map((teaser, index) => (
        <Teaser
          key={index}
          teaser={teaser}
          numColumns={numColumns}
          index={index}
          alignment={alignmentForTeaserBlock(index, numColumns)}
          blockStyle={blockStyle}
        />
      ))}
    </TeaserGridBlockWrapper>
  );
};
