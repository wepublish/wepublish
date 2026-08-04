import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { isFilledTeaser } from '@wepublish/block-content/website';
import { TeaserSlotsBlockTeasers as TeaserSlotsBlockTeasersDefault } from '@wepublish/block-content/website';
import { FlexAlignment } from '@wepublish/website/api';
import {
  BuilderTeaserSlotsBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

export const TeaserLayoutWrapper = styled('div')`
  display: grid;
  align-items: stretch;
  list-style: none;
  margin: 0;
  padding: 0;
  grid-template-columns: unset;

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: repeat(12, 1fr);
  }
`;

export const TeaserSlotsTeasers = styled(TeaserSlotsBlockTeasersDefault)`
  grid-column: -1 / 1;
  display: grid;
  grid-template-columns: subgrid;
  column-gap: inherit;
  row-gap: inherit;
`;

export const defaultAlignmentForTeaserBlock = (
  index: number,
  count?: number
): FlexAlignment => {
  const alignment = {
    i: index.toString(),
    static: false,
    h: 1, // how many rows high
    w: 4, // how many columns wide
    x: 0, // starting column - 1
    y: 0, // starting row - 1
  };
  return {
    ...alignment,
    x: (index % 3) * alignment.w,
    y: Math.floor(index / 3),
  };
};

export const WepTeaserSlots = ({
  teasers,
  className,
  alignmentForTeaserBlock,
  teaserBlockStyleByIndex,
  blockStyle,
  title,
}: BuilderTeaserSlotsBlockProps & {
  alignmentForTeaserBlock?: (index: number, count?: number) => FlexAlignment;
  teaserBlockStyleByIndex?: (index: number, count?: number) => string;
}) => {
  const {
    blocks: { Teaser },
  } = useWebsiteBuilder();

  const filledTeasers = teasers.filter(isFilledTeaser);

  return (
    <TeaserLayoutWrapper className={className}>
      {title && <Typography variant={'teaserSlotsTitle'}>{title}</Typography>}
      <TeaserSlotsTeasers>
        {filledTeasers.map((teaser, index) => (
          <Teaser
            key={index}
            index={index}
            teaser={teaser}
            alignment={
              alignmentForTeaserBlock ?
                alignmentForTeaserBlock(index, filledTeasers.length)
              : defaultAlignmentForTeaserBlock(index, filledTeasers.length)
            }
            blockStyle={
              (teaserBlockStyleByIndex &&
                teaserBlockStyleByIndex(index, filledTeasers.length)) ||
              blockStyle
            }
          />
        ))}
      </TeaserSlotsTeasers>
    </TeaserLayoutWrapper>
  );
};
