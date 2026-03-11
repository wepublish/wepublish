import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import {
  alignmentForTeaserBlock,
  isFilledTeaser,
  TeaserSlotsBlockTeasers as TeaserSlotsBlockTeasersDefault,
  TeaserSlotsBlockWrapper as TeaserSlotsBlockWrapperDefault,
} from '@wepublish/block-content/website';
import {
  BuilderTeaserSlotsBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { Maybe } from 'graphql/jsutils/Maybe';
import { allPass } from 'ramda';

import { ReflektBlockType } from '../block-styles/reflekt-block-styles';

export const isTeaserSlotsTopic = allPass([
  ({ blockStyle }: BuilderTeaserSlotsBlockProps) => {
    return (
      blockStyle === ReflektBlockType.TeaserRecherchen ||
      blockStyle === ReflektBlockType.TeaserNews
    );
  },
]);
export const TeaserSlotsTopicWrapper = styled(TeaserSlotsBlockWrapperDefault)``;

export const TeaserSlotsTopicTeasers = styled(TeaserSlotsBlockTeasersDefault)``;

export const blockStyleByIndex = (
  index: number,
  count: number,
  blockStyle?: Maybe<string>
): ReflektBlockType | undefined => {
  return index < count - 1 ?
      (blockStyle as ReflektBlockType)
    : ReflektBlockType.TeaserMoreAbout;
};
export const TeaserSlotsTopic = ({
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
    <TeaserSlotsTopicWrapper className={className}>
      {title && <Typography variant={'teaserSlotsTitle'}>{title}</Typography>}
      <TeaserSlotsTopicTeasers>
        {filledTeasers.map((teaser, index) => (
          <Teaser
            key={index}
            index={index}
            teaser={teaser}
            alignment={alignmentForTeaserBlock(index, 3)}
            blockStyle={blockStyleByIndex(
              index,
              filledTeasers.length,
              blockStyle
            )}
          />
        ))}
      </TeaserSlotsTopicTeasers>
    </TeaserSlotsTopicWrapper>
  );
};
