import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import {
  hasBlockStyle,
  isFilledTeaser,
  isTeaserSlotsBlock,
  TeaserSlotsBlockTeasers as TeaserSlotsBlockTeasersDefault,
  TeaserSlotsBlockWrapper as TeaserSlotsBlockWrapperDefault,
} from '@wepublish/block-content/website';
import { BlockContent, FlexAlignment } from '@wepublish/website/api';
import {
  BuilderTeaserSlotsBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { anchorId } from '../anchor-id';
import { ReflektBlockStyles } from '../block-styles/reflekt-block-styles';

export const isTeaserSlotsCredits = (
  block: Pick<BlockContent, '__typename'>
): block is BuilderTeaserSlotsBlockProps =>
  allPass([
    isTeaserSlotsBlock,
    hasBlockStyle(ReflektBlockStyles.TeaserCredits),
  ])(block);

export const alignmentForTeaserBlock = (
  index: number,
  numColumns: number
): FlexAlignment => {
  const columnIndex = index % numColumns;
  const rowIndex = Math.floor(index / numColumns);

  return {
    i: index.toString(),
    static: false,
    h: 2,
    w: 12 / numColumns,
    x: (12 / numColumns) * columnIndex,
    y: rowIndex * 2,
  };
};

export const TeaserSlotsCreditsWrapper = styled(
  TeaserSlotsBlockWrapperDefault
)``;

export const TeaserSlotsCreditsTeasers = styled(TeaserSlotsBlockTeasersDefault)`
  align-items: stretch;
  row-gap: ${({ theme }) => theme.spacing(8)};
`;

export const TeaserSlotsCredits = ({
  title,
  teasers,
  blockStyle,
  className,
}: BuilderTeaserSlotsBlockProps) => {
  const {
    blocks: { Teaser },
  } = useWebsiteBuilder();

  const filledTeasers = teasers.filter(isFilledTeaser);

  return (
    <TeaserSlotsCreditsWrapper className={className}>
      {title && (
        <Typography
          variant={'teaserSlotsTitle'}
          id={anchorId(title)}
        >
          {title}
        </Typography>
      )}
      <TeaserSlotsCreditsTeasers>
        {filledTeasers.map((teaser, index) => (
          <Teaser
            key={index}
            index={index}
            teaser={teaser}
            alignment={alignmentForTeaserBlock(index, 4)}
            blockStyle={blockStyle}
          />
        ))}
      </TeaserSlotsCreditsTeasers>
    </TeaserSlotsCreditsWrapper>
  );
};
