import { cond, T } from 'ramda';

import { isDailyBriefingTeaser } from './daily-briefing-teaser';
import {
  isTeaserFullsizeImage,
  TeaserFullsizeImage,
} from './teaser-fullsize-image';
import { isTeaserMoreAbout, TeaserMoreAbout } from './teaser-more-about';
import { isTeaserNoImage, TeaserNoImage } from './teaser-no-image';
import {
  isTeaserNoImageAltColor,
  TeaserNoImageAltColor,
} from './teaser-no-image-alt-color';
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
import { TsriTeaser } from './tsri-teaser';

export enum TsriTeaserType {
  DailyBriefing = 'DailyBriefing',
  FullsizeImage = 'FullsizeImage',
  MoreAbout = 'MoreAbout',
  NoImage = 'NoImage',
  NoImageAltColor = 'NoImageAltColor',
  TwoColAuthor = 'TwoColAuthor',
  TwoCol = 'TwoCol',
  TwoColAltColor = 'TwoColAltColor',
  TwoRowAuthor = 'TwoRowAuthor',
  TwoRow = 'TwoRow',
  Default = 'TsriTeaser',
}

export const TsriBaseTeaser = cond([
  //[isDailyBriefingTeaser, props => <DailyBriefingTeaser {...props} />],
  [isTeaserFullsizeImage, props => <TeaserFullsizeImage {...props} />],
  [isTeaserNoImage, props => <TeaserNoImage {...props} />],
  [isTeaserNoImageAltColor, props => <TeaserNoImageAltColor {...props} />],
  [isTeaserMoreAbout, props => <TeaserMoreAbout {...props} />],
  [isTeaserTwoRow, props => <TeaserTwoRow {...props} />],
  [isTeaserTwoCol, props => <TeaserTwoCol {...props} />],
  [isTeaserTwoColAuthor, props => <TeaserTwoColAuthor {...props} />],
  [isTeaserTwoColAltColor, props => <TeaserTwoColAltColor {...props} />],
  [isTeaserTwoRowAuthor, props => <TeaserTwoRowAuthor {...props} />],
  [isDailyBriefingTeaser, props => <></>],
  [T, props => <TsriTeaser {...props} />],
]);
