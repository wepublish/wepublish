import { Theme } from '@emotion/react';
import { BuilderBlockStyleProps, Lightbox } from '@wepublish/website/builder';

import { PuckBlockComponent } from '../../../blocks/block.types';
import { ImageFit, imageFitStyles } from '../../../values/image-fit';
import { dataImageById, withoutImageCredit } from '../data-images';
import { lightboxFitStyles } from './lightbox.styles';

export type LightboxConfigProps = {
  images: Array<{ imageId?: string; caption?: string }>;
  hideCaption?: boolean;
  fit?: ImageFit;
};

export type LightboxExtra = {
  refs: NonNullable<BuilderBlockStyleProps['Lightbox']['refs']>;
};

export const LightboxRender: PuckBlockComponent<
  LightboxConfigProps,
  LightboxExtra
> = ({ props: { images, hideCaption, fit }, data, className, refs }) => {
  const galleryImages = images.map(({ imageId, caption }) => {
    const image = dataImageById(data, imageId);

    return {
      __typename: 'ImageGalleryImage' as const,
      caption: hideCaption ? null : (caption ?? null),
      image: hideCaption ? withoutImageCredit(image) : image,
    };
  });

  return (
    <Lightbox
      className={className}
      refs={refs}
      images={galleryImages}
      css={(theme: Theme) =>
        imageFitStyles(
          theme,
          fit,
          lightboxFitStyles(galleryImages.map(({ image }) => image))
        )
      }
    />
  );
};
