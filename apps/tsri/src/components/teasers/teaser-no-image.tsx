import { BuilderTeaserProps } from '@wepublish/website/builder';
import { allPass } from 'ramda';

import { TsriTeaserTypes } from './tsri-base-teaser';

export const isTeaserNoImage = allPass([
  ({ blockStyle }: BuilderTeaserProps) => {
    return blockStyle === TsriTeaserTypes.NoImage;
  },
]);

export const TeaserNoImage = (props: BuilderTeaserProps) => {
  return <div>Teaser No Image Placeholder</div>;
};
