import { hasBlockStyle } from '@wepublish/block-content/website';
import { BuilderTeaserSlotsBlockProps } from '@wepublish/website/builder';
import { cond, T } from 'ramda';

import { BkaBlockStyle } from '../block-styles/bka-block-styles';
import { BkaArchiveTeaserSlots } from './bka-archive-teaser-slots';
import { BkaDefaultTeaserSlots } from './bka-default-teaser-slots';

export const isBkaArchivTeaserSlots = (props: BuilderTeaserSlotsBlockProps) =>
  hasBlockStyle(BkaBlockStyle.Archiv)(props);

export const BkaTeaserSlots = cond([
  [isBkaArchivTeaserSlots, props => <BkaArchiveTeaserSlots {...props} />],
  [T, props => <BkaDefaultTeaserSlots {...props} />],
]);
