import { cond, T } from 'ramda';

import {
  isTeaserFullsizeImage,
  TeaserFullsizeImage,
} from './teaser-fullsize-image';
import { isTeaserHeroTeaser, TeaserHeroTeaser } from './teaser-hero-teaser';
import { isTeaserMoreAbout, TeaserMoreAbout } from './teaser-more-about';
import { isTeaserNoImage, TeaserNoImage } from './teaser-no-image';
import {
  isTeaserNoImageAltColor,
  TeaserNoImageAltColor,
} from './teaser-no-image-alt-color';
import {
  DailyBriefingTeaser,
  isDailyBriefingTeaser,
} from './teaser-sidebar-daily-briefing';
import {
  isTeaserFocusMonth,
  TeaserFocusMonth,
} from './teaser-sidebar-focus-month';
import {
  isTeaserShopProducts,
  TeaserShopProducts,
} from './teaser-sidebar-shop-products';
import { isTeaserTsriLove, TeaserTsriLove } from './teaser-sidebar-tsri-love';
import { isTeaserTopicMeta, TeaserTopicMeta } from './teaser-topic-meta';
import { isTeaserTwoCol, TeaserTwoCol } from './teaser-two-col';
import {
  isTeaserTwoColAltColor,
  TeaserTwoColAltColor,
} from './teaser-two-col-alt-color';
import {
  isTeaserTwoColAuthor,
  TeaserTwoColAuthor,
} from './teaser-two-col-author';
import { isTeaserTwoRow, TeaserTwoRow } from './teaser-two-row';
import {
  isTeaserTwoRowAuthor,
  TeaserTwoRowAuthor,
} from './teaser-two-row-author';

export enum TsriTeaserType {
  DailyBriefing = 'DailyBriefing',
  FullsizeImage = 'FullsizeImage',
  MoreAbout = 'MoreAbout',
  TopicMeta = 'TopicMeta',
  NoImage = 'NoImage',
  NoImageAltColor = 'NoImageAltColor',
  TwoColAuthor = 'TwoColAuthor',
  TwoCol = 'TwoCol',
  TwoColAltColor = 'TwoColAltColor',
  TwoRowAuthor = 'TwoRowAuthor',
  TwoRow = 'TwoRow',
  HeroTeaser = 'HeroTeaser',
  Default = 'TsriTeaser',
  FocusMonth = 'FocusMonth',
  ShopProducts = 'ShopProducts',
  TsriLove = 'TsriLove',
}

export const TsriBaseTeaser = cond([
  [isTeaserTsriLove, props => <TeaserTsriLove {...props} />],
  [isTeaserShopProducts, props => <TeaserShopProducts {...props} />],
  [isTeaserFocusMonth, props => <TeaserFocusMonth {...props} />],
  [isTeaserHeroTeaser, props => <TeaserHeroTeaser {...props} />],
  [isTeaserFullsizeImage, props => <TeaserFullsizeImage {...props} />],
  [isTeaserNoImage, props => <TeaserNoImage {...props} />],
  [isTeaserNoImageAltColor, props => <TeaserNoImageAltColor {...props} />],
  [isTeaserTopicMeta, props => <TeaserTopicMeta {...props} />],
  [isTeaserMoreAbout, props => <TeaserMoreAbout {...props} />],
  [isTeaserTwoRow, props => <TeaserTwoRow {...props} />],
  [isTeaserTwoCol, props => <TeaserTwoCol {...props} />],
  [isTeaserTwoColAuthor, props => <TeaserTwoColAuthor {...props} />],
  [isTeaserTwoColAltColor, props => <TeaserTwoColAltColor {...props} />],
  [isTeaserTwoRowAuthor, props => <TeaserTwoRowAuthor {...props} />],
  [isDailyBriefingTeaser, props => <DailyBriefingTeaser {...props} />],
  [T, props => <TeaserFullsizeImage {...props} />], // default teaser
  [
    T,
    props => (
      <div>
        TsriTeaser fallback - unknown teaser type. blockStyle:
        {props.blockStyle}
      </div>
    ),
  ],
]);
