import styled from '@emotion/styled';
import {
  isIFrameBlock,
  isVimeoVideoBlock,
  isYouTubeVideoBlock,
} from '@wepublish/block-content/website';
import { FullBlockFragment } from '@wepublish/website/api';
import { ReactNode, useEffect, useState } from 'react';
import ReactPlayer from 'react-player';

import {
  getNativeVideoUrl,
  getYouTubeVideoId,
  isTrustedYouTubeUrl,
} from '../block-layouts/flex-block-hero-poster';

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

export type BreakVideo =
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

export const breakVideoFromBlock = (
  block: FullBlockFragment
): BreakVideo | null => {
  if (isYouTubeVideoBlock(block) && block.videoID) {
    return {
      kind: 'youtube',
      videoUrl: `https://www.youtube.com/watch?v=${block.videoID}`,
      videoId: block.videoID,
      vertical: false,
    };
  }

  if (isVimeoVideoBlock(block) && block.videoID) {
    return { kind: 'vimeo', vimeoId: block.videoID };
  }

  if (isIFrameBlock(block) && block.url) {
    return classifyBreakVideo(block.url);
  }

  return null;
};

const FRAME_ASPECT = 4 / 5;

export const BreakVideoFrame = styled('div')`
  aspect-ratio: ${FRAME_ASPECT};
  width: min(100%, 15rem);
  margin: 0 auto;
  position: relative;
  overflow: hidden;
  background-color: ${({ theme }) => theme.palette.common.black};

  ${({ theme }) => theme.breakpoints.up('md')} {
    width: min(100%, 20rem);
  }

  > video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    border: 0;
    display: block;
  }

  &[data-fit='contain'] > video {
    object-fit: contain;
  }
`;

const BreakVideoContain = styled('div')`
  position: absolute;
  inset: 0;

  iframe {
    width: 100%;
    height: 100%;
    border: 0;
    display: block;
  }
`;

const BreakVideoCover = styled('div')<{ aspect: number }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: ${({ aspect }) =>
    aspect >= FRAME_ASPECT ? `${(aspect / FRAME_ASPECT) * 100}%` : '100%'};
  height: ${({ aspect }) =>
    aspect >= FRAME_ASPECT ? '100%' : `${(FRAME_ASPECT / aspect) * 100}%`};

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
  position: absolute;
  inset: 0;
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

export const BreakBlockVideo = ({
  video,
  fit = 'cover',
}: {
  video: BreakVideo;
  fit?: 'cover' | 'contain';
}) => {
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

  const renderEmbed = (embed: ReactNode) =>
    fit === 'contain' ?
      <BreakVideoContain>{embed}</BreakVideoContain>
    : <BreakVideoCover aspect={aspect}>{embed}</BreakVideoCover>;

  return (
    <BreakVideoFrame data-fit={fit}>
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

      {video.kind === 'vimeo' &&
        started &&
        renderEmbed(
          <iframe
            src={`https://player.vimeo.com/video/${video.vimeoId}?autoplay=1`}
            allow="autoplay; fullscreen"
            allowFullScreen
            title="Video"
          />
        )}

      {video.kind === 'youtube' &&
        started &&
        renderEmbed(
          <BreakYouTubePlayer
            src={video.videoUrl}
            playing
            controls
            width="100%"
            height="100%"
          />
        )}
    </BreakVideoFrame>
  );
};
