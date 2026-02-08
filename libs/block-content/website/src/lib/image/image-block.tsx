import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import {
  BlockContent,
  ImageBlock as ImageBlockType,
} from '@wepublish/website/api';
import {
  BuilderImageBlockProps,
  Image,
  Link,
} from '@wepublish/website/builder';
import { useEffect, useRef, useState } from 'react';
import { Trans } from 'react-i18next';
import { getContainedImageSize } from './contained-image-size';

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLAttributes<T> {
    fetchPriority?: 'high' | 'low' | 'auto';
  }
}

export const isImageBlock = (
  block: Pick<BlockContent, '__typename'>
): block is ImageBlockType => block.__typename === 'ImageBlock';

export const ImageBlockWrapper = styled('figure')`
  margin: 0;
  display: grid;
  justify-items: center;
`;

export const ImageBlockInnerWrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
  grid-template-columns: auto;
`;

export const ImageBlockImage = styled(Image)`
  justify-self: center;
`;

export const ImageBlockCaption = styled('figcaption')`
  max-width: 100%;
`;

export const ImageBlockSource = styled('span')``;

export const ImageBlock = ({
  caption,
  linkUrl,
  image,
  className,
}: BuilderImageBlockProps) => {
  const [realImageWidth, setRealImageWidth] = useState<number>();
  const imageRef = useRef<HTMLImageElement>(null);
  const captionRef = useRef<HTMLElement>(null);
  const img = image && (
    <ImageBlockImage
      ref={imageRef}
      image={image}
      fetchPriority="high"
    />
  );

  useEffect(() => {
    const calcImageSize = () => {
      if (imageRef.current && captionRef.current) {
        captionRef.current.setAttribute('style', 'display: none;');
        const [newImageWidth] = getContainedImageSize(imageRef.current);

        if (realImageWidth !== newImageWidth) {
          setRealImageWidth(newImageWidth);
        }

        const parentWidth = imageRef.current.parentElement?.clientWidth ?? 0;
        const cssObjectPosition = window
          .getComputedStyle(imageRef.current, null)
          .getPropertyValue('object-position');
        const cssObjectPositionXUnitless =
          parseFloat((cssObjectPosition.split(' ')[0] || '50%').split('%')[0]) /
          100;

        const captionMarginLeft =
          (parentWidth - newImageWidth) * (2 * cssObjectPositionXUnitless - 1);

        captionRef.current.setAttribute(
          'style',
          `margin-left:${captionMarginLeft}px;`
        );
      }
    };

    calcImageSize();
    window.addEventListener('resize', calcImageSize);
    imageRef.current?.addEventListener('load', calcImageSize);

    return () => {
      window.removeEventListener('resize', calcImageSize);
      imageRef.current?.removeEventListener('load', calcImageSize);
    };
  }, [realImageWidth]);

  return (
    <ImageBlockWrapper className={className}>
      <ImageBlockInnerWrapper>
        {linkUrl ?
          <Link
            href={linkUrl}
            target="_blank"
          >
            {img}
          </Link>
        : img}

        {(caption || image?.source) && (
          <Typography
            ref={captionRef}
            variant="caption"
            component={ImageBlockCaption}
            sx={
              realImageWidth ?
                { width: `${realImageWidth}px`, justifySelf: 'center' }
              : undefined
            }
          >
            <Trans
              i18nKey="image.caption"
              values={{
                caption,
                source: image?.source || 'EMPTY',
              }}
              components={{
                ImageSource: <ImageBlockSource />,
              }}
            />
          </Typography>
        )}
      </ImageBlockInnerWrapper>
    </ImageBlockWrapper>
  );
};
