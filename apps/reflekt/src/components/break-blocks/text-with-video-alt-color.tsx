import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import {
  BreakBlockHeading,
  BreakBlockSegment,
  BreakBlockWrapper,
  hasBlockStyle,
  isBreakBlock,
  RichTextBlockWrapper,
} from '@wepublish/block-content/website';
import { BlockContent } from '@wepublish/website/api';
import {
  BuilderBreakBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';
import { useEffect, useState } from 'react';
import ReactPlayer from 'react-player';

import theme, { euclidCircularB } from '../../theme';
import {
  getNativeVideoUrl,
  getYouTubeVideoId,
  isTrustedYouTubeUrl,
} from '../block-layouts/flex-block-hero-poster';
import { ReflektBlockStyles } from '../block-styles/reflekt-block-styles';

export const isTextWithVideoAltColorBreakBlock = (
  block: Pick<BlockContent, '__typename'>
): block is BuilderBreakBlockProps =>
  allPass([
    isBreakBlock,
    hasBlockStyle(ReflektBlockStyles.TextWithVideoAltColor),
  ])(block);

export const getVimeoVideoId = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();

    if (hostname !== 'vimeo.com' && hostname !== 'player.vimeo.com') {
      return null;
    }

    const match = url.pathname.match(/^\/(?:video\/)?(\d+)/);

    return match ? match[1] : null;
  } catch {
    return null;
  }
};

type BreakVideo =
  | { kind: 'native'; src: string }
  | { kind: 'vimeo'; vimeoId: string }
  | {
      kind: 'youtube';
      videoUrl: string;
      videoId: string;
      vertical: boolean;
    };

export const classifyBreakVideo = (
  value?: string | null
): BreakVideo | null => {
  const nativeSrc = getNativeVideoUrl(value);

  if (nativeSrc) {
    return { kind: 'native', src: nativeSrc };
  }

  const vimeoId = getVimeoVideoId(value);

  if (vimeoId) {
    return { kind: 'vimeo', vimeoId };
  }

  if (isTrustedYouTubeUrl(value)) {
    const youTubeId = getYouTubeVideoId(value);

    if (youTubeId) {
      return {
        kind: 'youtube',
        videoUrl: `https://www.youtube.com/watch?v=${youTubeId}`,
        videoId: youTubeId,
        vertical: (value as string).includes('/shorts/'),
      };
    }
  }

  return null;
};

const BreakVideoFrame = styled('div')<{ aspect: number }>`
  aspect-ratio: ${({ aspect }) => aspect};
  width: min(100%, calc(min(60vh, 34rem) * ${({ aspect }) => aspect}));
  margin: 0 auto;

  ${({ theme }) => theme.breakpoints.down('md')} {
    max-width: ${({ aspect }) => (aspect < 1 ? '185px' : 'none')};
  }

  video,
  iframe {
    width: 100%;
    height: 100%;
    border: 0;
    display: block;
  }
`;

const BreakYouTubePlayer = styled(ReactPlayer)`
  width: 100% !important;
  height: 100% !important;
`;

const VideoFacade = styled('button')`
  width: 100%;
  height: 100%;
  display: grid;
  align-items: center;
  justify-items: center;
  padding: 0;
  border: 0;
  cursor: pointer;
  background-color: ${({ theme }) => theme.palette.common.black};
  background-size: cover;
  background-position: center;
`;

const VideoFacadePlayIcon = styled('span')`
  display: grid;
  align-items: center;
  justify-items: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;

  svg {
    width: 28px;
    height: 28px;
    margin-left: 4px;
  }
`;

const PlayTriangle = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
  >
    <path d="M8 5v14l11-7z" />
  </svg>
);

