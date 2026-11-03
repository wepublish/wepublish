import { CSSObject } from '@emotion/react';

import {
  focalPointPosition,
  ImageFocalPoint,
  ResolvedImageFit,
} from '../../../values/image-fit';

export const imageBlockFitStyles =
  (image: ImageFocalPoint | null) =>
  (fit: ResolvedImageFit | null): CSSObject =>
    fit ?
      {
        '& > div': { width: '100%', gridTemplateColumns: '100%' },
        '& img': {
          width: '100%',
          height: 'auto',
          aspectRatio: fit.ratio,
          objectFit: fit.objectFit,
          objectPosition: focalPointPosition(image),
        },
        '& figcaption': { width: 'auto', justifySelf: 'stretch' },
      }
    : {
        '& > div': { width: 'auto', gridTemplateColumns: 'auto' },
        '& img': { width: 'auto', aspectRatio: 'auto', objectFit: 'contain' },
      };
