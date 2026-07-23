import { BaseTeaser } from '@wepublish/block-content/website';
import {
  DailyBriefingTeaser,
  isDailyBriefingTeaser,
} from '@wepublish/utils/website';
import { BuilderTeaserProps } from '@wepublish/website/builder';
import { cond, T } from 'ramda';

import { isTeaserLogoWall, TeaserLogoWall } from './teaser-logo-wall';

export const GanzGrazBaseTeaser = cond([
  [isDailyBriefingTeaser, props => <DailyBriefingTeaser {...props} />],
  [
    isTeaserLogoWall,
    (props: BuilderTeaserProps) => <TeaserLogoWall {...props} />,
  ],
  [T, (props: BuilderTeaserProps) => <BaseTeaser {...props} />],
]);
