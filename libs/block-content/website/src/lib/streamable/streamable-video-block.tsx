import styled from '@emotion/styled';
import {
  FullBlockFragment,
  FullStreamableVideoBlockFragment,
} from '@wepublish/website/api';
import { BuilderStreamableVideoBlockProps } from '@wepublish/website/builder';
import { useEffect, useState } from 'react';

export const isStreamableVideoBlock = (
  block: Partial<Pick<FullBlockFragment, '__typename'>>
): block is FullStreamableVideoBlockFragment =>
  block.__typename === 'StreamableVideoBlock';

export const StreamableVideoBlockWrapper = styled('div')``;

const AspectBox = styled('div')<{ $aspectRatio: number }>`
  width: 100%;
  aspect-ratio: ${({ $aspectRatio }) => $aspectRatio || 16 / 9};

  ${({ theme }) => theme.breakpoints.up('sm')} {
    max-height: 80vh;
  }
`;

const StreamableVideoBlockPlayer = styled('iframe')`
  width: 100%;
  height: 100%;
  border: 0;
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
          src={`https://streamable.com/e/${encodeURIComponent(videoID ?? '')}`}
          title="Embedded Streamable Video"
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      </AspectBox>
    </StreamableVideoBlockWrapper>
  );
}

export default StreamableVideoBlock;
