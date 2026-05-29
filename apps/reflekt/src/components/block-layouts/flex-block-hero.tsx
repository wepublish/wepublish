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
  VimeoVideoBlock as VimeoVideoBlockType,
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
import { ReflektBlockStyles } from '../block-styles/reflekt-block-styles';
import { heroOffScreen } from '../reflekt-navbar';

const isTrustedYouTubeUrl = (value?: string | null): boolean => {
  if (!value) {
    return false;
  }
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

const getYouTubeVideoId = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }
  try {
    const url = new URL(value);
    if (url.hostname === 'youtu.be') {
      return url.pathname.slice(1) || null;
    }
    const v = url.searchParams.get('v');
    if (v) {
      return v;
    }
    const embedMatch = url.pathname.match(/^\/embed\/([^/?]+)/);
    return embedMatch ? embedMatch[1] : null;
  } catch {
    return null;
  }
};

const getNativeVideoUrl = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }
  try {
    const url = new URL(value);
    return /\.(mp4|webm)$/i.test(url.pathname) ? value : null;
  } catch {
    return null;
  }
};

const HeroNativeVideoPlayer = styled('video')`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
`;

type HeroNativeVideoProps = {
  src: string;
  noLoop: boolean;
};

const HeroNativeVideo = ({ src, noLoop }: HeroNativeVideoProps) => (
  <HeroNativeVideoPlayer
    src={src}
    autoPlay
    muted
    loop={!noLoop}
    playsInline
    disablePictureInPicture
    preload="auto"
  />
);

const HeroVimeoPlayer = styled('iframe')`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  min-width: 100%;
  min-height: 100%;
  width: max(100%, calc(100vh * 21 / 9)) !important;
  height: max(100%, calc(100vw * 21 / 9)) !important;
  border: 0;
  pointer-events: none;
`;

const HeroYouTubePlayer = styled(ReactPlayer)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  min-width: 100%;
  min-height: 100%;
  width: max(100%, calc(100vh * 16 / 9)) !important;
  height: max(100%, calc(100vw * 16 / 9)) !important;
  pointer-events: none;

  * {
    pointer-events: none;
  }
`;

const EndMask = styled('div')`
  position: absolute;
  inset: 0;
  background: black;
  z-index: 1;
  pointer-events: none;
`;

type HeroVimeoVideoProps = {
  videoId: string;
};

const HeroVimeoVideo = ({ videoId }: HeroVimeoVideoProps) => (
  <HeroVimeoPlayer
    src={`https://player.vimeo.com/video/${videoId}?background=1&autoplay=1&muted=1&loop=1&controls=0&title=0&byline=0&portrait=0`}
    allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
    title="hero video"
  />
);

type HeroYouTubeVideoProps = {
  videoUrl: string;
  isActiveBlock: boolean;
  muted: boolean;
  noLoop: boolean;
};

const HeroYouTubeVideo = ({
  videoUrl,
  isActiveBlock,
  muted,
  noLoop,
}: HeroYouTubeVideoProps) => {
  const [ended, setEnded] = useState(false);
  const playerRef = useRef<ReactPlayer>(null);
  return (
    <>
      <HeroYouTubePlayer
        ref={playerRef}
        url={videoUrl}
        playing={isActiveBlock}
        loop={!noLoop}
        muted={muted || !isActiveBlock}
        playsinline
        controls={false}
        width="100%"
        height="100%"
        onEnded={() => setEnded(true)}
        onPlay={() => setEnded(false)}
        onReady={() => {
          const internalPlayer = playerRef.current?.getInternalPlayer();
          internalPlayer?.playVideo?.();
        }}
        config={{
          youtube: {
            playerVars: {
              origin: window.location.origin,
              widget_referrer: window.location.origin,
              autoplay: 0,
              controls: 0,
              modestbranding: 1,
              playsinline: 1,
              rel: 0,
              showinfo: 0,
              disablekb: 1,
              fs: 0,
              iv_load_policy: 3,
              cc_load_policy: 0,
            },
          },
        }}
      />
      {ended && <EndMask />}
    </>
  );
};

