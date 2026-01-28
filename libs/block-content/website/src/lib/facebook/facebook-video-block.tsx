import styled from '@emotion/styled';
import {
  BlockContent,
  FacebookVideoBlock as FacebookVideoBlockType,
} from '@wepublish/website/api';
import { BuilderFacebookVideoBlockProps } from '@wepublish/website/builder';
import ReactPlayer from 'react-player';
import { useId } from 'react';

export const isFacebookVideoBlock = (
  block: Pick<BlockContent, '__typename'>
): block is FacebookVideoBlockType => block.__typename === 'FacebookVideoBlock';

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
  const id = useId();
  return (
    <FacebookVideoBlockWrapper className={className}>
      <FacebookVideoBlockPlayer
        width={'auto'}
        height={'auto'}
        url={`https://www.facebook.com/${userID}/videos/${videoID}/`}
        controls={true}
        config={{ facebook: { playerId: id } }}
      />
    </FacebookVideoBlockWrapper>
  );
};
