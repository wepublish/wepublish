import { TeaserSlotsBlock } from '@wepublish/block-content/website';
import { BuilderTeaserSlotsBlockProps } from '@wepublish/website/builder';
import { cond, T } from 'ramda';

import { EventList, isEventList } from '../event-list/event-list';
import { HeroLinks, isHeroLinks } from '../hero/hero-links';
import { isLatestNews, LatestNews } from '../latest-news/latest-news';
import { isLogoBand, LogoBand } from '../logo-band/logo-band';
import { isNetworkNews, NetworkNews } from '../network-news/network-news';
import { isOffers, Offers } from '../offers/offers';
import { isTeaserCards, TeaserCards } from '../teaser-cards/teaser-cards';
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
    isHeroLinks,
    (props: BuilderTeaserSlotsBlockProps) => <HeroLinks {...props} />,
  ],
  [isOffers, (props: BuilderTeaserSlotsBlockProps) => <Offers {...props} />],
  [
    isEventList,
    (props: BuilderTeaserSlotsBlockProps) => <EventList {...props} />,
  ],
  [
    isNetworkNews,
    (props: BuilderTeaserSlotsBlockProps) => <NetworkNews {...props} />,
  ],
  [
    isLatestNews,
    (props: BuilderTeaserSlotsBlockProps) => <LatestNews {...props} />,
  ],
  [
    isTeaserCards,
    (props: BuilderTeaserSlotsBlockProps) => <TeaserCards {...props} />,
  ],
  [
    isLogoBand,
    (props: BuilderTeaserSlotsBlockProps) => <LogoBand {...props} />,
  ],
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
]);
