import { BuilderImageBlockProps, ImageBlock } from '@wepublish/website/builder';

import { PuckBlockComponent } from '../../../blocks/block.types';
import { firstDataImage } from '../data-images';

export type ImageConfigProps = Omit<
  BuilderImageBlockProps,
  'image' | 'className'
>;

export const ImageRender: PuckBlockComponent<ImageConfigProps> = ({
  props,
  data,
  className,
}) => (
  <ImageBlock
    {...props}
    image={firstDataImage(data)}
    className={className}
  />
);
