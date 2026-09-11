import styled from '@emotion/styled';
import {
  BlockContent,
  FullVimeoVideoBlockFragment,
} from '@wepublish/website/api';
import { BuilderVimeoVideoBlockProps } from '@wepublish/website/builder';
import ReactPlayer from 'react-player';

export const isVimeoVideoBlock = (
  block: Pick<BlockContent, '__typename'>
): block is FullVimeoVideoBlockFragment =>
  block.__typename === 'VimeoVideoBlock';

export const VimeoVideoBlockWrapper = styled('div')``;

export const VimeoVideoBlockPlayer = styled(ReactPlayer)`
  width: 100%;
  aspect-ratio: 16/9;
`;
export function VimeoVideoBlock({
  videoID,
  className,
}: BuilderVimeoVideoBlockProps) {
  return (
    <VimeoVideoBlockWrapper className={className}>
      <VimeoVideoBlockPlayer
        controls={true}
        src={`https://vimeo.com/${videoID}`}
        width="auto"
        height="auto"
      />
    </VimeoVideoBlockWrapper>
  );
}