const useVimeoEmbedInfo = (vimeoId: string | null) => {
  const [aspect, setAspect] = useState(16 / 9);
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  useEffect(() => {
    if (!vimeoId) {
      return undefined;
    }

    let active = true;

    fetch(
      `https://vimeo.com/api/oembed.json?width=1920&url=${encodeURIComponent(
        `https://vimeo.com/${vimeoId}`
      )}`
    )
      .then(response => (response.ok ? response.json() : null))
      .then(data => {
        if (!active) {
          return;
        }

        if (data?.width > 0 && data?.height > 0) {
          setAspect(data.width / data.height);
        }

        if (data?.thumbnail_url) {
          setThumbnail(data.thumbnail_url);
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [vimeoId]);

  return { aspect, thumbnail };
};

const BreakBlockVideo = ({ video }: { video: BreakVideo }) => {
  const [started, setStarted] = useState(false);
  const [nativeAspect, setNativeAspect] = useState(16 / 9);
  const { aspect: vimeoAspect, thumbnail: vimeoThumbnail } = useVimeoEmbedInfo(
    video.kind === 'vimeo' ? video.vimeoId : null
  );

  const aspect =
    video.kind === 'native' ? nativeAspect
    : video.kind === 'vimeo' ? vimeoAspect
    : video.vertical ? 9 / 16
    : 16 / 9;

  const thumbnail =
    video.kind === 'youtube' ?
      `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`
    : vimeoThumbnail;

  return (
    <BreakVideoFrame aspect={aspect}>
      {video.kind === 'native' && (
        <video
          src={video.src}
          controls
          playsInline
          preload="metadata"
          onLoadedMetadata={event => {
            const { videoWidth, videoHeight } = event.currentTarget;

            if (videoWidth > 0 && videoHeight > 0) {
              setNativeAspect(videoWidth / videoHeight);
            }
          }}
        />
      )}

      {video.kind !== 'native' && !started && (
        <VideoFacade
          type="button"
          aria-label="Video abspielen"
          style={
            thumbnail ? { backgroundImage: `url(${thumbnail})` } : undefined
          }
          onClick={() => setStarted(true)}
        >
          <VideoFacadePlayIcon>
            <PlayTriangle />
          </VideoFacadePlayIcon>
        </VideoFacade>
      )}

      {video.kind === 'vimeo' && started && (
        <iframe
          src={`https://player.vimeo.com/video/${video.vimeoId}?autoplay=1`}
          allow="autoplay; fullscreen"
          allowFullScreen
          title="Video"
        />
      )}

      {video.kind === 'youtube' && started && (
        <BreakYouTubePlayer
          url={video.videoUrl}
          playing
          controls
          width="100%"
          height="100%"
        />
      )}
    </BreakVideoFrame>
  );
};

const VideoBreakBlock = ({
  className,
  text,
  richText,
  linkURL,
}: BuilderBreakBlockProps) => {
  const {
    blocks: { RichText },
  } = useWebsiteBuilder();

  const video = classifyBreakVideo(linkURL);

  return (
    <BreakBlockWrapper className={className}>
      {video && (
        <BreakBlockSegment>
          <BreakBlockVideo video={video} />
        </BreakBlockSegment>
      )}

      <BreakBlockSegment>
        {text && (
          <Typography
            variant="blockBreakTitle"
            component={BreakBlockHeading}
          >
            {text}
          </Typography>
        )}

        <RichText richText={richText} />
      </BreakBlockSegment>
    </BreakBlockWrapper>
  );
};

export const TextWithVideoAltColorBreakBlock = styled(
  VideoBreakBlock
)<BuilderBreakBlockProps>`
  background-color: ${({ theme }) => theme.palette.secondary.main};
  color: ${({ theme }) => theme.palette.common.black};
  padding-left: 0;
  padding-right: 0;

  ${BreakBlockHeading} {
    font-size: 2.125rem;
    margin-bottom: ${({ theme }) => theme.spacing(2)};
  }

  ${RichTextBlockWrapper} {
    max-width: unset;

    h1,
    h2 {
      font-size: 2.125rem;
      margin-bottom: ${({ theme }) => theme.spacing(2)};
      text-wrap: wrap;
    }

    h3 {
      font-size: 1.5rem;
      margin-bottom: ${({ theme }) => theme.spacing(2)};
      text-wrap: wrap;
    }

    .MuiTypography-root.MuiTypography-buttonLinkSecondary {
      margin-top: ${({ theme }) => theme.spacing(3)};
    }
  }

  ul {
    padding-left: ${theme.spacing(3)};

    li,
    li p {
      font-family: ${[euclidCircularB.style.fontFamily, 'sans-serif'].join(
        ','
      )};
      font-size: 1.125rem;

      ${theme.breakpoints.up('md')} {
        font-size: 1.5rem;
      }
    }
  }

  ${BreakBlockSegment} + ${BreakBlockSegment} {
    order: -1;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: 5fr 3fr;
    padding: 2rem 1rem;
    column-gap: 3rem;
    row-gap: 0;
  }
`;
