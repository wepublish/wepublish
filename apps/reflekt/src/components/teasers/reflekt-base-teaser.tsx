import { BuilderTeaserProps } from '@wepublish/website/builder';
import { cond, T } from 'ramda';

import { isTeaserCredits, TeaserCredits } from './teaser-credits';
import { isTeaserMoreAbout, TeaserMoreAbout } from './teaser-more-about';
import { isTeaserNews, TeaserNews } from './teaser-news';
import { isTeaserRecherchen, TeaserRecherchen } from './teaser-recherchen';

export const ReflektBaseTeaser = cond([
  [isTeaserNews, props => <TeaserNews {...props} />],
  [isTeaserRecherchen, props => <TeaserRecherchen {...props} />],
  [isTeaserMoreAbout, props => <TeaserMoreAbout {...props} />],
  [isTeaserCredits, props => <TeaserCredits {...props} />],
  [T, props => <TeaserNews {...props} />], // default teaser
  [
    T,
    (props: BuilderTeaserProps) => (
      <div>
        ReflektTeaser fallback - unknown teaser type. blockStyle:
        {props.blockStyle}
      </div>
    ),
  ],
]);
