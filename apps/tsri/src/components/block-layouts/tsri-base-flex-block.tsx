import { isFlexBlock } from '@wepublish/block-content/website';
import { BuilderFlexBlockProps } from '@wepublish/website/builder';
import { cond, T } from 'ramda';

import { FlexBlockSmallRowGaps } from './flex-block-small-row-gaps';
import {
  FlexBlockSmallRowGapsWithShortNews,
  isFlexBlockSmallRowGapsWithShortNews,
} from './flex-block-small-row-gaps-with-short-news';

export const TsriFlexBlock = cond([
  [
    isFlexBlockSmallRowGapsWithShortNews,
    (props: BuilderFlexBlockProps) => (
      <FlexBlockSmallRowGapsWithShortNews {...props} />
    ),
  ],
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
