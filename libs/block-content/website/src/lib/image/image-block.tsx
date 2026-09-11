import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { BlockContent, FullImageBlockFragment } from '@wepublish/website/api';
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
): block is FullImageBlockFragment => block.__typename === 'ImageBlock';

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
  object-position: unset;
`;

export const ImageBlockCaption = styled('figcaption')`
  max-width: 100%;
  overflow-wrap: anywhere;
`;

export const ImageBlockSource = styled('span')``;

export const ImageBlock = ({
  caption,
  linkUrl,
  image,
  className,
}: BuilderImageBlockProps) => {
  const [realImageWidth, setRealImageWidth] = useState<number>();
  const wrapperRef = useRef<HTMLElement>(null);
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
    const imageElement = imageRef.current;
    const wrapper = wrapperRef.current;

    if (!imageElement || !wrapper) {
      return;
    }

    const calcImageSize = () => {
      const caption = captionRef.current;
      caption?.setAttribute('style', 'width:initial;');

      const { paddingLeft, paddingRight } = window.getComputedStyle(wrapper);
      const wrapperWidth =
        wrapper.clientWidth -
        (parseFloat(paddingLeft) || 0) -
        (parseFloat(paddingRight) || 0);

      // blocks can break out of their container with negative margins, so the
      // wrapper itself can be wider than the visible page. clientWidth of the
      // document excludes the scrollbar, unlike 100vw.
      const viewportWidth = document.documentElement.clientWidth;
      const { left, right } = wrapper.getBoundingClientRect();
      const visibleWidth = Math.min(right, viewportWidth) - Math.max(left, 0);
      const availableWidth = Math.min(wrapperWidth, visibleWidth);

      const [newImageWidth] = getContainedImageSize(
        imageElement,
        availableWidth
      );

      caption?.removeAttribute('style');

      setRealImageWidth(currentImageWidth =>
        newImageWidth > 0 ? Math.floor(newImageWidth) : currentImageWidth
      );
    };

    calcImageSize();

    const observer = new ResizeObserver(calcImageSize);
    observer.observe(wrapper);

    window.addEventListener('resize', calcImageSize);
    imageElement.addEventListener('load', calcImageSize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', calcImageSize);
      imageElement.removeEventListener('load', calcImageSize);
    };
  }, []);

  return (
    <ImageBlockWrapper
      ref={wrapperRef}
      className={className}
    >
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
