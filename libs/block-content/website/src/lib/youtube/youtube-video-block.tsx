import styled from '@emotion/styled';
import {
  BlockContent,
  FullYouTubeVideoBlockFragment,
} from '@wepublish/website/api';
import { BuilderYouTubeVideoBlockProps } from '@wepublish/website/builder';
import ReactPlayer from 'react-player';

export const isYouTubeVideoBlock = (
  block: Pick<BlockContent, '__typename'>
): block is FullYouTubeVideoBlockFragment =>
  block.__typename === 'YouTubeVideoBlock';

export const YouTubeVideoBlockWrapper = styled('div')``;

export const YouTubeVideoBlockPlayer = styled(ReactPlayer)`
  width: 100%;
  aspect-ratio: 16/9;
`;

export function YouTubeVideoBlock({
  videoID,
  className,
}: BuilderYouTubeVideoBlockProps) {
  return (
    <YouTubeVideoBlockWrapper className={className}>
      <YouTubeVideoBlockPlayer
        width={'auto'}
        height={'auto'}
        src={`https://www.youtube.com/watch?v=${videoID}`}
        controls={true}
      />
    </YouTubeVideoBlockWrapper>
  );
}
