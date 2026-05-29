import { TeaserSlotsBlock } from '@wepublish/block-content/website';
import { BuilderTeaserSlotsBlockProps } from '@wepublish/website/builder';
import { cond, T } from 'ramda';

import {
  isTeaserSlotsCredits,
  TeaserSlotsCredits,
} from './teaser-slots-credits';
import { isTeaserSlotsTopic, TeaserSlotsTopic } from './teaser-slots-topic';

export const ReflektBaseTeaserSlots = cond([
  [
    isTeaserSlotsTopic,
    (props: BuilderTeaserSlotsBlockProps) => <TeaserSlotsTopic {...props} />,
  ],
  [
    isTeaserSlotsCredits,
    (props: BuilderTeaserSlotsBlockProps) => <TeaserSlotsCredits {...props} />,
  ],
  [T, (props: BuilderTeaserSlotsBlockProps) => <TeaserSlotsBlock {...props} />],
  [
    T,
    (props: BuilderTeaserSlotsBlockProps) => (
      <div>
        ReflektTeaserSlotsBlock fallback - unknown TeaserSlots type. blockStyle:
        {props.blockStyle}
      </div>
    ),
  ],
]) as (props: BuilderTeaserSlotsBlockProps) => JSX.Element;
