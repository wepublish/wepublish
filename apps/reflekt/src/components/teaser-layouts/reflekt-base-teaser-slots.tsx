import { TeaserSlotsBlock } from '@wepublish/block-content/website';
import { BuilderTeaserSlotsBlockProps } from '@wepublish/website/builder';
import { cond, T } from 'ramda';

import {
  isTeaserSlotsCredits,
  TeaserSlotsCredits,
} from './teaser-slots-credits';
import { isTeaserSlotsTopic, TeaserSlotsTopic } from './teaser-slots-topic';

export const ReflektBaseTeaserSlots = cond([
  [isTeaserSlotsTopic, props => <TeaserSlotsTopic {...props} />],
  [isTeaserSlotsCredits, props => <TeaserSlotsCredits {...props} />],
  [T, props => <TeaserSlotsBlock {...props} />], // default teaser-slots-block
  [
    T,
    (props: BuilderTeaserSlotsBlockProps) => (
      <div>
        ReflektTeaserSlotsBlock fallback - unknown TeaserSlots type. blockStyle:
        {props.blockStyle}
      </div>
    ),
  ],
]);
