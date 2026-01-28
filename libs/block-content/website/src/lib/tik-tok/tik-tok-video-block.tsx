import styled from '@emotion/styled';
import { BuilderTikTokVideoBlockProps } from '@wepublish/website/builder';
import {
  BlockContent,
  TikTokVideoBlock as TikTokVideoBlockType,
} from '@wepublish/website/api';

export const isTikTokVideoBlock = (
  block: Pick<BlockContent, '__typename'>
): block is TikTokVideoBlockType => block.__typename === 'TikTokVideoBlock';

export const TikTokVideoBlockWrapper = styled('div')`
  display: grid;
  justify-content: center;
`;

export const TikTokVideoBlockPlayer = styled('iframe')`
  width: 325px;
  aspect-ratio: calc(
    1 / 1.77 - 0.15
  ); // 1/1.77 is the tiktok video ratio and 0.15 for the description
  border: 0;
`;

export function TikTokVideoBlock({
  videoID,
  className,
}: BuilderTikTokVideoBlockProps) {
  return (
    <TikTokVideoBlockWrapper className={className}>
      <TikTokVideoBlockPlayer
        src={`https://www.tiktok.com/embed/v2/${videoID}`}
        allowFullScreen
        title="Embedded TikTok Video"
        allow="encrypted-media;"
      />
    </TikTokVideoBlockWrapper>
  );
}
