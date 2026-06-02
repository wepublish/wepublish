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

import { ReflektBlockStyles } from '../block-styles/reflekt-block-styles';

export const isFlexBlockFullsizeImage = (
  block: Pick<BlockContent, '__typename'>
): block is BuilderFlexBlockProps => {
  return allPass([
    hasBlockStyle(ReflektBlockStyles.FlexBlockFullsizeImage),
    isFlexBlock,
  ])(block);
};

const PARALLAX_HOLD_DISTANCE = 800;
const PARALLAX_TEXT_DELAY = 200;
const PARALLAX_TEXT_START_OFFSET = 0.9;
const PARALLAX_MOBILE_TEXT_SPEED = 0.5;
const PARALLAX_DESKTOP_TEXT_SPEED = 1;
const MD_BREAKPOINT = 900;
const RICH_TEXT_SCALE_MOBILE = 1;
const RICH_TEXT_SCALE_DESKTOP = 1.8;

export const FlexBlockFullsizeImageWrapper = styled('div')`
  display: grid;
  gap: 0;
  grid-column: -1 / 1;
  position: relative;

  ${RichTextBlockWrapper} {
    overflow: hidden;
    transform: translate(-50%, calc(-50% + var(--text-parallax-y, 90vh)));
  }
`;

export const BlockWithAlignment = styled('div')<FlexAlignment>`
  grid-column: -1 / 1;
  grid-row: 1 / 2;
  overflow: hidden;
  display: none;

  &:nth-of-type(1)[data-image-block='true'] {
    ${({ theme }) => theme.breakpoints.down('md')} {
      display: block;
    }
  }

  &:nth-of-type(2)[data-image-block='true'] {
    ${({ theme }) => theme.breakpoints.up('md')} {
      display: block;
    }
  }

  &[data-text-block='true'] {
    display: block;
  }

  ${ImageBlockWrapper} {
    height: 100vh;
    width: 100vw;

    ${({ theme }) => theme.breakpoints.up('md')} {
      height: calc(100vh - var(--navbar-height));
    }
  }

  ${ImageBlockInnerWrapper} {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    overflow: hidden;
    background-color: ${({ theme }) => theme.palette.common.black};
  }

  ${RichTextBlockWrapper} {
    background-color: transparent;
    border-top: none;
    border-bottom: none;
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
      width: min(calc(var(--breakpoint-width) + 16px), 100vw);
    }

    .MuiTypography-root {
      line-height: 1.2;
      margin-bottom: ${({ theme }) => theme.spacing(4)};
    }

    ul,
    ol {
      text-align: left;
    }

    h1,
    .MuiTypography-h1 {
      font-size: calc(
        ${({ theme }) => theme.typography.h1.fontSize} *
          ${RICH_TEXT_SCALE_MOBILE}
      );
    }
    h2,
    .MuiTypography-h2 {
      font-size: calc(
        ${({ theme }) => theme.typography.h2.fontSize} *
          ${RICH_TEXT_SCALE_MOBILE}
      );
    }
    h3,
    .MuiTypography-h3 {
      font-size: calc(
        ${({ theme }) => theme.typography.h3.fontSize} *
          ${RICH_TEXT_SCALE_MOBILE}
      );
    }
    h4,
    .MuiTypography-h4 {
      font-size: calc(
        ${({ theme }) => theme.typography.h4.fontSize} *
          ${RICH_TEXT_SCALE_MOBILE}
      );
    }
    h5,
    .MuiTypography-h5 {
      font-size: calc(
        ${({ theme }) => theme.typography.h5.fontSize} *
          ${RICH_TEXT_SCALE_MOBILE}
      );
    }
    h6,
    .MuiTypography-h6 {
      font-size: calc(
        ${({ theme }) => theme.typography.h6.fontSize} *
          ${RICH_TEXT_SCALE_MOBILE}
      );
    }
    p,
    .MuiTypography-body1,
    .MuiTypography-body2,
    .MuiTypography-subtitle1,
    .MuiTypography-subtitle2 {
      font-size: calc(
        ${({ theme }) => theme.typography.body1.fontSize} *
          ${RICH_TEXT_SCALE_MOBILE}
      );
    }

    ${({ theme }) => theme.breakpoints.up('md')} {
      h1,
      .MuiTypography-h1 {
        font-size: calc(
          ${({ theme }) => theme.typography.h1.fontSize} *
            ${RICH_TEXT_SCALE_DESKTOP}
        );
      }
      h2,
      .MuiTypography-h2 {
        font-size: calc(
          ${({ theme }) => theme.typography.h2.fontSize} *
            ${RICH_TEXT_SCALE_DESKTOP}
        );
      }
      h3,
      .MuiTypography-h3 {
        font-size: calc(
          ${({ theme }) => theme.typography.h3.fontSize} *
            ${RICH_TEXT_SCALE_DESKTOP}
        );
      }
      h4,
      .MuiTypography-h4 {
        font-size: calc(
          ${({ theme }) => theme.typography.h4.fontSize} *
            ${RICH_TEXT_SCALE_DESKTOP}
        );
      }
      h5,
      .MuiTypography-h5 {
        font-size: calc(
          ${({ theme }) => theme.typography.h5.fontSize} *
            ${RICH_TEXT_SCALE_DESKTOP}
        );
      }
      h6,
      .MuiTypography-h6 {
        font-size: calc(
          ${({ theme }) => theme.typography.h6.fontSize} *
            ${RICH_TEXT_SCALE_DESKTOP}
        );
      }
      p,
      .MuiTypography-body1,
      .MuiTypography-body2,
      .MuiTypography-subtitle1,
      .MuiTypography-subtitle2 {
        font-size: calc(
          ${({ theme }) => theme.typography.body1.fontSize} *
            ${RICH_TEXT_SCALE_DESKTOP}
        );
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
  const imageHeightRef = useRef<number>(0);
  const textHeightRef = useRef<number>(0);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) {
      return;
    }

    const getActiveImageBlock = (): HTMLElement | null => {
      const candidates = el.querySelectorAll<HTMLElement>(
        '[data-image-block="true"]'
      );
      for (const c of Array.from(candidates)) {
        if (getComputedStyle(c).display !== 'none') {
          return c;
        }
      }
      return null;
    };

    const getTextBlock = () =>
      el.querySelector('[data-text-block="true"]') as HTMLElement | null;

    const measureTextHeight = () => {
      const textBlock = getTextBlock();
      const inner = textBlock?.firstElementChild as HTMLElement | null;
      if (inner) {
        textHeightRef.current =
          inner.scrollHeight || inner.offsetHeight || textHeightRef.current;
      }
    };

    let cachedLvh = 0;
    const measureLvh = () => {
      const m = document.createElement('div');
      m.style.cssText =
        'position:fixed;visibility:hidden;top:0;left:0;height:100lvh;pointer-events:none;';
      document.body.appendChild(m);
      const h = m.offsetHeight || window.innerHeight;
      document.body.removeChild(m);
      return h;
    };
    const getViewportHeight = () => {
      if (!cachedLvh) {
        cachedLvh = measureLvh();
      }
      return cachedLvh;
    };

    const getHoldDistance = () => {
      const isDesktopNow = window.innerWidth >= MD_BREAKPOINT;
      const vhNow = getViewportHeight();
      const textHeight = textHeightRef.current;
      const imageHeight = imageHeightRef.current || vhNow;
      if (!textHeight) {
        return PARALLAX_HOLD_DISTANCE;
      }
      if (isDesktopNow) {
        const startY = vhNow * PARALLAX_TEXT_START_OFFSET;
        const endY = -(imageHeight + textHeight) / 2;
        const travel = startY - endY;
        return PARALLAX_TEXT_DELAY + travel / PARALLAX_DESKTOP_TEXT_SPEED;
      }
      const delay = vhNow * 0.5;
      const travel = textHeight + imageHeight / 2;
      return delay + travel / PARALLAX_MOBILE_TEXT_SPEED;
    };

    const applyLayout = () => {
      const imageHeight = imageHeightRef.current;
      if (!imageHeight) {
        return;
      }
      el.style.display = 'block';
      el.style.position = 'relative';
      el.style.height = `calc(100lvh + ${getHoldDistance()}px)`;
    };

    const setFixed = (
      block: HTMLElement,
      imageHeight: number,
      stickyTop: number,
      zIndex: string
    ) => {
      if (block.style.position === 'fixed') {
        return;
      }
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
      if (!imageHeight) {
        return;
      }

      const imageBlock = getActiveImageBlock();
      const textBlock = getTextBlock();
      const vh = getViewportHeight();
      const rect = el.getBoundingClientRect();
      const wrapperTop = rect.top + window.scrollY;
      const scrollY = window.scrollY;

      const navbarHeight =
        parseInt(
          getComputedStyle(document.documentElement).getPropertyValue(
            '--navbar-height'
          )
        ) || 0;
      const isDesktop = window.innerWidth >= MD_BREAKPOINT;
      const stickyTop =
        isDesktop ? Math.max(navbarHeight, (vh - imageHeight) / 2) : 0;
      const holdStart = wrapperTop;

      const textDelay = isDesktop ? PARALLAX_TEXT_DELAY : vh * 0.5;
      const holdDistance = getHoldDistance();
      const textHeight = textHeightRef.current;
      const progress = Math.max(
        0,
        Math.min(
          1,
          (scrollY - holdStart - textDelay) /
            Math.max(1, holdDistance - textDelay)
        )
      );
      const startY =
        isDesktop ? vh * PARALLAX_TEXT_START_OFFSET : textHeight / 2;
      const endY = -(imageHeight + textHeight) / 2;
      el.style.setProperty(
        '--text-parallax-y',
        `${startY + (endY - startY) * progress}px`
      );

      if (scrollY >= holdStart && scrollY < holdStart + holdDistance) {
        if (imageBlock) {
          setFixed(imageBlock, imageHeight, stickyTop, '1');
        }
        if (textBlock) {
          setFixed(textBlock, imageHeight, stickyTop, '2');
        }
      } else if (scrollY >= holdStart + holdDistance) {
        if (imageBlock) {
          setAbsolute(imageBlock, holdDistance + stickyTop, imageHeight, '1');
        }
        if (textBlock) {
          setAbsolute(textBlock, holdDistance + stickyTop, imageHeight, '2');
        }
      } else {
        if (imageBlock) {
          setAbsolute(imageBlock, stickyTop, imageHeight, '1');
        }
        if (textBlock) {
          setAbsolute(textBlock, stickyTop, imageHeight, '2');
        }
      }
    };

    let lastViewportWidth = window.innerWidth;

    const handleResize = () => {
      const newVw = window.innerWidth;
      const widthChanged = newVw !== lastViewportWidth;
      lastViewportWidth = newVw;

      if (widthChanged) {
        cachedLvh = measureLvh();
        el.querySelectorAll<HTMLElement>('[data-image-block="true"]').forEach(
          b => b.removeAttribute('style')
        );
        getTextBlock()?.removeAttribute('style');
        const activeImage = getActiveImageBlock();
        if (activeImage) {
          imageHeightRef.current = activeImage.offsetHeight;
        }
        measureTextHeight();
      }
      applyLayout();
      handleScroll();
    };

    const observer = new ResizeObserver(() => {
      const activeImage = getActiveImageBlock();
      const h = activeImage?.offsetHeight ?? 0;
      let changed = false;
      if (h && h !== imageHeightRef.current) {
        imageHeightRef.current = h;
        changed = true;
      }
      const previousTextHeight = textHeightRef.current;
      measureTextHeight();
      if (textHeightRef.current !== previousTextHeight) {
        changed = true;
      }
      if (changed) {
        applyLayout();
        handleScroll();
      }
    });

    el.querySelectorAll<HTMLElement>('[data-image-block="true"]').forEach(b =>
      observer.observe(b)
    );
    const textBlockEl = getTextBlock();
    if (textBlockEl?.firstElementChild) {
      observer.observe(textBlockEl.firstElementChild);
    }
    measureTextHeight();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('resize', handleResize);
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('resize', handleResize);
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
