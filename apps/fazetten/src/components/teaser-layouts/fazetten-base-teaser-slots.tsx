import { TeaserSlotsBlock } from '@wepublish/block-content/website';
import { BuilderTeaserSlotsBlockProps } from '@wepublish/website/builder';
import { cond, T } from 'ramda';

import {
  isTeaserSlotsLogoWall,
  TeaserSlotsLogoWall,
} from './teaser-slots-logo-wall';

export const FazettenBaseTeaserSlots = cond([
  [
    isTeaserSlotsLogoWall,
    (props: BuilderTeaserSlotsBlockProps) => <TeaserSlotsLogoWall {...props} />,
  ],
  [T, (props: BuilderTeaserSlotsBlockProps) => <TeaserSlotsBlock {...props} />],
  [
    T,
    (props: BuilderTeaserSlotsBlockProps) => (
      <div>
        FazettenTeaserSlotsBlock fallback - unknown TeaserSlots type.
        blockStyle:
        {props.blockStyle}
      </div>
    ),
  ],
]) as (props: BuilderTeaserSlotsBlockProps) => JSX.Element;
