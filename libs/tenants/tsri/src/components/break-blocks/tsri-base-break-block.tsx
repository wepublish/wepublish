import { BreakBlock } from '@wepublish/block-content/website';
import { cond, T } from 'ramda';

import {
  isTsriAttentionCatcher,
  TsriAttentionCatcher,
} from './tsri-attention-catcher';

export { TsriBreakBlockType } from './tsri-break-block-type';

export const TsriBreakBlock = cond([
  [isTsriAttentionCatcher, props => <TsriAttentionCatcher {...props} />],
  [T, props => <BreakBlock {...props} />],
]);
