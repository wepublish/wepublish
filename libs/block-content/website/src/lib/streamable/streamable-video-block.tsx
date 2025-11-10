import styled from '@emotion/styled';
import {
  BlockContent,
  StreamableVideoBlock as StreamableVideoBlockType,
} from '@wepublish/website/api';
import { BuilderStreamableVideoBlockProps } from '@wepublish/website/builder';
import React, { useEffect, useState } from 'react';
import ReactPlayer from 'react-player';

export const isStreamableVideoBlock = (
  block: Pick<BlockContent, '__typename'>
): block is StreamableVideoBlockType =>
  block.__typename === 'StreamableVideoBlock';

export const StreamableVideoBlockWrapper = styled('div')``;

const AspectBox = styled('div')<{ $aspectRatio: number }>`
  width: 100%;
  aspect-ratio: ${({ $aspectRatio }) => $aspectRatio || 16 / 9};

  ${({ theme }) => theme.breakpoints.up('sm')} {
    max-height: 80vh;
  }
`;

const StreamableVideoBlockPlayer = styled(ReactPlayer)`
  width: 100% !important;
  height: 100% !important;
`;

export function StreamableVideoBlock({
  videoID,
  className,
}: BuilderStreamableVideoBlockProps) {
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9);

  const streamableUrl =
    videoID ? `https://streamable.com/${encodeURIComponent(videoID)}` : null;

  useEffect(() => {
    if (!streamableUrl) {
      return;
    }

    const controller = new AbortController();

    async function fetchOEmbed(url: string) {
      try {
        const oembedUrl = `https://api.streamable.com/oembed.json?url=${encodeURIComponent(
          url
        )}`;
        const res = await fetch(oembedUrl, { signal: controller.signal });
        const data: { width?: number; height?: number } = await res.json();
        setAspectRatio(
          data.width && data.height ? data.width / data.height : 16 / 9
        );
      } catch {
        setAspectRatio(16 / 9);
      }
    }

    fetchOEmbed(streamableUrl);

    return () => {
      controller.abort();
    };
  }, [streamableUrl]);

  if (!streamableUrl) {
    return null;
  }

  return (
    <StreamableVideoBlockWrapper className={className}>
      <AspectBox $aspectRatio={aspectRatio}>
        <StreamableVideoBlockPlayer
          url={streamableUrl}
          controls
          playsinline
          width="100%"
          height="100%"
          // wenn Streamable mal spinnt, bleiben wir einfach beim aktuellen Ratio
          onError={() => setAspectRatio(r => r || 16 / 9)}
        />
      </AspectBox>
    </StreamableVideoBlockWrapper>
  );
}

export default StreamableVideoBlock;
