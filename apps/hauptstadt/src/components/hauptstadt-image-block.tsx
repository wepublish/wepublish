import styled from '@emotion/styled';
import {
  ImageBlock,
  ImageBlockSource,
  ImageGalleryBlock,
} from '@wepublish/block-content/website';

export const HauptstadtImageBlock = styled(ImageBlock)`
  ${ImageBlockSource} {
    font-weight: 200;
  }
`;

export const HauptstadtImageGalleryBlock = styled(ImageGalleryBlock)`
  ${ImageBlockSource} {
    font-weight: 200;
  }
`;
