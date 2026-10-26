import { PuckComponent } from '@puckeditor/core';
import { RichtextJSONDocument } from '@wepublish/richtext';
import {
  BuilderListicleBlockProps,
  ListicleBlock,
} from '@wepublish/website/builder';
import { useMemo } from 'react';

import { useImagesById } from '../use-images-by-id';

export type ListicleConfigProps = Omit<BuilderListicleBlockProps, 'items'> & {
  items: Array<{
    title: string;
    richText: RichtextJSONDocument;
    imageId?: string;
  }>;
};

export const ListicleRender: PuckComponent<ListicleConfigProps> = ({
  items,
  ...props
}) => {
  const imagesById = useImagesById(
    useMemo(() => items.map(({ imageId }) => imageId), [items])
  );

  const listicleItems = useMemo(
    () =>
      items.map(({ title, richText, imageId }) => ({
        __typename: 'ListicleItem' as const,
        title,
        richText,
        image: imageId ? (imagesById[imageId] ?? null) : null,
      })),
    [items, imagesById]
  );

  return (
    <ListicleBlock
      {...props}
      items={listicleItems}
    />
  );
};
