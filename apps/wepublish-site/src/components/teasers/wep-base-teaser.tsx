import { BuilderTeaserProps } from '@wepublish/website/builder';
import { cond, T } from 'ramda';

import { isTeaserExpertise, TeaserExpertise } from './teaser-expertise';
import { isTeaserLogoWall, TeaserLogoWall } from './teaser-logo-wall';
import { isTeaserNews, TeaserNews } from './teaser-news';

export const WepBaseTeaser = cond([
  [
    isTeaserExpertise,
    (props: BuilderTeaserProps) => <TeaserExpertise {...props} />,
  ],
  [
    isTeaserLogoWall,
    (props: BuilderTeaserProps) => <TeaserLogoWall {...props} />,
  ],
  [isTeaserNews, (props: BuilderTeaserProps) => <TeaserNews {...props} />],
  [T, (props: BuilderTeaserProps) => <TeaserExpertise {...props} />], // default teaser
  [
    T,
    (props: BuilderTeaserProps) => (
      <div>
        WepTeaser fallback - unknown teaser type. blockStyle:
        {props.blockStyle}
      </div>
    ),
  ],
]) as (props: BuilderTeaserProps) => JSX.Element;
