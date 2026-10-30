import { useQuery } from '@apollo/client/react';
import { PuckComponent } from '@puckeditor/core';
import { ImageDocument } from '@wepublish/website/api';
import { BuilderImageBlockProps, ImageBlock } from '@wepublish/website/builder';

import { datasourceIds } from '@wepublish/puck-content/editor';
import { WithDataSource } from '../../with-datasource';

export type ImageConfigProps = WithDataSource<BuilderImageBlockProps>;

export const ImageRender: PuckComponent<ImageConfigProps> = ({
  datasources,
  ...props
}) => {
  const [imageId] = datasourceIds(datasources, 'image');
  const { data } = useQuery(ImageDocument, {
    variables: { id: imageId ?? '' },
    skip: !imageId,
  });

  return (
    <ImageBlock
      {...props}
      image={data?.image}
    />
  );
};
