import { cond, T } from 'ramda';
import { isAlternatingTeaser } from './block-styles/alternating/is-alternating';
import { AlternatingTeaser, BaseTeaser } from '@wepublish/website/builder';

export const Teaser = cond([
  [isAlternatingTeaser, props => <AlternatingTeaser {...props} />],
  [T, props => <BaseTeaser {...props} />],
]);
