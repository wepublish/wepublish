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
  [
    isTextWithImageBreakBlock,
    (props: BuilderBreakBlockProps) => <TextWithImageBreakBlock {...props} />,
  ],
  [
    isTextWithImageAltColorBreakBlock,
    (props: BuilderBreakBlockProps) => (
      <TextWithImageAltColorBreakBlock {...props} />
    ),
  ],
  [
    isImageWithTextBreakBlock,
    (props: BuilderBreakBlockProps) => <ImageWithTextBreakBlock {...props} />,
  ],
  [
    isImageWithTextAltColorBreakBlock,
    (props: BuilderBreakBlockProps) => (
      <ImageWithTextAltColorBreakBlock {...props} />
    ),
  ],
  [
    isTeamBreakBlock,
    (props: BuilderBreakBlockProps) => <TeamBreakBlock {...props} />,
  ],
  [T, (props: BuilderBreakBlockProps) => <BreakBlock {...props} />],
  [
    T,
    (props: BuilderBreakBlockProps) => (
      <div>
        ReflektBreakBlock fallback - unknown BreakBlock type. blockStyle:
        {props.blockStyle}
      </div>
    ),
  ],
]) as (props: BuilderBreakBlockProps) => JSX.Element;
