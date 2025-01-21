import styled from '@emotion/styled'
import {Block, TwitterTweetBlock as TwitterTweetBlockType} from '@wepublish/website/api'
import {BuilderTwitterTweetBlockProps} from '@wepublish/website/builder'
import {Tweet} from 'react-tweet'

export const isTwitterTweetBlock = (block: Block): block is TwitterTweetBlockType =>
  block.__typename === 'TwitterTweetBlock'

export const TwitterTweetBlockWrapper = styled('div')``

export function TwitterTweetBlock({userID, tweetID, className}: BuilderTwitterTweetBlockProps) {
  return (
    <TwitterTweetBlockWrapper className={className} data-theme="dark">
      <Tweet id={tweetID} />
    </TwitterTweetBlockWrapper>
  )
}
