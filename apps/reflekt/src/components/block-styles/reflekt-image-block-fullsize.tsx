import styled from '@emotion/styled';
import {
  ImageBlock,
  ImageBlockImage,
  ImageBlockInnerWrapper,
  isImageBlock,
} from '@wepublish/block-content/website';
import { hasBlockStyle } from '@wepublish/block-content/website';
import {
  BlockContent,
  ImageBlock as ImageBlockType,
} from '@wepublish/website/api';
import { allPass } from 'ramda';

import { ReflektBlockType } from './reflekt-block-styles';

export const isReflektImageBlockFullsize = (
  block: Pick<BlockContent, '__typename'>
): block is ImageBlockType => {
  const result = allPass([
    hasBlockStyle(ReflektBlockType.ImageFullsize),
    isImageBlock,
  ])(block);
  return result;
};

export const ReflektImageBlockFullsize = styled(ImageBlock)`
  ${ImageBlockInnerWrapper} {
    widht: 100%;
  }

  ${ImageBlockImage} {
    max-width: 100%;
    max-height: 100%;
    width: 100%;
    height: 100%;
    object-fit: cover;
    aspect-ratio: unset;
  }
`;
