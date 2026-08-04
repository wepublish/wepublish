import styled from '@emotion/styled';
import {
  BlockContent,
  FullTwitterTweetBlockFragment,
} from '@wepublish/website/api';
import { BuilderTwitterTweetBlockProps } from '@wepublish/website/builder';
import { Tweet } from 'react-tweet';

export const isTwitterTweetBlock = (
  block: Pick<BlockContent, '__typename'>
): block is FullTwitterTweetBlockFragment =>
  block.__typename === 'TwitterTweetBlock';

export const TwitterTweetBlockWrapper = styled('div')``;

export function TwitterTweetBlock({
  userID,
  tweetID,
  className,
}: BuilderTwitterTweetBlockProps) {
  if (!tweetID) {
    return null;
  }

  return (
    <TwitterTweetBlockWrapper
      className={className}
      data-theme="dark"
    >
      <Tweet id={tweetID} />
    </TwitterTweetBlockWrapper>
  );
}
