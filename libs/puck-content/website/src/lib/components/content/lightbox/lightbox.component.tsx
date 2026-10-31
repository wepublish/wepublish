import { BuilderBlockStyleProps, Lightbox } from '@wepublish/website/builder';

import { PuckBlockComponent } from '../../../blocks/block.types';
import { dataImageById } from '../data-images';

export type LightboxConfigProps = {
  images: Array<{ imageId?: string; caption?: string }>;
};

export type LightboxExtra = {
  refs: NonNullable<BuilderBlockStyleProps['Lightbox']['refs']>;
};

export const LightboxRender: PuckBlockComponent<
  LightboxConfigProps,
  LightboxExtra
> = ({ props: { images }, data, className, refs }) => (
  <Lightbox
    className={className}
    refs={refs}
    images={images.map(({ imageId, caption }) => ({
      __typename: 'ImageGalleryImage' as const,
      caption: caption ?? null,
      image: dataImageById(data, imageId),
    }))}
  />
);
