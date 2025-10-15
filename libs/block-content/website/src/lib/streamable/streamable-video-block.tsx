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

const AspectBox = styled('div')<{ $aspectRatio: string }>`
  width: 100%;
  /* haelt die Flaeche proportional, egal ob Hoch- oder Querformat */
  aspect-ratio: ${({ $aspectRatio }) => $aspectRatio || '16/9'};

  ${({ theme }) => theme.breakpoints.between('sm', 'lg')} {
    max-height: 80vh;
  }

  /* Inhalt fuellt die Box */
  & > .react-player {
    width: 100% !important;
    height: 100% !important;
  }
`;

/**
 * Ermittelt das Aspect-Ratio-String "w/h".
 * Faellt zurueck auf 16/9, wenn ungueltige Werte reinkommen.
 */
function toAspectRatioString(
  width?: number,
  height?: number,
  fallback = '16/9'
) {
  if (!width || !height || width <= 0 || height <= 0) return fallback;
  return `${Math.round(width)}/${Math.round(height)}`;
}

export function StreamableVideoBlock({
  videoID,
  className,
}: BuilderStreamableVideoBlockProps) {
  const [aspectRatio, setAspectRatio] = useState<string>('16/9');

  const streamableUrl = useMemo(() => {
    if (!videoID) return null;
    return `https://streamable.com/${encodeURIComponent(videoID)}`;
  }, [videoID]);

  useEffect(() => {
    let cancelled = false;
    async function fetchOEmbed() {
      if (!streamableUrl) return;
      try {
        // Streamable oEmbed liefert Breite/Hoehe
        const oembedUrl = `https://api.streamable.com/oembed.json?url=${encodeURIComponent(
          streamableUrl
        )}`;
        const res = await fetch(oembedUrl);

        console.log('Streamable oEmbed', { oembedUrl, json: await res.json() });
        if (!res.ok) throw new Error(`oEmbed HTTP ${res.status}`);
        const data: { width?: number; height?: number } = await res.json();
        if (!cancelled) {
          const ratio = toAspectRatioString(data.width, data.height, '16/9');
          setAspectRatio(ratio);
        }
      } catch {
        // still und leise auf Default bleiben
        if (!cancelled) setAspectRatio('16/9');
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
        <ReactPlayer
          className="react-player"
          url={streamableUrl}
          controls
          playsinline
          width="100%"
          height="100%"
          // wenn Streamable mal spinnt, bleiben wir einfach beim aktuellen Ratio
          onError={() => setAspectRatio(r => r || '16/9')}
        />
      </AspectBox>
    </StreamableVideoBlockWrapper>
  );
}

export default StreamableVideoBlock;
