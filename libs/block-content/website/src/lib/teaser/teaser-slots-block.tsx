import {
  BlockContent,
  TeaserSlotsBlock as TeaserSlotsBlockType,
} from '@wepublish/website/api';
import {
  BuilderTeaserSlotsBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { alignmentForTeaserBlock, isFilledTeaser } from './teaser-grid-block';
import { css } from '@mui/material';
import styled from '@emotion/styled';

export const isTeaserSlotsBlock = (
  block: Pick<BlockContent, '__typename'>
): block is TeaserSlotsBlockType => block.__typename === 'TeaserSlotsBlock';

export const TeaserSlotsBlockWrapper = styled('section')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
`;

export const TeaserSlotsBlockTeasers = styled('div')`
  display: grid;
  column-gap: ${({ theme }) => theme.spacing(2)};
  row-gap: ${({ theme }) => theme.spacing(5)};
  grid-template-columns: 1fr;
  align-items: stretch;

  ${({ theme }) => css`
    ${theme.breakpoints.up('sm')} {
      grid-template-columns: 1fr 1fr;
    }

    ${theme.breakpoints.up('md')} {
      grid-template-columns: repeat(12, 1fr);
    }
  `}
`;

export const TeaserSlotsBlock = ({
  title,
  teasers,
  blockStyle,
  className,
}: BuilderTeaserSlotsBlockProps) => {
  const {
    elements: { H5 },
    blocks: { Teaser },
  } = useWebsiteBuilder();

  const filledTeasers = teasers.filter(isFilledTeaser);

  return (
    <TeaserSlotsBlockWrapper className={className}>
      {title && <H5 component={'h1'}>{title}</H5>}

      <TeaserSlotsBlockTeasers>
        {filledTeasers.map((teaser, index) => (
          <Teaser
            key={index}
            index={index}
            teaser={teaser}
            alignment={alignmentForTeaserBlock(index, 3)}
            blockStyle={blockStyle}
          />
        ))}
      </TeaserSlotsBlockTeasers>
    </TeaserSlotsBlockWrapper>
  );
};
