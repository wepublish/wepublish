import { BuilderTeaserProps } from '@wepublish/website/builder';
import { cond, T } from 'ramda';

import { isTeaserCredits, TeaserCredits } from './teaser-credits';
import { isTeaserLogoWall, TeaserLogoWall } from './teaser-logo-wall';
import { isTeaserMoreAbout, TeaserMoreAbout } from './teaser-more-about';
import { isTeaserNews, TeaserNews } from './teaser-news';
import { isTeaserRecherchen, TeaserRecherchen } from './teaser-recherchen';

export const ReflektBaseTeaser = cond([
  [
    isTeaserLogoWall,
    (props: BuilderTeaserProps) => <TeaserLogoWall {...props} />,
  ],
  [isTeaserNews, (props: BuilderTeaserProps) => <TeaserNews {...props} />],
  [
    isTeaserRecherchen,
    (props: BuilderTeaserProps) => <TeaserRecherchen {...props} />,
  ],
  [
    isTeaserMoreAbout,
    (props: BuilderTeaserProps) => <TeaserMoreAbout {...props} />,
  ],
  [
    isTeaserCredits,
    (props: BuilderTeaserProps) => <TeaserCredits {...props} />,
  ],
  [T, (props: BuilderTeaserProps) => <TeaserNews {...props} />],
  [
    T,
    (props: BuilderTeaserProps) => (
      <div>
        ReflektTeaser fallback - unknown teaser type. blockStyle:
        {props.blockStyle}
      </div>
    ),
  ],
]) as (props: BuilderTeaserProps) => JSX.Element;
