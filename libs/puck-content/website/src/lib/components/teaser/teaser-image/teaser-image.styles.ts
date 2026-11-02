import { CSSObject } from '@emotion/react';
import styled from '@emotion/styled';

import {
  focalPointPosition,
  ImageFocalPoint,
  ResolvedImageFit,
} from '../../../values/image-fit';

export const TeaserImagePlaceholder = styled('div')`
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: ${({ theme }) => theme.palette.grey[200]};
`;

export const teaserImagePlaceholderFitStyles = (
  fit: ResolvedImageFit | null
): CSSObject => ({ aspectRatio: fit?.ratio ?? '16 / 9' });

export const teaserImageFitStyles =
  (image: ImageFocalPoint) =>
  (fit: ResolvedImageFit | null): CSSObject =>
    fit ?
      {
        width: '100%',
        height: 'auto',
        aspectRatio: fit.ratio,
        objectFit: fit.objectFit,
        objectPosition: focalPointPosition(image),
      }
    : { width: 'auto', aspectRatio: 'auto', objectFit: 'contain' };
