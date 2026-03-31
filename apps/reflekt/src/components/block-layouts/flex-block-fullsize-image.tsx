import styled from '@emotion/styled';
import {
  hasBlockStyle,
  ImageBlockCaption,
  ImageBlockImage,
  ImageBlockInnerWrapper,
  ImageBlockWrapper,
  isFlexBlock,
  RichTextBlockWrapper,
} from '@wepublish/block-content/website';
import { BlockContent, FlexAlignment } from '@wepublish/website/api';
import {
  BuilderBlockRendererProps,
  BuilderFlexBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';
import { useEffect, useRef } from 'react';

import { ReflektBlockType } from '../block-styles/reflekt-block-styles';

export const isFlexBlockFullsizeImage = (
  block: Pick<BlockContent, '__typename'>
): block is BuilderFlexBlockProps => {
  return allPass([
    hasBlockStyle(ReflektBlockType.FlexBlockFullsizeImage),
    isFlexBlock,
  ])(block);
};

const PARALLAX_HOLD_DISTANCE = 800;
const PARALLAX_TEXT_DELAY = 200;
const PARALLAX_TEXT_START_OFFSET = 0.9;
const MD_BREAKPOINT = 900;

export const FlexBlockFullsizeImageWrapper = styled('div')`
  display: grid;
  gap: 0;
  grid-column: -1 / 1;
  position: relative;
  background-color: ${({ theme }) => theme.palette.common.black};

  ${RichTextBlockWrapper} {
    overflow: hidden;
    transform: translate(-50%, calc(-50% + var(--text-parallax-y, 90vh)));
    background-color: transparent;
  }
`;

export const BlockWithAlignment = styled('div')<FlexAlignment>`
  grid-column: -1 / 1;
  grid-row: 1 / 2;
  overflow: hidden;

  ${ImageBlockWrapper} {
    height: auto;
    width: 100vw;

    ${({ theme }) => theme.breakpoints.up('md')} {
      height: calc(100vh - var(--navbar-height));
    }
  }

  ${ImageBlockInnerWrapper} {
    ${({ theme }) => theme.breakpoints.up('md')} {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      overflow: hidden;
    }
  }

  ${RichTextBlockWrapper} {
    background-color: transparent;
    color: white;
    margin: 0;
    width: calc(100vw - ${({ theme }) => theme.spacing(4)});

    z-index: 2;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;

    position: absolute;
    top: 50%;
    left: 50%;

    ${({ theme }) => theme.breakpoints.up('md')} {
      width: 50%;
    }

    .MuiTypography-root {
      font-size: 2.333rem;
      line-height: 1.2;
      margin-bottom: ${({ theme }) => theme.spacing(4)};

      ${({ theme }) => theme.breakpoints.up('md')} {
        font-size: 3rem;
      }
    }
  }

  ${ImageBlockImage} {
    object-fit: cover;
    aspect-ratio: unset;
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
  }

  ${ImageBlockCaption} {
    display: none;
  }
`;

export const FlexBlockFullsizeImage = ({
  className,
  blocks,
  type,
}: BuilderFlexBlockProps & { type?: BuilderBlockRendererProps['type'] }) => {
  const {
    blocks: { Renderer },
  } = useWebsiteBuilder();

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  // Actual rendered image height, updated by ResizeObserver
  const imageHeightRef = useRef<number>(0);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const getImageBlock = () =>
      el.querySelector('[data-image-block="true"]') as HTMLElement | null;
    const getTextBlock = () =>
      el.querySelector('[data-text-block="true"]') as HTMLElement | null;

    const applyLayout = () => {
      const imageHeight = imageHeightRef.current;
      if (!imageHeight) return;
      const vh = window.innerHeight;
      // wrapper = vh + HOLD_DISTANCE regardless of image height,
      // stickyTop centers the image in the viewport during the hold
      el.style.display = 'block';
      el.style.position = 'relative';
      el.style.height = `${vh + PARALLAX_HOLD_DISTANCE}px`;
    };

    const resetLayout = () => {
      el.style.display = '';
      el.style.position = '';
      el.style.height = '';
      getImageBlock()?.removeAttribute('style');
      getTextBlock()?.removeAttribute('style');
    };

    const setFixed = (
      block: HTMLElement,
      imageHeight: number,
      stickyTop: number,
      zIndex: string
    ) => {
      if (block.style.position === 'fixed') return;
      // Use the computed target position, not the captured actual position.
      // Capturing the actual position breaks at high scroll speeds because the
      // element has already overshot past center by the time the event fires.
      block.style.position = 'fixed';
      block.style.top = `${stickyTop}px`;
      block.style.bottom = 'auto';
      block.style.left = '0';
      block.style.width = '100%';
      block.style.height = `${imageHeight}px`;
      block.style.zIndex = zIndex;
    };

    const setAbsolute = (
      block: HTMLElement,
      top: number,
      imageHeight: number,
      zIndex: string
    ) => {
      block.style.position = 'absolute';
      block.style.top = `${top}px`;
      block.style.bottom = 'auto';
      block.style.left = '0';
      block.style.width = '100%';
      block.style.height = `${imageHeight}px`;
      block.style.zIndex = zIndex;
    };

    const handleScroll = () => {
      const imageHeight = imageHeightRef.current;
      if (!imageHeight) return;

      const imageBlock = getImageBlock();
      const textBlock = getTextBlock();
      const vh = window.innerHeight;
      const rect = el.getBoundingClientRect();
      const wrapperTop = rect.top + window.scrollY;
      const scrollY = window.scrollY;

      const navbarHeight =
        parseInt(
          getComputedStyle(document.documentElement).getPropertyValue(
            '--navbar-height'
          )
        ) || 0;
      // Center in available space; on desktop imageHeight ≈ vh-navbar so (vh-imageHeight)/2 = navbar/2
      // which would hide the image behind the navbar — floor at full navbarHeight
      const stickyTop = Math.max(navbarHeight, (vh - imageHeight) / 2);

      // Hold starts when image has scrolled to its centered position (scrollY = wrapperTop)
      const holdStart = wrapperTop;

      const progress = Math.max(
        0,
        Math.min(
          1,
          (scrollY - holdStart - PARALLAX_TEXT_DELAY) /
            (PARALLAX_HOLD_DISTANCE - PARALLAX_TEXT_DELAY)
        )
      );

      const isDesktop = window.innerWidth >= MD_BREAKPOINT;
      const startY = vh * PARALLAX_TEXT_START_OFFSET;
      const endY = isDesktop ? 0 : -startY;
      el.style.setProperty(
        '--text-parallax-y',
        `${startY + (endY - startY) * progress}px`
      );

      if (
        scrollY >= holdStart &&
        scrollY < holdStart + PARALLAX_HOLD_DISTANCE
      ) {
        if (imageBlock) setFixed(imageBlock, imageHeight, stickyTop, '1');
        if (textBlock) setFixed(textBlock, imageHeight, stickyTop, '2');
      } else if (scrollY >= holdStart + PARALLAX_HOLD_DISTANCE) {
        if (imageBlock)
          setAbsolute(
            imageBlock,
            PARALLAX_HOLD_DISTANCE + stickyTop,
            imageHeight,
            '1'
          );
        if (textBlock)
          setAbsolute(
            textBlock,
            PARALLAX_HOLD_DISTANCE + stickyTop,
            imageHeight,
            '2'
          );
      } else {
        if (imageBlock) setAbsolute(imageBlock, stickyTop, imageHeight, '1');
        if (textBlock) setAbsolute(textBlock, stickyTop, imageHeight, '2');
      }
    };

    const handleResize = () => {
      resetLayout();
      applyLayout();
      handleScroll();
    };

    // ResizeObserver gives us the actual rendered image height (works for mobile auto-height)
    // On desktop, pull the next sibling up to hide the hold-distance white space
    const nextSibling = el.nextElementSibling as HTMLElement | null;
    if (nextSibling && window.innerWidth >= MD_BREAKPOINT) {
      //nextSibling.style.marginTop = `-${PARALLAX_HOLD_DISTANCE}px`;
    }

    const observer = new ResizeObserver(entries => {
      const h = entries[0]?.contentRect.height;
      if (h && h !== imageHeightRef.current) {
        imageHeightRef.current = h;
        applyLayout();
        handleScroll();
      }
    });

    const imageBlock = getImageBlock();
    if (imageBlock) observer.observe(imageBlock);

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (nextSibling) nextSibling.style.marginTop = '';
    };
  }, []);

  const sortedBlocks = [...(blocks ?? [])].sort(
    (a, b) => a.alignment.y - b.alignment.y || a.alignment.x - b.alignment.x
  );

  return (
    <FlexBlockFullsizeImageWrapper
      className={className}
      ref={wrapperRef}
    >
      {sortedBlocks.map((nestedBlock, index) => {
        const isTextBlock = nestedBlock.block?.__typename === 'RichTextBlock';
        return (
          <BlockWithAlignment
            key={index}
            data-text-block={isTextBlock ? 'true' : undefined}
            data-image-block={!isTextBlock ? 'true' : undefined}
            {...(nestedBlock.alignment as FlexAlignment)}
          >
            <Renderer
              block={nestedBlock.block as BlockContent}
              type={
                (
                  (type as unknown as BuilderBlockRendererProps['type']) ===
                  'Article'
                ) ?
                  'ArticleNested'
                : 'PageNested'
              }
              index={index}
              count={sortedBlocks.length}
            />
          </BlockWithAlignment>
        );
      })}
    </FlexBlockFullsizeImageWrapper>
  );
};
