import { BuilderTeaserProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { TsriTeaserTypes } from './tsri-base-teaser';

export const isTeaserMoreAbout = allPass([
  ({ blockStyle }: BuilderTeaserProps) => {
    return blockStyle === TsriTeaserTypes.MoreAbout;
  },
]);

export const TeaserMoreAbout = (props: BuilderTeaserProps) => {
  return <div>Teaser More About Placeholder</div>;
};
