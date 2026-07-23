import { TeaserGridFlexBlock } from '@wepublish/block-content/website';
import { BuilderTeaserGridFlexBlockProps } from '@wepublish/website/builder';
import { cond, T } from 'ramda';

import { GridFlexLogoWall, isGridFlexLogoWall } from './grid-flex-logo-wall';

export const ReflektBaseGridFlex = cond([
  [
    isGridFlexLogoWall,
    (props: BuilderTeaserGridFlexBlockProps) => <GridFlexLogoWall {...props} />,
  ],
  [
    T,
    (props: BuilderTeaserGridFlexBlockProps) => (
      <TeaserGridFlexBlock {...props} />
    ),
  ],
  [
    T,
    (props: BuilderTeaserGridFlexBlockProps) => (
      <div>
        ReflektBaseGridFlex fallback - unknown GridFlex type. blockStyle:
        {props.blockStyle}
      </div>
    ),
  ],
]) as (props: BuilderTeaserGridFlexBlockProps) => JSX.Element;
