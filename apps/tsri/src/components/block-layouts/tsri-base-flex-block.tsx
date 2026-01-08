import { isFlexBlock } from '@wepublish/block-content/website';
import { BuilderFlexBlockProps } from '@wepublish/website/builder';
import { cond, T } from 'ramda';

import { FlexBlockSmallRowGaps } from './flex-block-small-row-gaps';

console.log('TsriFlexBlock loaded');

export const TsriFlexBlock = cond([
  [
    isFlexBlock,
    (props: BuilderFlexBlockProps) => {
      console.log('Rendering TsriFlexBlock with FlexBlockSmallRowGaps', props);
      return <FlexBlockSmallRowGaps {...props} />;
    },
  ],
  [
    T,
    props => (
      <div>
        TsriFlexBlock fallback - unknown FlexBlock type. blockStyle:
        {props.blockStyle}
      </div>
    ),
  ],
]);
