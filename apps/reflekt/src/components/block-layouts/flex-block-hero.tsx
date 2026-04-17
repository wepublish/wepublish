import { Theme } from '@emotion/react';
import styled from '@emotion/styled';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  hasBlockStyle,
  IFrameBlockIframe,
  IFrameBlockWrapper,
  ImageBlockCaption,
  ImageBlockImage,
  ImageBlockInnerWrapper,
  ImageBlockWrapper,
  isFlexBlock,
  RichTextBlockWrapper,
  YouTubeVideoBlockWrapper,
} from '@wepublish/block-content/website';
import {
  type FlexBlock as FlexBlockType,
  BlockContent,
  FlexAlignment,
  IFrameBlock as IFrameBlockType,
  YouTubeVideoBlock as YouTubeVideoBlockType,
} from '@wepublish/website/api';
import {
  BuilderBlockRendererProps,
  BuilderFlexBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';
import { startTransition, useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';

import { useArticleProperty } from '../article-properties-context';
import { ReflektBlockType } from '../block-styles/reflekt-block-styles';
import { heroOffScreen } from '../reflekt-navbar';

const isTrustedYouTubeUrl = (value?: string | null): boolean => {
  if (!value) return false;

  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return (
      hostname === 'youtube.com' ||
      hostname === 'www.youtube.com' ||
      hostname === 'm.youtube.com' ||
      hostname === 'youtu.be'
    );
  } catch {
    return false;
  }
};

export const isFlexBlockHero = (
  block: Pick<BlockContent, '__typename'>
): block is FlexBlockType => {
  return allPass([hasBlockStyle(ReflektBlockType.FlexBlockHero), isFlexBlock])(
    block
  );
};

const MuteButton = styled('button')`
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 3;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.6);
  background: rgba(0, 0, 0, 0.4);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  transition: background 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.6);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const HeroYouTubePlayer = styled(ReactPlayer)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  /* Scale up to guarantee cover: at least 100% wide and 100% tall */
  min-width: 100%;
  min-height: 100%;
  /* Use 16/9 on both axes so both landscape (16:9) and portrait (9:16) videos cover */
  width: max(100%, calc(100vh * 16 / 9)) !important;
  height: max(100%, calc(100vw * 16 / 9)) !important;
  pointer-events: none;
`;

export const FlexBlockHeroWrapper = styled('div')`
  //margin-top: calc(-1 * var(--navbar-height));
  display: grid;
  gap: 0;
  grid-column: -1 / 1;
`;

export const BlockWithAlignment = styled('div')<FlexAlignment>`
  grid-column: -1 / 1;
  grid-row: 1 / 2;
  display: none;
  position: relative;

  /* 1st block = mobile media, 2nd block = desktop media */
  &:nth-of-type(1) {
    ${({ theme }) => theme.breakpoints.down('md')} {
      display: block;
    }
  }

  &:nth-of-type(2) {
    ${({ theme }) => theme.breakpoints.up('md')} {
      display: block;
    }
  }

  &:nth-of-type(3) {
    z-index: 2;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
  }

  ${ImageBlockWrapper}, ${YouTubeVideoBlockWrapper}, ${IFrameBlockWrapper} {
    position: relative;
    height: 100vh;
    width: 100vw;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  ${ImageBlockInnerWrapper}, ${IFrameBlockIframe} {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    overflow: hidden;
    width: 100vw;
    height: 100vh;
  }

  ${RichTextBlockWrapper} {
    background-color: transparent;
    color: white;
    width: 50%;
    margin: 0 auto;
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

export const FlexBlockHero = ({
  className,
  blocks,
  type,
}: BuilderFlexBlockProps & { type?: BuilderBlockRendererProps['type'] }) => {
  const {
    blocks: { Renderer },
  } = useWebsiteBuilder();
  const isDesktop = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'));
  const noLoop = useArticleProperty('noLoop');
  const ref = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    setMounted(true);

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        startTransition(() => setIsIntersecting(entry.isIntersecting));
      },
      { threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const sortedBlocks = [...blocks].sort(
    (a, b) => a.alignment.y - b.alignment.y || a.alignment.x - b.alignment.x
  );

  return (
    <FlexBlockHeroWrapper
      className={className}
      ref={ref}
    >
      {sortedBlocks.map((nestedBlock, index) => {
        const isYouTube = nestedBlock.block?.__typename === 'YouTubeVideoBlock';
        const isYouTubeIframe =
          nestedBlock.block?.__typename === 'IFrameBlock' &&
          isTrustedYouTubeUrl((nestedBlock.block as IFrameBlockType).url);
        const isHeroVideo = isYouTube || isYouTubeIframe;
        const videoUrl =
          isYouTube ?
            `https://www.youtube.com/watch?v=${(nestedBlock.block as YouTubeVideoBlockType).videoID}`
          : isYouTubeIframe ? ((nestedBlock.block as IFrameBlockType).url ?? '')
          : '';
        // index 0 = mobile (visible < md), index 1 = desktop (visible >= md)
        const isActiveBlock = index === 0 ? !isDesktop : isDesktop;

        return (
          <BlockWithAlignment
            key={index}
            {...(nestedBlock.alignment as FlexAlignment)}
          >
            {isHeroVideo && mounted ?
              <YouTubeVideoBlockWrapper>
                <HeroYouTubePlayer
                  url={videoUrl}
                  playing={isActiveBlock}
                  loop={!noLoop}
                  muted={muted || !isActiveBlock}
                  playsinline
                  controls={false}
                  width="100%"
                  height="100%"
                  config={{
                    youtube: {
                      playerVars: {
                        autoplay: 1,
                        modestbranding: 1,
                        playsinline: 1,
                        rel: 0,
                        showinfo: 0,
                        disablekb: 1,
                        fs: 0,
                        iv_load_policy: 3,
                      },
                    },
                  }}
                />
                <MuteButton
                  onClick={() => setMuted(m => !m)}
                  aria-label={muted ? 'Unmute' : 'Mute'}
                >
                  {muted ?
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <line
                        x1="23"
                        y1="9"
                        x2="17"
                        y2="15"
                      />
                      <line
                        x1="17"
                        y1="9"
                        x2="23"
                        y2="15"
                      />
                    </svg>
                  : <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </svg>
                  }
                </MuteButton>
              </YouTubeVideoBlockWrapper>
            : <Renderer
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
            }
          </BlockWithAlignment>
        );
      })}
      {heroOffScreen(isIntersecting)}
    </FlexBlockHeroWrapper>
  );
};
