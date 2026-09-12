import { Lightbox } from '@wepublish/website/builder';
import { useApolloClient } from '@apollo/client';
import { PuckComponent, registerOverlayPortal } from '@puckeditor/core';
import {
  FullImageFragment,
  ImageDocument,
  ImageQuery,
  ImageQueryVariables,
} from '@wepublish/website/api';
import { useEffect, useMemo, useState } from 'react';

export type LightboxConfigProps = {
  images: Array<{ imageId?: string; caption?: string }>;
};

export const LightboxRender: PuckComponent<LightboxConfigProps> = ({
  images,
  ...props
}) => {
  const client = useApolloClient();
  const [imagesById, setImagesById] = useState<
    Record<string, FullImageFragment>
  >({});

  const imageIds = useMemo(
    () => [
      ...new Set(
        images
          .map(({ imageId }) => imageId)
          .filter((imageId): imageId is string => !!imageId)
      ),
    ],
    [images]
  );

  useEffect(() => {
    let cancelled = false;

    Promise.all(
      imageIds.map(id =>
        client
          .query<ImageQuery, ImageQueryVariables>({
            query: ImageDocument,
            variables: { id },
          })
          .then(({ data }) => data.image)
          .catch(() => null)
      )
    ).then(resolvedImages => {
      if (cancelled) {
        return;
      }

      setImagesById(
        Object.fromEntries(
          resolvedImages
            .filter((image): image is ImageQuery['image'] => !!image)
            .map(image => [image.id, image])
        )
      );
    });

    return () => {
      cancelled = true;
    };
  }, [client, imageIds]);

  const galleryImages = useMemo(
    () =>
      images.map(({ imageId, caption }) => ({
        caption,
        image: imageId ? imagesById[imageId] : undefined,
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
