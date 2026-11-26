import { BuilderTeaserProps } from '@wepublish/website/builder';
import { cond, T } from 'ramda';

import { HeroLink, isHeroLinks } from '../hero/hero-links';
import { isTeaserCards, TeaserCard } from '../teaser-cards/teaser-cards';
import { isTeaserExpertise, TeaserExpertise } from './teaser-expertise';
import { isTeaserLogoWall, TeaserLogoWall } from './teaser-logo-wall';
import { isTeaserNews, TeaserNews } from './teaser-news';
import { isTeaserServices, TeaserServices } from './teaser-services';

export const WepBaseTeaser = cond([
  [isHeroLinks, (props: BuilderTeaserProps) => <HeroLink {...props} />],
  [isTeaserCards, (props: BuilderTeaserProps) => <TeaserCard {...props} />],
  [
    isTeaserExpertise,
    (props: BuilderTeaserProps) => <TeaserExpertise {...props} />,
  ],
  [
    isTeaserServices,
    (props: BuilderTeaserProps) => <TeaserServices {...props} />,
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
]);
