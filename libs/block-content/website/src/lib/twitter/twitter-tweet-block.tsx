import styled from '@emotion/styled'
import {useReadingList} from '@wepublish/reading-list/website'
import {BlockContent, TwitterTweetBlock as TwitterTweetBlockType} from '@wepublish/website/api'
import {BuilderTwitterTweetBlockProps} from '@wepublish/website/builder'
import {Tweet} from 'react-tweet'

export const isTwitterTweetBlock = (
  block: Pick<BlockContent, '__typename'>
): block is TwitterTweetBlockType => block.__typename === 'TwitterTweetBlock'

export const TwitterTweetBlockWrapper = styled('div')``

export function TwitterTweetBlock({userID, tweetID, className}: BuilderTwitterTweetBlockProps) {
  const [readingListProps] = useReadingList()

  if (!tweetID) {
    return null
  }

  return (
    <TwitterTweetBlockWrapper className={className} data-theme="dark" {...readingListProps}>
      <Tweet id={tweetID} />
    </TwitterTweetBlockWrapper>
  )
}
