import { allPass } from 'ramda';

import {
  BlockContent,
  FullImageGalleryBlockFragment,
} from '@wepublish/website/api';
import { hasBlockStyle } from '../../has-blockstyle';
import { isImageGalleryBlock } from '../../image-gallery/image-gallery-block';

export const isLightboxBlockStyle = (
  block: Pick<BlockContent, '__typename'>
): block is FullImageGalleryBlockFragment =>
  allPass([hasBlockStyle('Lightbox'), isImageGalleryBlock])(block);
