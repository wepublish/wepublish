import { hasBlockStyle } from '@wepublish/block-content/website';
import { BuilderTeaserProps } from '@wepublish/website/builder';
import { cond, T } from 'ramda';

import { BkaBlockStyle } from '../block-styles/bka-block-styles';
import { BkaImageTeaser } from './bka-image-teaser';
import { BkaTextTeaser } from './bka-text-teaser';

export const isBkaMagazinTeaser = (props: BuilderTeaserProps) =>
  hasBlockStyle(BkaBlockStyle.Magazin)(props);

export const isBkaEmpfehlungTeaser = (props: BuilderTeaserProps) =>
  hasBlockStyle(BkaBlockStyle.Empfehlung)(props);

export const BkaTeaser = cond([
  [isBkaMagazinTeaser, props => <BkaTextTeaser {...props} />],
  [isBkaEmpfehlungTeaser, props => <BkaImageTeaser {...props} />],
  [T, props => <BkaImageTeaser {...props} />],
]);
