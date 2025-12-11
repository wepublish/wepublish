import { BuilderTeaserSlotsBlockProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { TsriTeaserType } from '../teasers/tsri-base-teaser';
import { TeaserSlotsArchiveTopic } from './teaser-slots-archive-topic';

export const teaserBlockStyleByIndex = (index: number): TsriTeaserType => {
  switch (index) {
    case 0:
      return TsriTeaserType.TwoRow;
    case 6:
      return TsriTeaserType.MoreAbout;
    default:
      return TsriTeaserType.TwoCol;
  }
};

export const isTeaserSlotsArchiveTopicWithTwoCol = allPass([
  ({ blockStyle }: BuilderTeaserSlotsBlockProps) => {
    return blockStyle === 'ArchiveTopicWithTwoCol';
  },
]);

export const TeaserSlotsArchiveTopicWithTwoCol = TeaserSlotsArchiveTopic;
