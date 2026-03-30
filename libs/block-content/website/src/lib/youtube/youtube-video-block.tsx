import styled from '@emotion/styled';
import {
  BlockContent,
  YouTubeVideoBlock as YouTubeVideoBlockType,
} from '@wepublish/website/api';
import { BuilderYouTubeVideoBlockProps } from '@wepublish/website/builder';
import { useEffect, useState } from 'react';
import ReactPlayer from 'react-player';

export const isYouTubeVideoBlock = (
  block: Pick<BlockContent, '__typename'>
): block is YouTubeVideoBlockType => block.__typename === 'YouTubeVideoBlock';

export const YouTubeVideoBlockWrapper = styled('div')``;

export const YouTubeVideoBlockPlayer = styled(ReactPlayer)`
  width: 100%;
  aspect-ratio: 16/9;
`;

export function YouTubeVideoBlock({
  videoID,
  className,
}: BuilderYouTubeVideoBlockProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <YouTubeVideoBlockWrapper className={className}>
      {isMounted && (
        <YouTubeVideoBlockPlayer
          width={'auto'}
          height={'auto'}
          url={`https://www.youtube.com/watch?v=${videoID}`}
          controls={true}
        />
      )}
    </YouTubeVideoBlockWrapper>
  );
}
