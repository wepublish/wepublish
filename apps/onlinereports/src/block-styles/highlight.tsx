import {
  alignmentForTeaserBlock,
  hasBlockStyle,
  isTeaserGridBlock,
  isTeaserListBlock,
  isTeaserSlotsBlock,
  TeaserGridBlockWrapper,
} from '@wepublish/block-content/website';
import {
  BlockContent,
  FullTeaserGridBlockFragment,
  FullTeaserListBlockFragment,
  FullTeaserSlotsBlockFragment,
} from '@wepublish/website/api';
import {
  BuilderTeaserGridBlockProps,
  BuilderTeaserListBlockProps,
  BuilderTeaserSlotsBlockProps,
} from '@wepublish/website/builder';
import { allPass, anyPass } from 'ramda';

import { HighlightTeaser } from '../custom-teasers/highlight';

export const isHighlightTeasers = (
  block: Pick<BlockContent, '__typename'>
): block is
  | FullTeaserGridBlockFragment
  | FullTeaserListBlockFragment
  | FullTeaserSlotsBlockFragment =>
  allPass([
    hasBlockStyle('Highlight'),
    anyPass([isTeaserGridBlock, isTeaserListBlock, isTeaserSlotsBlock]),
  ])(block);

export const HighlightBlockStyle = (
  block:
    | BuilderTeaserGridBlockProps
    | BuilderTeaserListBlockProps
    | BuilderTeaserSlotsBlockProps
) => {
  const { teasers, blockStyle, className } = block;
  const numColumns = 1;

  return (
    <TeaserGridBlockWrapper
      className={className}
      numColumns={numColumns}
    >
      {teasers.map((teaser, index) => (
        <HighlightTeaser
          key={index}
          teaser={teaser}
          numColumns={numColumns}
          alignment={alignmentForTeaserBlock(index, numColumns)}
          blockStyle={blockStyle}
          index={index}
        />
      ))}
    </TeaserGridBlockWrapper>
  );
};
