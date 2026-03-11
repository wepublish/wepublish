import { FlexBlock, isFlexBlock } from '@wepublish/block-content/website';
import { BuilderFlexBlockProps } from '@wepublish/website/builder';
import { cond, T } from 'ramda';

import { FlexBlockHero, isFlexBlockHero } from './flex-block-hero';

export const ReflektFlexBlock = cond([
  [
    isFlexBlockHero,
    (props: BuilderFlexBlockProps) => <FlexBlockHero {...props} />,
  ],
  [isFlexBlock, (props: BuilderFlexBlockProps) => <FlexBlock {...props} />],
  [
    T,
    props => (
      <div>
        ReflektFlexBlock fallback - unknown FlexBlock type. blockStyle:
        {props.blockStyle}
      </div>
    ),
  ],
]);
