import { BreakBlock } from '@wepublish/block-content/website';
import { cond, T } from 'ramda';

import {
  isTsriAttentionCatcher,
  TsriAttentionCatcher,
} from './tsri-attention-catcher';

export enum TsriBreakBlockType {
  SidebarContent = 'SB_SidebarContent', // handled by TsriBlockRenderer
  ContextBox = 'ContextBox', // handled "globally" by BlockRenderer
  AttentionCatcher = 'AttentionCatcher',
}

export const TsriBreakBlock = cond([
  [isTsriAttentionCatcher, props => <TsriAttentionCatcher {...props} />],
  [T, props => <BreakBlock {...props} />],
]);
