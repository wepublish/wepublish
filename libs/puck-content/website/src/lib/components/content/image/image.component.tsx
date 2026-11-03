import { Theme } from '@emotion/react';
import { BuilderImageBlockProps, ImageBlock } from '@wepublish/website/builder';

import { PuckBlockComponent } from '../../../blocks/block.types';
import { ImageFit, imageFitStyles } from '../../../values/image-fit';
import { firstDataImage, withoutImageCredit } from '../data-images';
import { imageBlockFitStyles } from './image.styles';

export type ImageConfigProps = Omit<
  BuilderImageBlockProps,
  'image' | 'className'
> & {
  hideCaption?: boolean;
  fit?: ImageFit;
};

export const ImageRender: PuckBlockComponent<ImageConfigProps> = ({
  props: { hideCaption, fit, caption, ...props },
  data,
  className,
}) => {
  const image = firstDataImage(data);

  return (
    <ImageBlock
      {...props}
      caption={hideCaption ? null : caption}
      image={hideCaption ? withoutImageCredit(image) : image}
      className={className}
      css={(theme: Theme) =>
        imageFitStyles(theme, fit, imageBlockFitStyles(image))
      }
    />
  );
};