export const isFlexBlockHero = (
  block: Pick<BlockContent, '__typename'>
): block is FlexBlockType => {
  return allPass([
    hasBlockStyle(ReflektBlockStyles.FlexBlockHero),
    isFlexBlock,
  ])(block);
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

export const FlexBlockHeroWrapper = styled('div')`
  display: grid;
  gap: 0;
  grid-column: -1 / 1;
`;

export const BlockWithAlignment = styled('div')<FlexAlignment>`
  grid-column: -1 / 1;
  grid-row: 1 / 2;
  display: none;
  position: relative;

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
    width: 100vw;
    height: 100vh;
    padding-top: 150px;
    padding-bottom: 50px;
    box-sizing: border-box;
    overflow: hidden;
    container-type: size;
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
    width: 100%;
    max-width: 100%;
    max-height: 100%;
    margin: 0 auto;
    padding: 0 ${({ theme }) => theme.spacing(4)};
    box-sizing: border-box;
    overflow: hidden;
    overflow-wrap: break-word;
    word-break: break-word;

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
      font-size: clamp(2rem, 7cqw, 7rem);
    }
    h2,
    .MuiTypography-h2 {
      font-size: clamp(2rem, 6cqw, 6rem);
    }
    h3,
    .MuiTypography-h3 {
      font-size: clamp(1.75rem, 5.5cqw, 5.5rem);
    }
    h4,
    .MuiTypography-h4 {
      font-size: clamp(1.25rem, 3cqw, 3rem);
    }
    h5,
    .MuiTypography-h5 {
      font-size: clamp(1.125rem, 2.5cqw, 2.5rem);
    }
    h6,
    .MuiTypography-h6 {
      font-size: clamp(1rem, 2cqw, 2rem);
    }
    p,
    .MuiTypography-body1,
    .MuiTypography-body2,
    .MuiTypography-subtitle1,
    .MuiTypography-subtitle2 {
      font-size: clamp(1rem, 2.25cqw, 2.5rem);
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
    if (!el) {
      return;
    }

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
        const isVimeoBlock =
          nestedBlock.block?.__typename === 'VimeoVideoBlock';
        const vimeoId =
          isVimeoBlock ?
            (nestedBlock.block as VimeoVideoBlockType).videoID
          : null;
        const isYouTube = nestedBlock.block?.__typename === 'YouTubeVideoBlock';
        const isYouTubeIframe =
          nestedBlock.block?.__typename === 'IFrameBlock' &&
          isTrustedYouTubeUrl((nestedBlock.block as IFrameBlockType).url);
        const nativeVideoUrl =
          nestedBlock.block?.__typename === 'IFrameBlock' ?
            getNativeVideoUrl((nestedBlock.block as IFrameBlockType).url)
          : null;
        const isNativeVideo = !!nativeVideoUrl;
        const isHeroVideo =
          isVimeoBlock || isYouTube || isYouTubeIframe || isNativeVideo;
        const youtubeId =
          isYouTube ? (nestedBlock.block as YouTubeVideoBlockType).videoID
          : isYouTubeIframe ?
            getYouTubeVideoId((nestedBlock.block as IFrameBlockType).url)
          : null;
        const videoUrl =
          youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : '';
        const isActiveBlock = index === 0 ? !isDesktop : isDesktop;

        return (
          <BlockWithAlignment
            key={index}
            {...(nestedBlock.alignment as FlexAlignment)}
          >
            {isHeroVideo && mounted ?
              <YouTubeVideoBlockWrapper>
                {isNativeVideo && nativeVideoUrl ?
                  <HeroNativeVideo
                    src={nativeVideoUrl}
                    noLoop={!!noLoop}
                  />
                : isVimeoBlock && vimeoId ?
                  <HeroVimeoVideo videoId={vimeoId} />
                : <HeroYouTubeVideo
                    videoUrl={videoUrl}
                    isActiveBlock={isActiveBlock}
                    muted={muted}
                    noLoop={!!noLoop}
                  />
                }
                {false && (
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
                )}
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
