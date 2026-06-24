import { TeaserSlotsBlock } from '@wepublish/block-content/website';
import { BuilderTeaserSlotsBlockProps } from '@wepublish/website/builder';
import { cond, T } from 'ramda';

import {
  isTeaserSlotsExpertise,
  TeaserSlotsExpertise,
} from './teaser-slots-expertise';
import {
  isTeaserSlotsLogoWall,
  TeaserSlotsLogoWall,
} from './teaser-slots-logo-wall';
import { isTeaserSlotsNews, TeaserSlotsNews } from './teaser-slots-news';
import {
  isTeaserSlotsServices,
  TeaserSlotsServices,
} from './teaser-slots-services';

export const WepBaseTeaserSlots = cond([
  [
    isTeaserSlotsExpertise,
    (props: BuilderTeaserSlotsBlockProps) => (
      <TeaserSlotsExpertise {...props} />
    ),
  ],
  [
    isTeaserSlotsServices,
    (props: BuilderTeaserSlotsBlockProps) => <TeaserSlotsServices {...props} />,
  ],
  [
    isTeaserSlotsNews,
    (props: BuilderTeaserSlotsBlockProps) => <TeaserSlotsNews {...props} />,
  ],
  [
    isTeaserSlotsLogoWall,
    (props: BuilderTeaserSlotsBlockProps) => <TeaserSlotsLogoWall {...props} />,
  ],
  [T, (props: BuilderTeaserSlotsBlockProps) => <TeaserSlotsBlock {...props} />], // default teaser-slots-block
  [
    T,
    (props: BuilderTeaserSlotsBlockProps) => (
      <div>
        WePublishTeaserSlotsBlock fallback - unknown TeaserSlots type.
        blockStyle:
        {props.blockStyle}
      </div>
    ),
  ],
]) as (props: BuilderTeaserSlotsBlockProps) => JSX.Element;
