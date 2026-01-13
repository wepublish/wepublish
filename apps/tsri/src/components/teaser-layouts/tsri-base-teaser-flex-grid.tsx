import { TeaserGridFlexBlock } from '@wepublish/block-content/website';
import { BuilderTeaserGridFlexBlockProps } from '@wepublish/website/builder';
import { cond, T } from 'ramda';

export const TsriBaseTeaserGridFlex = cond([
  [
    T,
    (props: BuilderTeaserGridFlexBlockProps) => (
      <TeaserGridFlexBlock {...props} />
    ),
  ],
]);
