import styled from '@emotion/styled';
import { ImageBlock, ImageBlockImage } from '@wepublish/block-content/website';

export const ReflektImageBlock = styled(ImageBlock)`
  ${ImageBlockImage} {
    object-fit: cover;
    max-height: 100%;
  }
`;
