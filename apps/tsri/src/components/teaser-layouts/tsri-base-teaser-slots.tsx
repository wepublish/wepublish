import { TeaserSlotsBlock } from '@wepublish/block-content/website';
import { BuilderTeaserSlotsBlockProps } from '@wepublish/website/builder';
import { cond, T } from 'ramda';

import {
  isTeaserSlotsArchiveTopic,
  TeaserSlotsArchiveTopic,
} from './teaser-slots-archive-topic';

export const TsriBaseTeaserSlots = cond([
  [
    isTeaserSlotsArchiveTopic,
    (props: BuilderTeaserSlotsBlockProps) => (
      <TeaserSlotsArchiveTopic {...props} />
    ),
  ],
  [T, (props: BuilderTeaserSlotsBlockProps) => <TeaserSlotsBlock {...props} />],
]);
