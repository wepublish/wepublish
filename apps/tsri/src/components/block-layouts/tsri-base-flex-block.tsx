import { isFlexBlock } from '@wepublish/block-content/website';
import { BuilderFlexBlockProps } from '@wepublish/website/builder';
import { cond, T } from 'ramda';

import { FlexBlockSmallRowGaps } from './flex-block-small-row-gaps';

export const TsriFlexBlock = cond([
  [
    isFlexBlock,
    (props: BuilderFlexBlockProps) => <FlexBlockSmallRowGaps {...props} />,
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
