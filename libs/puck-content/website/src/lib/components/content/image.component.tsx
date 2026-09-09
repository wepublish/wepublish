import { PuckComponent } from '@puckeditor/core';
import { ImageBlock } from '@wepublish/block-content/website';
import { useImageQuery } from '@wepublish/website/api';
import { BuilderImageBlockProps } from '@wepublish/website/builder';

export type ImageConfigProps = BuilderImageBlockProps & { imageId?: string };

export const ImageRender: PuckComponent<ImageConfigProps> = ({
  imageId,
  ...props
}) => {
  const { data } = useImageQuery({
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
