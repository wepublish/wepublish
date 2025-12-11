import { TeaserSlotsBlock } from '@wepublish/block-content/website';
import { BuilderTeaserSlotsBlockProps } from '@wepublish/website/builder';
import { cond, T } from 'ramda';

import {
  alignmentForTeaserBlock as alignmentForTeaserBlockFullsizeImage,
  isTeaserSlotsFullsizeImage,
  TeaserSlotsFullsizeImage,
} from './layout-fullsize-image';
import {
  alignmentForTeaserBlock as alignmentForTeaserBlockNoImage,
  isTeaserSlotNoImage,
  TeaserSlotNoImage,
} from './layout-no-image';
import {
  alignmentForTeaserBlock as alignmentForTeaserBlockNoImageAltColor,
  isTeaserSlotNoImageAltColor,
  TeaserSlotNoImageAltColor,
} from './layout-no-image-alt-color';
import {
  alignmentForTeaserBlock as teaserBlockStyleByIndexTwoCol,
  isTeaserSlotsTwoCol,
  TeaserSlotsTwoCol,
} from './layout-two-col';
import {
  alignmentForTeaserBlock,
  isTeaserSlotsArchiveTopic,
  teaserBlockStyleByIndex,
  TeaserSlotsArchiveTopic,
} from './teaser-slots-archive-topic';
import {
  isTeaserSlotsArchiveTopicAuthor,
  teaserBlockStyleByIndex as teaserBlockStyleByIndexAuthor,
  TeaserSlotsArchiveTopicAuthor,
} from './teaser-slots-archive-topic-author';
import {
  isTeaserSlotsArchiveTopicWithTwoCol,
  teaserBlockStyleByIndex as teaserBlockStyleByIndexWithTwoCol,
  TeaserSlotsArchiveTopicWithTwoCol,
} from './teaser-slots-archive-topic-with-two-col';
import {
  alignmentForTeaserBlock as alignmentForTeaserBlockFrontTop,
  isTeaserSlotsFrontTop,
  teaserBlockStyleByIndex as teaserBlockStyleByIndexFrontTop,
  TeaserSlotsFrontTop,
} from './teaser-slots-front-top';

export const TsriBaseTeaserSlots = cond([
  [
    isTeaserSlotsFullsizeImage,
    (props: BuilderTeaserSlotsBlockProps) => (
      <TeaserSlotsFullsizeImage
        {...props}
        alignmentForTeaserBlock={alignmentForTeaserBlockFullsizeImage}
      />
    ),
  ],
  [
    isTeaserSlotsTwoCol,
    (props: BuilderTeaserSlotsBlockProps) => (
      <TeaserSlotsTwoCol
        {...props}
        alignmentForTeaserBlock={teaserBlockStyleByIndexTwoCol}
      />
    ),
  ],
  [
    isTeaserSlotNoImage,
    (props: BuilderTeaserSlotsBlockProps) => (
      <TeaserSlotNoImage
        {...props}
        alignmentForTeaserBlock={alignmentForTeaserBlockNoImage}
      />
    ),
  ],
  [
    isTeaserSlotNoImageAltColor,
    (props: BuilderTeaserSlotsBlockProps) => (
      <TeaserSlotNoImageAltColor
        {...props}
        alignmentForTeaserBlock={alignmentForTeaserBlockNoImageAltColor}
      />
    ),
  ],
  [
    isTeaserSlotsFrontTop,
    (props: BuilderTeaserSlotsBlockProps) => (
      <TeaserSlotsFrontTop
        {...props}
        alignmentForTeaserBlock={alignmentForTeaserBlockFrontTop}
        teaserBlockStyleByIndex={teaserBlockStyleByIndexFrontTop}
      />
    ),
  ],
  [
    isTeaserSlotsArchiveTopic,
    (props: BuilderTeaserSlotsBlockProps) => (
      <TeaserSlotsArchiveTopic
        {...props}
        alignmentForTeaserBlock={alignmentForTeaserBlock}
        teaserBlockStyleByIndex={teaserBlockStyleByIndex}
      />
    ),
  ],
  [
    isTeaserSlotsArchiveTopicAuthor,
    (props: BuilderTeaserSlotsBlockProps) => (
      <TeaserSlotsArchiveTopicAuthor
        {...props}
        alignmentForTeaserBlock={alignmentForTeaserBlock}
        teaserBlockStyleByIndex={teaserBlockStyleByIndexAuthor}
      />
    ),
  ],
  [
    isTeaserSlotsArchiveTopicWithTwoCol,
    (props: BuilderTeaserSlotsBlockProps) => (
      <TeaserSlotsArchiveTopicWithTwoCol
        {...props}
        alignmentForTeaserBlock={alignmentForTeaserBlock}
        teaserBlockStyleByIndex={teaserBlockStyleByIndexWithTwoCol}
      />
    ),
  ],
  [T, (props: BuilderTeaserSlotsBlockProps) => <TeaserSlotsBlock {...props} />],
]);
