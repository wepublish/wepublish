import styled from '@emotion/styled';
import {
  BlockContent,
  FullFacebookVideoBlockFragment,
} from '@wepublish/website/api';
import { BuilderFacebookVideoBlockProps } from '@wepublish/website/builder';
import ReactPlayer from 'react-player';

export const isFacebookVideoBlock = (
  block: Pick<BlockContent, '__typename'>
): block is FullFacebookVideoBlockFragment =>
  block.__typename === 'FacebookVideoBlock';

export const FacebookVideoBlockWrapper = styled('div')`
  display: grid;
  justify-content: center;
`;

export const FacebookVideoBlockPlayer = styled(ReactPlayer)``;

export const FacebookVideoBlock = ({
  userID,
  videoID,
  className,
}: BuilderFacebookVideoBlockProps) => {
  return (
    <FacebookVideoBlockWrapper className={className}>
      <FacebookVideoBlockPlayer
        width={'auto'}
        height={'auto'}
        src={`https://www.facebook.com/${userID}/videos/${videoID}/`}
        controls={true}
      />
    </FacebookVideoBlockWrapper>
  );
};
