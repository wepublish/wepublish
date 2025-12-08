import { cond, T } from 'ramda';

import { isDailyBriefingTeaser } from './daily-briefing-teaser';
import { isTeaserMoreAbout, TeaserMoreAbout } from './teaser-more-about';
import { isTeaserNoImage, TeaserNoImage } from './teaser-no-image';
import { isTeaserTwoCol, TeaserTwoCol } from './teaser-two-col';
import {
  isTeaserTwoColAuthor,
  TeaserTwoColAuthor,
} from './teaser-two-col-author';
import { isTeaserTwoRow, TeaserTwoRow } from './teaser-two-row';
import {
  isTeaserTwoRowAuthor,
  TeaserTwoRowAuthor,
} from './teaser-two-row-author';
import { TsriTeaser } from './tsri-teaser';

export enum TsriTeaserType {
  DailyBriefing = 'DailyBriefing',
  FullsizeImage = 'FullsizeImage',
  MoreAbout = 'MoreAbout',
  NoImage = 'NoImage',
  TwoColAuthor = 'TwoColAuthor',
  TwoCol = 'TwoCol',
  TwoRowAuthor = 'TwoRowAuthor',
  TwoRow = 'TwoRow',
  Default = 'TsriTeaser',
}

export const TsriBaseTeaser = cond([
  //[isDailyBriefingTeaser, props => <DailyBriefingTeaser {...props} />],
  [isTeaserNoImage, props => <TeaserNoImage {...props} />],
  [isTeaserMoreAbout, props => <TeaserMoreAbout {...props} />],
  [isTeaserTwoRow, props => <TeaserTwoRow {...props} />],
  [isTeaserTwoCol, props => <TeaserTwoCol {...props} />],
  [isTeaserTwoColAuthor, props => <TeaserTwoColAuthor {...props} />],
  [isTeaserTwoRowAuthor, props => <TeaserTwoRowAuthor {...props} />],
  [isDailyBriefingTeaser, props => <></>],
  [T, props => <TsriTeaser {...props} />],
]);
