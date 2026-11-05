import { cond, T } from 'ramda';

import { AdTeaser, isAdTeaser } from './custom-teasers/ad';
import {
  HotAndTrendingTeaser,
  isHotAndTrendingTeaser,
} from './custom-teasers/hot-and-trending';
import { MannschaftBaseTeaser } from './mannschaft-base-teaser';

export const MannschaftTeaser = cond([
  [isHotAndTrendingTeaser, props => <HotAndTrendingTeaser {...props} />],
  [isAdTeaser, props => <AdTeaser {...props} />],
  [T, props => <MannschaftBaseTeaser {...props} />],
]);
