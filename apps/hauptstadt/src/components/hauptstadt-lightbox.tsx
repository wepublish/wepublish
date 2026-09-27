import styled from '@emotion/styled';
import { Lightbox } from '@wepublish/block-content/website';

export const HauptstadtLightbox = styled(Lightbox)`
  &:not([data-fullscreen='true']) {
    --lightbox-image-height: auto;
    --lightbox-image-aspect-ratio: 4 / 3;
  }
`;
