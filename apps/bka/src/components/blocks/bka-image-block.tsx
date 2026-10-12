import styled from '@emotion/styled';
import {
  ImageBlock,
  ImageBlockCaption,
  ImageBlockImage,
  ImageBlockSource,
} from '@wepublish/block-content/website';

export const BkaImageBlock = styled(ImageBlock)`
  ${ImageBlockImage} {
    width: 100%;
    height: auto;
  }

  ${ImageBlockCaption} {
    margin-top: ${({ theme }) => theme.spacing(1)};
    font-size: ${({ theme }) => theme.typography.caption.fontSize};
    line-height: 1.25;
  }

  /* ${ImageBlockSource} {
    display: none;
  } */
`;
