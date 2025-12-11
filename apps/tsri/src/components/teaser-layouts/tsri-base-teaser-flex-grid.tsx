import { TeaserGridFlexBlock } from '@wepublish/block-content/website';
import { BuilderTeaserGridFlexBlockProps } from '@wepublish/website/builder';
import { cond, T } from 'ramda';

import {
  alignmentForTeaserBlock as alignmentForTeaserBlockFullsizeImage,
  isTeaserFlexGridFullsizeImage,
  TeaserFlexGridFullsizeImage,
} from './layout-fullsize-image';
import {
  alignmentForTeaserBlock as alignmentForTeaserBlockNoImage,
  isTeaserFlexGridNoImage,
  TeaserFlexGridNoImage,
} from './layout-no-image';
import {
  alignmentForTeaserBlock as alignmentForTeaserBlockNoImageAltColor,
  isTeaserFlexGridNoImageAltColor,
  TeaserFlexGridNoImageAltColor,
} from './layout-no-image-alt-color';
import {
  alignmentForTeaserBlock as teaserBlockStyleByIndexTwoCol,
  isTeaserFlexGridTwoCol,
  TeaserFlexGridTwoCol,
} from './layout-two-col';
import {
  alignmentForTeaserBlock as alignmentForTeaserBlockTwoColAltColor,
  isTeaserFlexGridTwoColAltColor,
  TeaserFlexGridTwoColAltColor,
} from './layout-two-col-alt-color';
import {
  alignmentForTeaserBlock,
  isTeaserFlexGridFrontMiddle,
  teaserBlockStyleByIndex,
  TeaserFlexGridFrontMiddle,
} from './teaser-flex-grid-front-middle';

export const TsriBaseTeaserGridFlex = cond([
  [
    isTeaserFlexGridFullsizeImage,
    (props: BuilderTeaserGridFlexBlockProps) => (
      <TeaserFlexGridFullsizeImage
        {...props}
        alignmentForTeaserBlock={alignmentForTeaserBlockFullsizeImage}
      />
    ),
  ],
  [
    isTeaserFlexGridTwoCol,
    (props: BuilderTeaserGridFlexBlockProps) => (
      <TeaserFlexGridTwoCol
        {...props}
        alignmentForTeaserBlock={teaserBlockStyleByIndexTwoCol}
      />
    ),
  ],
  [
    isTeaserFlexGridNoImage,
    (props: BuilderTeaserGridFlexBlockProps) => (
      <TeaserFlexGridNoImage
        {...props}
        alignmentForTeaserBlock={alignmentForTeaserBlockNoImage}
      />
    ),
  ],
  [
    isTeaserFlexGridNoImageAltColor,
    (props: BuilderTeaserGridFlexBlockProps) => (
      <TeaserFlexGridNoImageAltColor
        {...props}
        alignmentForTeaserBlock={alignmentForTeaserBlockNoImageAltColor}
      />
    ),
  ],
  [
    isTeaserFlexGridTwoColAltColor,
    (props: BuilderTeaserGridFlexBlockProps) => (
      <TeaserFlexGridTwoColAltColor
        {...props}
        alignmentForTeaserBlock={alignmentForTeaserBlockTwoColAltColor}
      />
    ),
  ],
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
