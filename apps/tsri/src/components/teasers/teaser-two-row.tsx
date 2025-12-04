import { BuilderTeaserProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { TsriTeaserTypes } from './tsri-base-teaser';

export const isTeaserTwoRow = allPass([
  ({ blockStyle }: BuilderTeaserProps) => {
    return blockStyle === TsriTeaserTypes.TwoRow;
  },
]);

export const TeaserTwoRow = (props: BuilderTeaserProps) => {
  return <div>Teaser Two Row Placeholder</div>;
};
