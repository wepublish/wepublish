import {styled} from '@mui/material'
import {Block, TwitterTweetBlock as TwitterTweetBlockType} from '@wepublish/website/api'
import {BuilderTwitterTweetBlockProps} from '@wepublish/website/builder'

export const isTwitterTweetBlock = (block: Block): block is TwitterTweetBlockType =>
  block.__typename === 'TwitterTweetBlock'

export const TwitterTweetBlockWrapper = styled('div')``

export function TwitterTweetBlock({userID, tweetID, className}: BuilderTwitterTweetBlockProps) {
  return <TwitterTweetBlockWrapper className={className}></TwitterTweetBlockWrapper>
}
