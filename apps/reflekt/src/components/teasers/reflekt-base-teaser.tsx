import { BuilderTeaserProps } from '@wepublish/website/builder';
import { cond, T } from 'ramda';

import { isTeaserMoreAbout, TeaserMoreAbout } from './teaser-more-about';
import { isTeaserNews, TeaserNews } from './teaser-news';
import { isTeaserResearch, TeaserResearch } from './teaser-research';

export const ReflektBaseTeaser = cond([
  [isTeaserNews, props => <TeaserNews {...props} />],
  [isTeaserResearch, props => <TeaserResearch {...props} />],
  [isTeaserMoreAbout, props => <TeaserMoreAbout {...props} />],
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
