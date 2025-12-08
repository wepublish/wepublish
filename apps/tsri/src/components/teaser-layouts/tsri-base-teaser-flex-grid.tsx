import { TeaserGridFlexBlock } from '@wepublish/block-content/website';
import { BuilderTeaserGridFlexBlockProps } from '@wepublish/website/builder';
import { cond, T } from 'ramda';

import {
  alignmentForTeaserBlock,
  isTeaserFlexGridFrontMiddle,
  teaserBlockStyleByIndex,
  TeaserFlexGridFrontMiddle,
} from './teaser-flex-grid-front-middle';

export const TsriBaseTeaserGridFlex = cond([
  [
    isTeaserFlexGridFrontMiddle,
    (props: BuilderTeaserGridFlexBlockProps) => (
      <TeaserFlexGridFrontMiddle
        {...props}
        teaserBlockStyleByIndex={teaserBlockStyleByIndex}
        alignmentForTeaserBlock={alignmentForTeaserBlock}
      />
    ),
  ],
  [
    T,
    (props: BuilderTeaserGridFlexBlockProps) => (
      <TeaserGridFlexBlock {...props} />
    ),
  ],
]);
