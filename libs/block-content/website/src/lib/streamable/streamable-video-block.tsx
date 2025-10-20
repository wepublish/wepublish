import styled from '@emotion/styled';
import {
  BlockContent,
  StreamableVideoBlock as StreamableVideoBlockType,
} from '@wepublish/website/api';
import { BuilderStreamableVideoBlockProps } from '@wepublish/website/builder';
import React, { useEffect, useMemo, useState } from 'react';
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

  const streamableUrl = useMemo(() => {
    if (!videoID) return null;
    return `https://streamable.com/${encodeURIComponent(videoID)}`;
  }, [videoID]);

  useEffect(() => {
    let cancelled = false;
    async function fetchOEmbed() {
      if (!streamableUrl) return;
      try {
        const oembedUrl = `https://api.streamable.com/oembed.json?url=${encodeURIComponent(
          streamableUrl
        )}`;
        const res = await fetch(oembedUrl);
        const data: { width?: number; height?: number } = await res.json();
        if (!cancelled) {
          setAspectRatio(
            data.width && data.height ? data.width / data.height : 16 / 9
          );
        }
      } catch {
        if (!cancelled) setAspectRatio(16 / 9);
      }
    }
    fetchOEmbed();
    return () => {
      cancelled = true;
    };
  }, [streamableUrl]);

  if (!videoID || !streamableUrl) return null;

  return (
    <StreamableVideoBlockWrapper className={className}>
      <AspectBox $aspectRatio={aspectRatio}>
        <StreamableVideoBlockPlayer
          className="react-player"
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
