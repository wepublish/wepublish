import { useApolloClient } from '@apollo/client/react';
import {
  FullImageFragment,
  ImageDocument,
  ImageQuery,
} from '@wepublish/website/api';
import { useEffect, useMemo, useState } from 'react';

export const useImagesById = (ids: Array<string | undefined>) => {
  const client = useApolloClient();
  const [imagesById, setImagesById] = useState<
    Record<string, FullImageFragment>
  >({});

  const imageIds = useMemo(
    () => [...new Set(ids.filter((id): id is string => !!id))],
    [ids]
  );

  useEffect(() => {
    let cancelled = false;

    Promise.all(
      imageIds.map(id =>
        client
          .query({
            query: ImageDocument,
            variables: { id },
          })
          .then(({ data }) => data?.image)
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

  return imagesById;
};
