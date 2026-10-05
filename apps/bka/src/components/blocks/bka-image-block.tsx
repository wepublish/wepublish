import styled from '@emotion/styled';
import {
  ImageBlock,
  ImageBlockCaption,
  ImageBlockImage,
  ImageBlockSource,
} from '@wepublish/block-content/website';

export const BkaImageBlock = styled(ImageBlock)`
  margin-inline: -${({ theme }) => theme.spacing(3)};

  ${ImageBlockImage} {
    width: 100%;
    height: auto;
    aspect-ratio: 3 / 2;
    object-fit: cover;
  }

  ${ImageBlockCaption} {
    margin-top: ${({ theme }) => theme.spacing(1)};
    font-size: ${({ theme }) => theme.typography.caption.fontSize};
    line-height: 1.25;
  }

  ${ImageBlockSource} {
    display: none;
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    margin-inline: 0;
  }
`;
