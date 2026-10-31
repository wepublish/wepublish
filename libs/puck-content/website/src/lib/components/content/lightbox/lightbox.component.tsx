import { PuckComponent, registerOverlayPortal } from '@puckeditor/core';
import { Lightbox } from '@wepublish/website/builder';
import { useMemo } from 'react';

import { useImagesById } from '../use-images-by-id';

export type LightboxConfigProps = {
  images: Array<{ imageId?: string; caption?: string }>;
};

export const LightboxRender: PuckComponent<LightboxConfigProps> = ({
  images,
  ...props
}) => {
  const imagesById = useImagesById(
    useMemo(() => images.map(({ imageId }) => imageId), [images])
  );

  const galleryImages = useMemo(
    () =>
      images.map(({ imageId, caption }) => ({
        __typename: 'ImageGalleryImage' as const,
        caption: caption ?? null,
        image: imageId ? (imagesById[imageId] ?? null) : null,
      })),
    [images, imagesById]
  );

  return (
    <Lightbox
      {...props}
      images={galleryImages}
      refs={{
        fullscreen: registerOverlayPortal,
        prev: registerOverlayPortal,
        next: registerOverlayPortal,
      }}
    />
  );
};
