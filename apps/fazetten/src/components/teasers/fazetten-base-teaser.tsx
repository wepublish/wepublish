import { BaseTeaser } from '@wepublish/block-content/website';
import { BuilderTeaserProps } from '@wepublish/website/builder';
import { cond, T } from 'ramda';

import { isTeaserLogoWall, TeaserLogoWall } from './teaser-logo-wall';

export const FazettenBaseTeaser = cond([
  [
    isTeaserLogoWall,
    (props: BuilderTeaserProps) => <TeaserLogoWall {...props} />,
  ],
  [T, (props: BuilderTeaserProps) => <BaseTeaser {...props} />],
  [
    T,
    (props: BuilderTeaserProps) => (
      <div>
        FazettenTeaser fallback - unknown teaser type. blockStyle:
        {props.blockStyle}
      </div>
    ),
  ],
]) as (props: BuilderTeaserProps) => JSX.Element;
