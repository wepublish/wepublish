import { CSSObject } from '@emotion/react';

import {
  focalPointPosition,
  ImageFocalPoint,
  ResolvedImageFit,
} from '../../../values/image-fit';

export const lightboxFitStyles =
  (images: (ImageFocalPoint | null)[]) =>
  (fit: ResolvedImageFit | null): CSSObject =>
    fit ?
      {
        '&& figure > div::before': { height: 'auto', aspectRatio: fit.ratio },
        '&& img': {
          width: '100%',
          height: '100%',
          objectFit: fit.objectFit,
        },
        ...Object.fromEntries(
          images.map((image, index) => [
            `&& .keen-slider__slide:nth-of-type(${index + 1}) img`,
            { objectPosition: focalPointPosition(image) },
          ])
        ),
      }
    : {
        '&& figure > div::before': {
          height: 'var(--lightbox-image-height)',
          aspectRatio: 'var(--lightbox-image-aspect-ratio)',
        },
        '&& img': { width: 'auto', height: '100%', objectFit: 'cover' },
      };
