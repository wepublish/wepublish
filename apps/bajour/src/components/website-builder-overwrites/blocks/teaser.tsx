import { Teaser } from '@wepublish/block-content/website';
import {
  DailyBriefingTeaser,
  isDailyBriefingTeaser,
} from '@wepublish/utils/website';
import { cond, T } from 'ramda';

import { ArticleCharts } from '../../article-charts/article-charts';
import { isArticleChartsTeaser } from '../../article-charts/is-article-charts-teaser';
import { ColTeaser } from './col-teaser';
import { SingleTeaser } from './single-teaser';

export const BajourTeaser = cond([
  [isDailyBriefingTeaser, props => <DailyBriefingTeaser {...props} />],
  [isArticleChartsTeaser, props => <ArticleCharts />],
  [props => !props.numColumns, props => <Teaser {...props} />],
  [props => props.numColumns === 1, props => <SingleTeaser {...props} />],
  [T, props => <ColTeaser {...props} />],
]);
