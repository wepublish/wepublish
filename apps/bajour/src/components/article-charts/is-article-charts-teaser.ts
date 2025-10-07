import { BuilderTeaserProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

export const isArticleChartsTeaser = allPass([
  ({ teaser }: BuilderTeaserProps) => teaser?.__typename === 'CustomTeaser',
  ({ teaser }: BuilderTeaserProps) => teaser?.preTitle === 'article-charts',
]);
