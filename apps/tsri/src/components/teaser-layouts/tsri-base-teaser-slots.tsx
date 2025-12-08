import { TeaserSlotsBlock } from '@wepublish/block-content/website';
import { BuilderTeaserSlotsBlockProps } from '@wepublish/website/builder';
import { cond, T } from 'ramda';

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
