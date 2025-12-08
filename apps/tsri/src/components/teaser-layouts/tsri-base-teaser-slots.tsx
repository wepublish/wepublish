import { TeaserSlotsBlock } from '@wepublish/block-content/website';
import { BuilderTeaserSlotsBlockProps } from '@wepublish/website/builder';
import { cond, T } from 'ramda';

import {
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

export const TsriBaseTeaserSlots = cond([
  [
    isTeaserSlotsArchiveTopic,
    (props: BuilderTeaserSlotsBlockProps) => (
      <TeaserSlotsArchiveTopic
        {...props}
        teaserBlockStyleByIndex={teaserBlockStyleByIndex}
      />
    ),
  ],
  [
    isTeaserSlotsArchiveTopicAuthor,
    (props: BuilderTeaserSlotsBlockProps) => (
      <TeaserSlotsArchiveTopicAuthor
        {...props}
        teaserBlockStyleByIndex={teaserBlockStyleByIndexAuthor}
      />
    ),
  ],
  [
    isTeaserSlotsArchiveTopicWithTwoCol,
    (props: BuilderTeaserSlotsBlockProps) => (
      <TeaserSlotsArchiveTopicWithTwoCol
        {...props}
        teaserBlockStyleByIndex={teaserBlockStyleByIndexWithTwoCol}
      />
    ),
  ],
  [T, (props: BuilderTeaserSlotsBlockProps) => <TeaserSlotsBlock {...props} />],
]);
