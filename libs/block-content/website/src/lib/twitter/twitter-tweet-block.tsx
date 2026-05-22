import styled from '@emotion/styled';
import {
  BlockContent,
  TwitterTweetBlock as TwitterTweetBlockType,
} from '@wepublish/website/api';
import { BuilderTwitterTweetBlockProps } from '@wepublish/website/builder';
import { Component, PropsWithChildren } from 'react';
import { Tweet } from 'react-tweet';

class TweetErrorBoundary extends Component<
  PropsWithChildren,
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

export const isTwitterTweetBlock = (
  block: Pick<BlockContent, '__typename'>
): block is TwitterTweetBlockType => block.__typename === 'TwitterTweetBlock';

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
      <TweetErrorBoundary>
        <Tweet id={tweetID} />
      </TweetErrorBoundary>
    </TwitterTweetBlockWrapper>
  );
}
