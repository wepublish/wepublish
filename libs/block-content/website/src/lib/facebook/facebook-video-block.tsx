import styled from '@emotion/styled';
import {
  FullBlockFragment,
  FullFacebookVideoBlockFragment,
} from '@wepublish/website/api';
import { BuilderFacebookVideoBlockProps } from '@wepublish/website/builder';

export const isFacebookVideoBlock = (
  block: Partial<Pick<FullBlockFragment, '__typename'>>
): block is FullFacebookVideoBlockFragment =>
  block.__typename === 'FacebookVideoBlock';

export const FacebookVideoBlockWrapper = styled('div')`
  display: grid;
  justify-content: center;
`;

export const FacebookVideoBlockPlayer = styled('iframe')`
  width: 100%;
  aspect-ratio: 16/9;
  border: 0;
`;

export const FacebookVideoBlock = ({
  userID,
  videoID,
  className,
}: BuilderFacebookVideoBlockProps) => {
  const videoUrl = `https://www.facebook.com/${userID}/videos/${videoID}/`;

  return (
    <FacebookVideoBlockWrapper className={className}>
      <FacebookVideoBlockPlayer
        src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(videoUrl)}&show_text=false`}
        title="Embedded Facebook Video"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        allowFullScreen
      />
    </FacebookVideoBlockWrapper>
  );
};
