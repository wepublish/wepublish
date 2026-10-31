import { BreakBlock, BuilderBreakBlockProps } from '@wepublish/website/builder';

import { PuckBlockComponent } from '../../blocks/block.types';
import { firstDataImage } from '../content/data-images';

export type BreakConfigProps = Omit<
  BuilderBreakBlockProps,
  'image' | 'refs' | 'className'
>;

export type BreakExtra = {
  refs: NonNullable<BuilderBreakBlockProps['refs']>;
};

export const BreakRender: PuckBlockComponent<BreakConfigProps, BreakExtra> = ({
  props,
  data,
  className,
  refs,
}) => (
  <BreakBlock
    {...props}
    image={firstDataImage(data)}
    refs={refs}
    className={className}
  />
);
