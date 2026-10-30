import { allPass } from 'ramda';

import {
  FullBlockFragment,
  FullImageGalleryBlockFragment,
} from '@wepublish/website/api';
import { hasBlockStyle } from '../../has-blockstyle';
import { isImageGalleryBlock } from '../../image-gallery/image-gallery-block';

export const isLightboxBlockStyle = (
  block: Partial<Pick<FullBlockFragment, '__typename'>>
): block is FullImageGalleryBlockFragment =>
  allPass([hasBlockStyle('Lightbox'), isImageGalleryBlock])(block);
