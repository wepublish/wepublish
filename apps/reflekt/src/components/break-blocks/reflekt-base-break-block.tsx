import { BreakBlock } from '@wepublish/block-content/website';
import { BuilderBreakBlockProps } from '@wepublish/website/builder';
import { cond, T } from 'ramda';

import {
  ImageWithTextBreakBlock,
  isImageWithTextBreakBlock,
} from './image-with-text';
import {
  ImageWithTextAltColorBreakBlock,
  isImageWithTextAltColorBreakBlock,
} from './image-with-text-alt-color';
import { isTeamBreakBlock, TeamBreakBlock } from './team';
import {
  isTextWithImageBreakBlock,
  TextWithImageBreakBlock,
} from './text-with-image';
import {
  isTextWithImageAltColorBreakBlock,
  TextWithImageAltColorBreakBlock,
} from './text-with-image-alt-color';

export const ReflektBaseBreakBlock = cond([
  [isTextWithImageBreakBlock, props => <TextWithImageBreakBlock {...props} />],
  [
    isTextWithImageAltColorBreakBlock,
    props => <TextWithImageAltColorBreakBlock {...props} />,
  ],
  [isImageWithTextBreakBlock, props => <ImageWithTextBreakBlock {...props} />],
  [
    isImageWithTextAltColorBreakBlock,
    props => <ImageWithTextAltColorBreakBlock {...props} />,
  ],
  [isTeamBreakBlock, props => <TeamBreakBlock {...props} />],
  [T, props => <BreakBlock {...props} />], // default break-block
  [
    T,
    (props: BuilderBreakBlockProps) => (
      <div>
        ReflektBreakBlock fallback - unknown BreakBlock type. blockStyle:
        {props.blockStyle}
      </div>
    ),
  ],
]);
